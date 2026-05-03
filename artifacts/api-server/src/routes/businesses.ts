import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { UpdateCurrentBusinessBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureUser, ensureBusiness } from "../lib/ensure";

const router: IRouter = Router();

function serializeBusiness(b: typeof businessesTable.$inferSelect) {
  return {
    id: b.id,
    ownerId: b.ownerId,
    name: b.name,
    slug: b.slug,
    industry: b.industry,
    websiteUrl: b.websiteUrl,
    description: b.description,
    brandColor: b.brandColor,
    logoUrl: b.logoUrl,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

router.get("/current", requireAuth, async (req, res, next) => {
  try {
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(
      user.id,
      user.fullName
        ? `${user.fullName.split(" ")[0]}'s Workspace`
        : "My business",
    );
    res.json(serializeBusiness(business));
  } catch (err) {
    next(err);
  }
});

router.patch("/current", requireAuth, async (req, res, next) => {
  try {
    const parsed = UpdateCurrentBusinessBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "invalid_body",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const user = await ensureUser(req.clerkUserId!);
    const business = await ensureBusiness(user.id, "My business");

    const updated = await db
      .update(businessesTable)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, business.id))
      .returning();
    res.json(serializeBusiness(updated[0]!));
  } catch (err) {
    next(err);
  }
});

export default router;
