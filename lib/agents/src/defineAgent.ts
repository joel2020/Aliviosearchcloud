import type { z } from "zod";
import type { AgentDefinition } from "./types";

/** Identity helper that preserves precise generic types for each agent module. */
export function defineAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  spec: AgentDefinition<I, O>,
): AgentDefinition<I, O> {
  return spec;
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
