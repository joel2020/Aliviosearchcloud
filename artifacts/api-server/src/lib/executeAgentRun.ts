import {
  type AgentDefinition,
  type AgentRunContext,
} from "@workspace/agents";
import {
  AzureOpenAINotConfiguredError,
  getAzureOpenAIClient,
  type AzureOpenAIClient,
} from "@workspace/azure-openai";
import type { Business, User, AgentRun } from "@workspace/db";
import { persistAgentRun } from "./agentRunStore";

interface PinoLikeLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export interface ExecuteAgentRunArgs {
  agent: AgentDefinition;
  rawInput: unknown;
  user: User;
  business: Business;
  log: PinoLikeLogger;
  /** Override Azure client (for testing / smoke-test reuse). */
  ai?: AzureOpenAIClient | null;
}

export interface ExecuteAgentRunResult {
  /** Persisted DB row (always created — even for not_configured/failed). */
  run: AgentRun;
  /** Latency from start of executor to completion. */
  latencyMs: number;
  /** Tokens used (0 if Azure was not invoked). */
  tokensUsed: number;
}

function adaptLogger(log: PinoLikeLogger) {
  return {
    info: (...args: unknown[]) => log.info(...args),
    warn: (...args: unknown[]) => log.warn(...args),
    error: (...args: unknown[]) => log.error(...args),
    debug: (...args: unknown[]) => log.debug(...args),
  };
}

/**
 * Single source of truth for executing an agent. Used by both the
 * `POST /api/agents/:id/run` route and the admin smoke-test, so every
 * execution path produces an `agent_runs` row and a structured log line.
 */
export async function executeAgentRun(
  args: ExecuteAgentRunArgs,
): Promise<ExecuteAgentRunResult> {
  const { agent, rawInput, user, business, log } = args;
  const inputJson = (rawInput ?? {}) as Record<string, unknown>;
  const startedAt = Date.now();

  let ai: AzureOpenAIClient | null = args.ai ?? null;
  if (!ai) {
    try {
      ai = getAzureOpenAIClient();
    } catch (err) {
      if (err instanceof AzureOpenAINotConfiguredError) {
        const persisted = await persistAgentRun({
          businessId: business.id,
          userId: user.id,
          agentSlug: agent.id,
          status: "not_configured",
          input: inputJson,
          output: null,
          errorMessage: err.message,
        });
        const latencyMs = Date.now() - startedAt;
        log.warn(
          {
            agentId: agent.id,
            promptVersion: agent.promptVersion,
            businessId: business.id,
            status: "not_configured",
            latencyMs,
            tokensUsed: 0,
          },
          "agent_run",
        );
        return { run: persisted, latencyMs, tokensUsed: 0 };
      }
      throw err;
    }
  }

  const ctx: AgentRunContext = {
    business,
    user,
    ai,
    log: adaptLogger(log),
  };

  const result = await agent.run(rawInput, ctx);
  const latencyMs = Date.now() - startedAt;

  if (result.status === "ok") {
    const persisted = await persistAgentRun({
      businessId: business.id,
      userId: user.id,
      agentSlug: agent.id,
      status: "ok",
      input: inputJson,
      output: result.output,
      tokensUsed: result.tokensUsed,
    });
    log.info(
      {
        agentId: agent.id,
        promptVersion: agent.promptVersion,
        businessId: business.id,
        status: "ok",
        latencyMs,
        tokensUsed: result.tokensUsed,
      },
      "agent_run",
    );
    return { run: persisted, latencyMs, tokensUsed: result.tokensUsed };
  }

  const detailedMessage =
    result.status === "invalid_input" && result.issues?.length
      ? `${result.errorMessage} (${result.issues.join("; ")})`
      : result.errorMessage;
  const persisted = await persistAgentRun({
    businessId: business.id,
    userId: user.id,
    agentSlug: agent.id,
    status: result.status,
    input: inputJson,
    output: null,
    errorMessage: detailedMessage,
  });
  log.warn(
    {
      agentId: agent.id,
      promptVersion: agent.promptVersion,
      businessId: business.id,
      status: result.status,
      latencyMs,
      tokensUsed: 0,
    },
    "agent_run",
  );
  return { run: persisted, latencyMs, tokensUsed: 0 };
}
