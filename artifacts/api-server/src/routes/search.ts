import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  agentRunsTable,
  assistantConversationsTable,
} from "@workspace/db";
import { agentRegistry } from "@workspace/agents";
import { SearchWorkspaceQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";

const router: IRouter = Router();

const SETTINGS_INDEX = [
  {
    label: "Workspace settings",
    href: "/settings",
    description: "Business profile, branding, and team.",
  },
  {
    label: "Business profile",
    href: "/settings",
    description: "Update name, industry, website, brand color.",
  },
  {
    label: "Search Cloud",
    href: "/search",
    description: "Search every agent run and conversation.",
  },
  {
    label: "Business Assistant",
    href: "/assistant",
    description: "Conversational AI partner across your workspace.",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "KPIs, recent activity, and suggested next actions.",
  },
];

function previewFromRun(run: {
  status: string;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  input: Record<string, unknown> | null;
}): string {
  if (run.errorMessage) return run.errorMessage;
  if (run.output && typeof run.output === "object") {
    for (const v of Object.values(run.output)) {
      if (typeof v === "string" && v.trim()) return v.slice(0, 240);
    }
    try {
      return JSON.stringify(run.output).slice(0, 240);
    } catch {
      // fallthrough
    }
  }
  if (run.input && typeof run.input === "object") {
    try {
      return JSON.stringify(run.input).slice(0, 240);
    } catch {
      // fallthrough
    }
  }
  return run.status;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = SearchWorkspaceQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "invalid_query",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const q = parsed.data.q.trim();
    if (!q) {
      res.json({ query: "", agents: [], runs: [], conversations: [], settings: [] });
      return;
    }

    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    const needle = q.toLowerCase();
    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

    const summaries = agentRegistry.summaries();
    const agentHits = summaries
      .filter(
        (a) =>
          a.id.toLowerCase().includes(needle) ||
          a.name.toLowerCase().includes(needle) ||
          a.description.toLowerCase().includes(needle),
      )
      .slice(0, 8)
      .map((a) => ({ id: a.id, name: a.name, description: a.description }));

    const [runRows, convoRows] = await Promise.all([
      db
        .select()
        .from(agentRunsTable)
        .where(
          and(
            eq(agentRunsTable.businessId, business.id),
            or(
              ilike(agentRunsTable.agentSlug, like),
              ilike(agentRunsTable.status, like),
              sql`${agentRunsTable.input}::text ilike ${like}`,
              sql`${agentRunsTable.output}::text ilike ${like}`,
            ),
          ),
        )
        .orderBy(desc(agentRunsTable.startedAt))
        .limit(8),
      db
        .select()
        .from(assistantConversationsTable)
        .where(
          and(
            eq(assistantConversationsTable.businessId, business.id),
            or(
              ilike(assistantConversationsTable.title, like),
              ilike(assistantConversationsTable.channel, like),
            ),
          ),
        )
        .orderBy(desc(assistantConversationsTable.updatedAt))
        .limit(8),
    ]);

    const nameById = new Map(summaries.map((a) => [a.id, a.name]));
    const runHits = runRows.map((r) => ({
      id: r.id,
      agentSlug: r.agentSlug,
      agentName: nameById.get(r.agentSlug) ?? r.agentSlug,
      status: r.status,
      preview: previewFromRun({
        status: r.status,
        output: r.output ?? null,
        errorMessage: r.errorMessage,
        input: r.input ?? null,
      }),
      startedAt: r.startedAt.toISOString(),
    }));

    const convoHits = convoRows.map((c) => ({
      id: c.id,
      title: c.title ?? "Untitled conversation",
      channel: c.channel,
      updatedAt: c.updatedAt.toISOString(),
    }));

    const settingsHits = SETTINGS_INDEX.filter(
      (s) =>
        s.label.toLowerCase().includes(needle) ||
        s.description.toLowerCase().includes(needle),
    );

    res.json({
      query: q,
      agents: agentHits,
      runs: runHits,
      conversations: convoHits,
      settings: settingsHits,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
