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
  ai?: AzureOpenAIClient | null;
}

export interface ExecuteAgentRunResult {
  run: AgentRun;
  latencyMs: number;
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
 *
 * `startedAt` is captured before any work begins and `completedAt` is
 * captured immediately before persistence, so the DB timestamps reflect
 * true execution boundaries rather than persistence time.
 */
export async function executeAgentRun(
  args: ExecuteAgentRunArgs,
): Promise<ExecuteAgentRunResult> {
  const { agent, rawInput, user, business, log } = args;
  const inputJson = (rawInput ?? {}) as Record<string, unknown>;
  const startedAt = new Date();
  const startedAtMs = startedAt.getTime();

  let ai: AzureOpenAIClient | null = args.ai ?? null;
  if (!ai) {
    try {
      ai = getAzureOpenAIClient();
    } catch (err) {
      if (err instanceof AzureOpenAINotConfiguredError) {
        const completedAt = new Date();
        const latencyMs = completedAt.getTime() - startedAtMs;
        const persisted = await persistAgentRun({
          businessId: business.id,
          userId: user.id,
          agentSlug: agent.id,
          status: "not_configured",
          input: inputJson,
          output: null,
          errorMessage: err.message,
          startedAt,
          completedAt,
        });
        log.warn(
          {
            agentId: agent.id,
            promptVersion: agent.promptVersion,
            businessId: business.id,
            status: "not_configured",
            success: false,
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
  const completedAt = new Date();
  const latencyMs = completedAt.getTime() - startedAtMs;

  if (result.status === "ok") {
    const persisted = await persistAgentRun({
      businessId: business.id,
      userId: user.id,
      agentSlug: agent.id,
      status: "ok",
      input: inputJson,
      output: result.output,
      tokensUsed: result.tokensUsed,
      startedAt,
      completedAt,
    });
    log.info(
      {
        agentId: agent.id,
        promptVersion: agent.promptVersion,
        businessId: business.id,
        status: "ok",
        success: true,
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
    startedAt,
    completedAt,
  });
  log.warn(
    {
      agentId: agent.id,
      promptVersion: agent.promptVersion,
      businessId: business.id,
      status: result.status,
      success: false,
      latencyMs,
      tokensUsed: 0,
    },
    "agent_run",
  );
  return { run: persisted, latencyMs, tokensUsed: 0 };
}
