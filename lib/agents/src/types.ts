import type { z, ZodTypeAny } from "zod";
import type { AzureOpenAIClient } from "@workspace/azure-openai";
import type { Business, User } from "@workspace/db";

/** Structural logger so this lib does not depend on pino. */
export interface AgentLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export interface AgentRunContext {
  business: Business;
  user: User;
  ai: AzureOpenAIClient;
  log: AgentLogger;
}

export interface AgentDefinition<
  TInput extends ZodTypeAny = ZodTypeAny,
  TOutput extends ZodTypeAny = ZodTypeAny,
> {
  id: string;
  name: string;
  description: string;
  /**
   * Documentation hint for downstream UIs:
   *   - "structured": output is rendered as data (cards / tables) using the
   *     fields of `outputSchema`.
   *   - "text": output is primarily a single prose field (typically
   *     `summary`) and should be rendered as chat/markdown.
   * Execution itself is identical for both modes — the agent always runs
   * in JSON mode and the response is validated against `outputSchema`.
   */
  mode: "structured" | "text";
  inputSchema: TInput;
  outputSchema: TOutput;
  systemPrompt: string;
  /** Build the user message from validated input + business context. */
  buildUserMessage: (input: z.infer<TInput>, ctx: AgentRunContext) => string;
  /** Tiny canned input used by the admin smoke-test endpoint. Uses the input
   * (pre-parse) shape so optional fields with `.default()` may be omitted. */
  smokeInput: z.input<TInput>;
  /** Versioned prompt identifier (e.g. "revenue-leak@v1") for audit trails. */
  promptVersion: string;
  /** Optional: temperature override. Default 0.4. */
  temperature?: number;
  /** Optional: max tokens override. */
  maxTokens?: number;
  /**
   * Per-agent executor. Validates input against `inputSchema`, calls Azure
   * OpenAI through `ctx.ai`, and validates the JSON output against
   * `outputSchema`. Returned by every agent module via `defineAgent`.
   * Does NOT touch the database — persistence is the caller's job
   * (`executeAgentRun` in the api-server).
   */
  run: (
    rawInput: unknown,
    ctx: AgentRunContext,
  ) => Promise<import("./runner").RunAgentResult>;
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  mode: "structured" | "text";
}
