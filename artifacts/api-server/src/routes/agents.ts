import { Router, type IRouter } from "express";
import {
  agentRegistry,
  runAgent,
  type AgentRunContext,
} from "@workspace/agents";
import {
  AzureOpenAINotConfiguredError,
  getAzureOpenAIClient,
} from "@workspace/azure-openai";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { persistAgentRun, serializeAgentRun } from "../lib/agentRunStore";

const router: IRouter = Router();

router.get("/", requireAuth, (_req, res) => {
  res.json(agentRegistry.summaries());
});

router.post("/:id/run", requireAuth, async (req, res, next) => {
  const log = req.log;
  try {
    const id = req.params["id"];
    const agent = agentRegistry.get(String(id));
    if (!agent) {
      res
        .status(404)
        .json({ error: "agent_not_found", message: `Unknown agent id: ${id}` });
      return;
    }
    const body = req.body as { input?: unknown } | undefined;
    if (!body || typeof body !== "object" || !("input" in body)) {
      res.status(400).json({
        error: "invalid_body",
        message: "Body must be { input: {...} }.",
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    let ai;
    try {
      ai = getAzureOpenAIClient();
    } catch (err) {
      if (err instanceof AzureOpenAINotConfiguredError) {
        const persisted = await persistAgentRun({
          businessId: business.id,
          userId: user.id,
          agentSlug: agent.id,
          status: "not_configured",
          input: (body.input as Record<string, unknown>) ?? {},
          errorMessage: err.message,
        });
        log.warn(
          { agentId: agent.id, businessId: business.id },
          "Azure OpenAI not configured — agent run skipped.",
        );
        res.json(serializeAgentRun(persisted));
        return;
      }
      throw err;
    }

    const ctx: AgentRunContext = {
      business,
      user,
      ai,
      log: {
        info: (...args: unknown[]) => (log.info as (...a: unknown[]) => void)(...args),
        warn: (...args: unknown[]) => (log.warn as (...a: unknown[]) => void)(...args),
        error: (...args: unknown[]) => (log.error as (...a: unknown[]) => void)(...args),
        debug: (...args: unknown[]) => (log.debug as (...a: unknown[]) => void)(...args),
      },
    };

    const startedAt = Date.now();
    const result = await runAgent({ agent, rawInput: body.input, ctx });
    const latencyMs = Date.now() - startedAt;

    if (result.status === "ok") {
      const persisted = await persistAgentRun({
        businessId: business.id,
        userId: user.id,
        agentSlug: agent.id,
        status: "ok",
        input: (body.input as Record<string, unknown>) ?? {},
        output: result.output,
        tokensUsed: result.tokensUsed,
      });
      log.info(
        {
          agentId: agent.id,
          businessId: business.id,
          latencyMs: result.latencyMs,
          tokensUsed: result.tokensUsed,
          status: "ok",
        },
        "agent_run",
      );
      res.json(serializeAgentRun(persisted));
      return;
    }

    if (result.status === "invalid_input") {
      res.status(400).json({
        error: "invalid_input",
        message: result.errorMessage,
        ...(result.issues ? { issues: result.issues } : {}),
      });
      return;
    }

    const persisted = await persistAgentRun({
      businessId: business.id,
      userId: user.id,
      agentSlug: agent.id,
      status: result.status,
      input: (body.input as Record<string, unknown>) ?? {},
      errorMessage: result.errorMessage,
    });
    log.warn(
      {
        agentId: agent.id,
        businessId: business.id,
        status: result.status,
        latencyMs,
      },
      "agent_run_failed",
    );
    res.json(serializeAgentRun(persisted));
  } catch (err) {
    next(err);
  }
});

export default router;
