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
import { requireAdmin } from "../lib/admin";
import { ensureUser, ensureBusiness } from "../lib/ensure";

const router: IRouter = Router();

function previewOutput(value: unknown): string {
  try {
    const text =
      typeof value === "string" ? value : JSON.stringify(value);
    return text.length > 280 ? `${text.slice(0, 280)}…` : text;
  } catch {
    return String(value);
  }
}

router.post("/agents/smoke-test", requireAuth, requireAdmin, async (req, res, next) => {
  const log = req.log;
  try {
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "Admin smoke-test workspace");

    let ai;
    let aiAvailable = true;
    try {
      ai = getAzureOpenAIClient();
    } catch (err) {
      if (err instanceof AzureOpenAINotConfiguredError) {
        aiAvailable = false;
      } else {
        throw err;
      }
    }

    const startedAt = new Date();
    const results: Array<{
      id: string;
      name: string;
      status: "pass" | "fail" | "not_configured";
      latencyMs: number;
      error?: string | null;
      preview?: string | null;
    }> = [];

    for (const agent of agentRegistry.list()) {
      if (!aiAvailable || !ai) {
        results.push({
          id: agent.id,
          name: agent.name,
          status: "not_configured",
          latencyMs: 0,
          error: "Azure OpenAI is not configured.",
          preview: null,
        });
        continue;
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

      const t0 = Date.now();
      const result = await runAgent({
        agent,
        rawInput: agent.smokeInput,
        ctx,
      });
      const latencyMs = Date.now() - t0;

      if (result.status === "ok") {
        results.push({
          id: agent.id,
          name: agent.name,
          status: "pass",
          latencyMs,
          error: null,
          preview: previewOutput(result.output),
        });
      } else if (result.status === "not_configured") {
        results.push({
          id: agent.id,
          name: agent.name,
          status: "not_configured",
          latencyMs,
          error: result.errorMessage,
          preview: null,
        });
      } else {
        results.push({
          id: agent.id,
          name: agent.name,
          status: "fail",
          latencyMs,
          error: result.errorMessage,
          preview: null,
        });
      }
    }

    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const notConfigured = results.filter(
      (r) => r.status === "not_configured",
    ).length;

    log.info(
      { passed, failed, notConfigured, total: results.length },
      "admin_smoke_test_complete",
    );

    res.json({
      runAt: startedAt.toISOString(),
      passed,
      failed,
      notConfigured,
      results,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
