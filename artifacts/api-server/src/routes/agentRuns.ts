import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, agentRunsTable } from "@workspace/db";
import { ListAgentRunsQueryParams, GetAgentRunParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { serializeAgentRun } from "../lib/agentRunStore";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const query = ListAgentRunsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({
        error: "invalid_query",
        message: query.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const limit = query.data.limit ?? 25;
    const agentId = query.data.agentId;

    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    const where = agentId
      ? and(
          eq(agentRunsTable.businessId, business.id),
          eq(agentRunsTable.agentSlug, agentId),
        )
      : eq(agentRunsTable.businessId, business.id);

    const rows = await db
      .select()
      .from(agentRunsTable)
      .where(where)
      .orderBy(desc(agentRunsTable.startedAt))
      .limit(limit);

    res.json(rows.map(serializeAgentRun));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const params = GetAgentRunParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: "invalid_params",
        message: params.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const id = params.data.id;

    const rows = await db
      .select()
      .from(agentRunsTable)
      .where(
        and(
          eq(agentRunsTable.id, id),
          eq(agentRunsTable.businessId, business.id),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      res
        .status(404)
        .json({ error: "not_found", message: `Agent run ${id} not found` });
      return;
    }
    res.json(serializeAgentRun(row));
  } catch (err) {
    next(err);
  }
});

export default router;
