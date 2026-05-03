import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, agentRunsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";
import { serializeAgentRun } from "../lib/agentRunStore";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const limitRaw = Number(req.query["limit"] ?? 25);
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 25),
    );
    const agentId =
      typeof req.query["agentId"] === "string" ? req.query["agentId"] : undefined;

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
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");
    const id = String(req.params["id"]);

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
