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
  /** "structured" → JSON-mode + outputSchema validation. "text" → free-form text in `summary`. */
  mode: "structured" | "text";
  inputSchema: TInput;
  outputSchema: TOutput;
  systemPrompt: string;
  /** Build the user message from validated input + business context. */
  buildUserMessage: (input: z.infer<TInput>, ctx: AgentRunContext) => string;
  /** Tiny canned input used by the admin smoke-test endpoint. Uses the input
   * (pre-parse) shape so optional fields with `.default()` may be omitted. */
  smokeInput: z.input<TInput>;
  /** Optional: temperature override. Default 0.4. */
  temperature?: number;
  /** Optional: max tokens override. */
  maxTokens?: number;
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  mode: "structured" | "text";
}
