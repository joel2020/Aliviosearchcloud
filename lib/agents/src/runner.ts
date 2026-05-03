import { z } from "zod";
import {
  AzureOpenAINotConfiguredError,
  type AzureOpenAIClient,
} from "@workspace/azure-openai";
import type { AgentDefinition, AgentRunContext } from "./types";

export interface RunAgentArgs {
  agent: AgentDefinition;
  rawInput: unknown;
  ctx: AgentRunContext;
}

export interface RunAgentSuccess {
  status: "ok";
  output: Record<string, unknown>;
  tokensUsed: number;
  latencyMs: number;
}

export interface RunAgentFailure {
  status: "failed" | "not_configured" | "invalid_input";
  errorMessage: string;
  latencyMs: number;
  /** Populated for `invalid_input`. */
  issues?: string[];
}

export type RunAgentResult = RunAgentSuccess | RunAgentFailure;

/** Pure function — does NOT touch the database. The API layer persists `agent_runs`. */
export async function runAgent({
  agent,
  rawInput,
  ctx,
}: RunAgentArgs): Promise<RunAgentResult> {
  const startedAt = Date.now();

  const parsed = agent.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "invalid_input",
      errorMessage: "Input failed agent schema validation.",
      issues: parsed.error.issues.map(
        (i: z.ZodIssue) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
      latencyMs: Date.now() - startedAt,
    };
  }

  let completion;
  try {
    completion = await ctx.ai.chat({
      messages: [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: agent.buildUserMessage(parsed.data, ctx) },
      ],
      jsonMode: true,
      temperature: agent.temperature ?? 0.4,
      ...(agent.maxTokens ? { maxTokens: agent.maxTokens } : {}),
      user: ctx.user.id,
    });
  } catch (err) {
    if (err instanceof AzureOpenAINotConfiguredError) {
      return {
        status: "not_configured",
        errorMessage: err.message,
        latencyMs: Date.now() - startedAt,
      };
    }
    return {
      status: "failed",
      errorMessage: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - startedAt,
    };
  }

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return {
      status: "failed",
      errorMessage: `Agent returned non-JSON content: ${raw.slice(0, 200)}`,
      latencyMs: Date.now() - startedAt,
    };
  }

  const validated = agent.outputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      status: "failed",
      errorMessage: `Agent output failed schema validation: ${validated.error.issues
        .map((i: z.ZodIssue) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ")}`,
      latencyMs: Date.now() - startedAt,
    };
  }

  return {
    status: "ok",
    output: validated.data as Record<string, unknown>,
    tokensUsed: completion.usage?.total_tokens ?? 0,
    latencyMs: Date.now() - startedAt,
  };
}

/** Probe whether the underlying Azure client can be constructed at all. */
export function isAzureConfigured(ai: () => AzureOpenAIClient): boolean {
  try {
    ai();
    return true;
  } catch (err) {
    if (err instanceof AzureOpenAINotConfiguredError) return false;
    throw err;
  }
}
