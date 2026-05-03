import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  db,
  assistantConversationsTable,
  assistantMessagesTable,
  agentRunsTable,
  type AssistantConversation,
  type AssistantMessage,
} from "@workspace/db";
import { agentRegistry } from "@workspace/agents";
import {
  CreateAssistantConversationBody,
  PostAssistantMessageBody,
  GetAssistantConversationParams,
  DeleteAssistantConversationParams,
  PostAssistantMessageParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { executeAgentRun } from "../lib/executeAgentRun";
import { shortId } from "../lib/ids";

const router: IRouter = Router();

const DEFAULT_RATE_LIMIT_PER_MIN = 30;
const RATE_WINDOW_MS = 60_000;

function getRateLimit(): number {
  const raw = process.env.ASSISTANT_RATE_LIMIT_PER_MIN;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_RATE_LIMIT_PER_MIN;
}

const rateBuckets = new Map<string, number[]>();
function consumeRateToken(userId: string): boolean {
  const now = Date.now();
  const limit = getRateLimit();
  const arr = (rateBuckets.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (arr.length >= limit) {
    rateBuckets.set(userId, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(userId, arr);
  return true;
}

function serializeConversation(c: AssistantConversation) {
  return {
    id: c.id,
    businessId: c.businessId,
    userId: c.userId,
    title: c.title,
    channel: c.channel,
    agentMode: c.agentMode as
      | "general"
      | "revenue_recovery"
      | "outbound_sales"
      | "follow_up"
      | "proposal"
      | "seo_content",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function serializeMessage(m: AssistantMessage) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    userId: m.userId,
    businessId: m.businessId,
    channel: m.channel,
    role: m.role as "user" | "assistant" | "system" | "tool",
    content: m.content,
    agentMode: m.agentMode,
    metadata: (m.metadata ?? {}) as Record<string, unknown>,
    createdAt: m.createdAt.toISOString(),
  };
}

function deriveTitle(content: string): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
}

router.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const rows = await db
      .select()
      .from(assistantConversationsTable)
      .where(
        and(
          eq(assistantConversationsTable.businessId, business.id),
          eq(assistantConversationsTable.userId, user.id),
          isNull(assistantConversationsTable.deletedAt),
        ),
      )
      .orderBy(desc(assistantConversationsTable.updatedAt))
      .limit(100);
    res.json(rows.map(serializeConversation));
  } catch (err) {
    next(err);
  }
});

router.post("/conversations", requireAuth, async (req, res, next) => {
  try {
    const body = CreateAssistantConversationBody.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({
        error: "invalid_body",
        message: body.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const inserted = await db
      .insert(assistantConversationsTable)
      .values({
        id: shortId("conv"),
        businessId: business.id,
        userId: user.id,
        title: body.data.title ?? null,
        channel: "web",
        agentMode: body.data.agentMode ?? "general",
      })
      .returning();
    res.json(serializeConversation(inserted[0]!));
  } catch (err) {
    next(err);
  }
});

router.get("/conversations/:id", requireAuth, async (req, res, next) => {
  try {
    const params = GetAssistantConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const conv = await db
      .select()
      .from(assistantConversationsTable)
      .where(
        and(
          eq(assistantConversationsTable.id, params.data.id),
          eq(assistantConversationsTable.businessId, business.id),
          eq(assistantConversationsTable.userId, user.id),
          isNull(assistantConversationsTable.deletedAt),
        ),
      )
      .limit(1);
    if (!conv[0]) {
      res
        .status(404)
        .json({ error: "not_found", message: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(assistantMessagesTable)
      .where(eq(assistantMessagesTable.conversationId, conv[0].id))
      .orderBy(asc(assistantMessagesTable.createdAt));
    res.json({
      conversation: serializeConversation(conv[0]),
      messages: msgs.map(serializeMessage),
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/conversations/:id", requireAuth, async (req, res, next) => {
  try {
    const params = DeleteAssistantConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const updated = await db
      .update(assistantConversationsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(assistantConversationsTable.id, params.data.id),
          eq(assistantConversationsTable.businessId, business.id),
          eq(assistantConversationsTable.userId, user.id),
          isNull(assistantConversationsTable.deletedAt),
        ),
      )
      .returning({ id: assistantConversationsTable.id });
    if (!updated[0]) {
      res
        .status(404)
        .json({ error: "not_found", message: "Conversation not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post(
  "/conversations/:id/messages",
  requireAuth,
  async (req, res, next) => {
    try {
      const params = PostAssistantMessageParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({
          error: "invalid_params",
          message: params.error.issues.map((i) => i.message).join(", "),
        });
        return;
      }
      const body = PostAssistantMessageBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({
          error: "invalid_body",
          message: body.error.issues.map((i) => i.message).join(", "),
        });
        return;
      }

      const user = await ensureUser(req.clerkUserId!);
      const business = await ensureBusiness(user.id, "My business");

      if (!consumeRateToken(user.id)) {
        res.status(429).json({
          error: "rate_limited",
          message: `You've hit the per-minute assistant limit (${getRateLimit()}). Please wait a moment and try again.`,
        });
        return;
      }

      const conv = await db
        .select()
        .from(assistantConversationsTable)
        .where(
          and(
            eq(assistantConversationsTable.id, params.data.id),
            eq(assistantConversationsTable.businessId, business.id),
            eq(assistantConversationsTable.userId, user.id),
            isNull(assistantConversationsTable.deletedAt),
          ),
        )
        .limit(1);
      if (!conv[0]) {
        res
          .status(404)
          .json({ error: "not_found", message: "Conversation not found" });
        return;
      }

      const mode = body.data.agentMode ?? conv[0].agentMode ?? "general";
      const regenerate = body.data.regenerate === true;

      // For regenerate: drop the most recent assistant message + reuse the
      // existing user message instead of inserting a new one.
      if (regenerate) {
        const lastAssistant = await db
          .select()
          .from(assistantMessagesTable)
          .where(
            and(
              eq(assistantMessagesTable.conversationId, conv[0].id),
              eq(assistantMessagesTable.role, "assistant"),
            ),
          )
          .orderBy(desc(assistantMessagesTable.createdAt))
          .limit(1);
        if (lastAssistant[0]) {
          await db
            .delete(assistantMessagesTable)
            .where(eq(assistantMessagesTable.id, lastAssistant[0].id));
        }
      }

      let userMessage: AssistantMessage | null = null;
      if (!regenerate) {
        const insertedUser = await db
          .insert(assistantMessagesTable)
          .values({
            id: shortId("msg"),
            conversationId: conv[0].id,
            userId: user.id,
            businessId: business.id,
            channel: "web",
            role: "user",
            content: body.data.content,
            agentMode: mode,
            metadata: {},
          })
          .returning();
        userMessage = insertedUser[0]!;

        // Auto-title on the first message
        if (!conv[0].title) {
          await db
            .update(assistantConversationsTable)
            .set({ title: deriveTitle(body.data.content) })
            .where(eq(assistantConversationsTable.id, conv[0].id));
        }
      }

      // Build conversation history for the agent (real DB rows = no hallucination).
      const history = await db
        .select()
        .from(assistantMessagesTable)
        .where(eq(assistantMessagesTable.conversationId, conv[0].id))
        .orderBy(asc(assistantMessagesTable.createdAt));

      const agentHistory = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // The latest user turn is the trigger message; everything before is history.
      const triggerContent =
        agentHistory.length > 0 &&
        agentHistory[agentHistory.length - 1]!.role === "user"
          ? agentHistory[agentHistory.length - 1]!.content
          : body.data.content;
      const priorHistory =
        agentHistory.length > 0 &&
        agentHistory[agentHistory.length - 1]!.role === "user"
          ? agentHistory.slice(0, -1)
          : agentHistory;

      const businessAssistantAgent = agentRegistry.get("business-assistant");
      if (!businessAssistantAgent) {
        res.status(500).json({
          error: "agent_missing",
          message: "Business Assistant agent is not registered.",
        });
        return;
      }

      // Pull recent agent runs to enrich business context
      const recentRunRows = await db
        .select()
        .from(agentRunsTable)
        .where(eq(agentRunsTable.businessId, business.id))
        .orderBy(desc(agentRunsTable.startedAt))
        .limit(5);
      const recentRuns = recentRunRows.map((r) => {
        const out = (r.output ?? {}) as { summary?: string };
        return {
          agentSlug: r.agentSlug,
          status: r.status,
          completedAt: r.completedAt
            ? r.completedAt.toISOString()
            : null,
          summary:
            typeof out.summary === "string" ? out.summary.slice(0, 240) : "",
        };
      });

      // SSE streaming when ?stream=1
      const wantStream = req.query.stream === "1";
      if (wantStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();
        const sendEvent = (event: string, data: unknown) => {
          res.write(`event: ${event}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        if (userMessage) {
          sendEvent("user_message", serializeMessage(userMessage));
        }

        const { run } = await executeAgentRun({
          agent: businessAssistantAgent,
          rawInput: {
            message: triggerContent,
            history: priorHistory,
            mode,
            recentRuns,
          },
          user,
          business,
          log: req.log,
        });

        if (run.status === "not_configured") {
          sendEvent("error", {
            error: "assistant_not_configured",
            message:
              "Assistant not configured — Azure OpenAI credentials are missing.",
          });
          res.end();
          return;
        }
        if (run.status !== "ok") {
          sendEvent("error", {
            error: "assistant_failed",
            message: "Assistant run failed.",
          });
          res.end();
          return;
        }

        const output = (run.output ?? {}) as {
          summary?: string;
          suggestedActions?: string[];
        };
        const reply = output.summary?.trim() ?? "";
        const suggestedActions = Array.isArray(output.suggestedActions)
          ? output.suggestedActions.filter((s) => typeof s === "string")
          : [];

        // Stream the reply word-by-word so the UI can render progressively
        const tokens = reply.split(/(\s+)/);
        for (const tok of tokens) {
          sendEvent("chunk", { delta: tok });
        }

        const insertedAssistant = await db
          .insert(assistantMessagesTable)
          .values({
            id: shortId("msg"),
            conversationId: conv[0].id,
            userId: user.id,
            businessId: business.id,
            channel: "web",
            role: "assistant",
            content: reply || "(no reply generated)",
            agentMode: mode,
            metadata: {
              agentRunId: run.id,
              tokensUsed: run.tokensUsed,
              suggestedActions,
              promptVersion: businessAssistantAgent.promptVersion,
              agentRunStatus: run.status,
            },
          })
          .returning();
        const refreshed = await db
          .update(assistantConversationsTable)
          .set({ updatedAt: new Date(), agentMode: mode })
          .where(eq(assistantConversationsTable.id, conv[0].id))
          .returning();
        sendEvent("assistant_message", serializeMessage(insertedAssistant[0]!));
        sendEvent("done", {
          conversation: serializeConversation(refreshed[0] ?? conv[0]),
          suggestedActions,
        });
        res.end();
        return;
      }

      const { run } = await executeAgentRun({
        agent: businessAssistantAgent,
        rawInput: {
          message: triggerContent,
          history: priorHistory,
          mode,
          recentRuns,
        },
        user,
        business,
        log: req.log,
      });

      if (run.status === "not_configured") {
        res.status(503).json({
          error: "assistant_not_configured",
          message:
            "Assistant not configured — Azure OpenAI credentials are missing.",
        });
        return;
      }
      if (run.status !== "ok") {
        req.log.error(
          { agentRunId: run.id, errorMessage: run.errorMessage },
          "business-assistant run failed",
        );
        res.status(502).json({
          error: "assistant_failed",
          message: "Assistant run failed. Please try again.",
        });
        return;
      }

      const output = (run.output ?? {}) as {
        summary?: string;
        suggestedActions?: string[];
      };
      const reply = output.summary?.trim() ?? "";
      const suggestedActions = Array.isArray(output.suggestedActions)
        ? output.suggestedActions.filter((s) => typeof s === "string")
        : [];

      const insertedAssistant = await db
        .insert(assistantMessagesTable)
        .values({
          id: shortId("msg"),
          conversationId: conv[0].id,
          userId: user.id,
          businessId: business.id,
          channel: "web",
          role: "assistant",
          content: reply || "(no reply generated)",
          agentMode: mode,
          metadata: {
            agentRunId: run.id,
            tokensUsed: run.tokensUsed,
            suggestedActions,
            promptVersion: businessAssistantAgent.promptVersion,
            agentRunStatus: run.status,
          },
        })
        .returning();

      const refreshed = await db
        .update(assistantConversationsTable)
        .set({ updatedAt: new Date(), agentMode: mode })
        .where(eq(assistantConversationsTable.id, conv[0].id))
        .returning();

      res.json({
        conversation: serializeConversation(refreshed[0] ?? conv[0]),
        userMessage: userMessage ? serializeMessage(userMessage) : null,
        assistantMessage: serializeMessage(insertedAssistant[0]!),
        suggestedActions,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
