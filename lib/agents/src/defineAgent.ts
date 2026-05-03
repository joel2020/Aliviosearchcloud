import type { z } from "zod";
import type { AgentDefinition, AgentRunContext } from "./types";
import { runAgent, type RunAgentResult } from "./runner";

type AgentSpec<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = Omit<
  AgentDefinition<I, O>,
  "run"
>;

/**
 * Identity helper that:
 *   - preserves precise generic types for each agent module, and
 *   - automatically wires the per-agent `run(input, ctx)` executor so every
 *     agent module exposes the required contract without boilerplate.
 */
export function defineAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  spec: AgentSpec<I, O>,
): AgentDefinition<I, O> {
  const agent: AgentDefinition<I, O> = {
    ...spec,
    run: (rawInput: unknown, ctx: AgentRunContext): Promise<RunAgentResult> =>
      runAgent({ agent, rawInput, ctx }),
  };
  return agent;
}

/** Shared business-context block included in every agent's user message. */
export function businessContextBlock(ctx: {
  business: {
    name: string;
    industry: string | null;
    description: string | null;
    websiteUrl: string | null;
  };
}): string {
  return [
    `Business: ${ctx.business.name}`,
    `Industry: ${ctx.business.industry ?? "unspecified"}`,
    `Website: ${ctx.business.websiteUrl ?? "unspecified"}`,
    `Notes: ${ctx.business.description ?? "none"}`,
  ].join("\n");
}
