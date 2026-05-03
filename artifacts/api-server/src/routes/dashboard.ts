import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  agentRunsTable,
  assistantConversationsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { serializeAgentRun } from "../lib/agentRunStore";
import { serializeBusiness } from "../lib/serializeBusiness";

const router: IRouter = Router();

interface SuggestionDto {
  text: string;
  agentSlug: string | null;
  runId: string | null;
  source: string;
}

router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRow,
      weekRow,
      activeAgentsRow,
      recentRunsRows,
      latestLeakRows,
      conversationsRow,
    ] = await Promise.all([
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(agentRunsTable)
        .where(eq(agentRunsTable.businessId, business.id)),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(agentRunsTable)
        .where(
          and(
            eq(agentRunsTable.businessId, business.id),
            gte(agentRunsTable.startedAt, sevenDaysAgo),
          ),
        ),
      db
        .select({
          c: sql<number>`count(distinct ${agentRunsTable.agentSlug})::int`,
        })
        .from(agentRunsTable)
        .where(
          and(
            eq(agentRunsTable.businessId, business.id),
            gte(agentRunsTable.startedAt, thirtyDaysAgo),
          ),
        ),
      db
        .select()
        .from(agentRunsTable)
        .where(eq(agentRunsTable.businessId, business.id))
        .orderBy(desc(agentRunsTable.startedAt))
        .limit(5),
      db
        .select()
        .from(agentRunsTable)
        .where(
          and(
            eq(agentRunsTable.businessId, business.id),
            eq(agentRunsTable.agentSlug, "revenue-leak"),
            eq(agentRunsTable.status, "ok"),
          ),
        )
        .orderBy(desc(agentRunsTable.completedAt))
        .limit(1),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(assistantConversationsTable)
        .where(eq(assistantConversationsTable.businessId, business.id)),
    ]);

    const runsTotal = totalRow[0]?.c ?? 0;
    const runsThisWeek = weekRow[0]?.c ?? 0;
    const activeAgents = activeAgentsRow[0]?.c ?? 0;
    const conversations = conversationsRow[0]?.c ?? 0;

    const suggestions: SuggestionDto[] = [];
    let revenueLeaksIdentified = 0;

    const latestLeak = latestLeakRows[0];
    if (latestLeak?.output) {
      const out = latestLeak.output as Record<string, unknown>;
      const leaks = Array.isArray(out.leaks) ? (out.leaks as unknown[]) : [];
      revenueLeaksIdentified = leaks.length;
      const quickWins = Array.isArray(out.quickWins)
        ? (out.quickWins as unknown[])
        : [];
      for (const win of quickWins.slice(0, 3)) {
        if (typeof win === "string" && win.trim()) {
          suggestions.push({
            text: win,
            agentSlug: "revenue-leak",
            runId: latestLeak.id,
            source: "Latest Revenue Leak run",
          });
        }
      }
    }

    if (suggestions.length === 0) {
      // First-time empty state — nudge customer through a guided onboarding.
      suggestions.push(
        {
          text: "Run the Revenue Leak agent to find the highest-impact gaps in your funnel.",
          agentSlug: "revenue-leak",
          runId: null,
          source: "Suggested first step",
        },
        {
          text: "Draft a follow-up sequence for an open lead with the Follow-Up agent.",
          agentSlug: "follow-up",
          runId: null,
          source: "Suggested first step",
        },
        {
          text: "Generate a cold email tailored to your top prospect.",
          agentSlug: "cold-email",
          runId: null,
          source: "Suggested first step",
        },
      );
    }

    res.json({
      business: serializeBusiness(business),
      kpis: {
        runsThisWeek,
        runsTotal,
        activeAgents: Math.max(activeAgents, 0),
        revenueLeaksIdentified,
        conversations,
      },
      recentRuns: recentRunsRows.map(serializeAgentRun),
      suggestedActions: suggestions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
