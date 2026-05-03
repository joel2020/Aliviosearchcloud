import { db, agentRunsTable, type AgentRun } from "@workspace/db";
import { shortId } from "./ids";

export function serializeAgentRun(r: AgentRun) {
  return {
    id: r.id,
    businessId: r.businessId,
    userId: r.userId,
    agentSlug: r.agentSlug,
    status: r.status,
    input: r.input ?? null,
    output: r.output ?? null,
    errorMessage: r.errorMessage,
    tokensUsed: r.tokensUsed,
    startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  };
}

export interface PersistAgentRunArgs {
  businessId: string;
  userId: string;
  agentSlug: string;
  status: "ok" | "failed" | "not_configured" | "invalid_input";
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  errorMessage?: string | null;
  tokensUsed?: number;
}

export async function persistAgentRun(
  args: PersistAgentRunArgs,
): Promise<AgentRun> {
  const now = new Date();
  const inserted = await db
    .insert(agentRunsTable)
    .values({
      id: shortId("run"),
      businessId: args.businessId,
      userId: args.userId,
      agentSlug: args.agentSlug,
      status: args.status,
      input: args.input,
      output: args.output ?? {},
      errorMessage: args.errorMessage ?? null,
      tokensUsed: args.tokensUsed ?? 0,
      startedAt: now,
      completedAt: now,
    })
    .returning();
  return inserted[0]!;
}
