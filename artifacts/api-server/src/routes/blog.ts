import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, blogSubscribersTable } from "@workspace/db";
import { SubscribeToBlogBody } from "@workspace/api-zod";
import { shortId } from "../lib/ids";

const router: IRouter = Router();

const RATE_LIMIT_PER_HOUR = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const ipBuckets = new Map<string, number[]>();

function consumeRateToken(ip: string): boolean {
  const now = Date.now();
  const arr = (ipBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (arr.length >= RATE_LIMIT_PER_HOUR) {
    ipBuckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  ipBuckets.set(ip, arr);
  return true;
}

router.post("/subscribe", async (req, res, next) => {
  try {
    // Use req.ip (Express resolves it from the trusted proxy hop set in
    // app.ts via `trust proxy`). Never read x-forwarded-for directly — it's
    // spoofable.
    const ip = req.ip || "unknown";
    if (!consumeRateToken(ip)) {
      res
        .status(429)
        .json({ error: "rate_limited", message: "Too many subscribe attempts. Try again later." });
      return;
    }

    const parsed = SubscribeToBlogBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "invalid_input", message: "Please provide a valid email address." });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const source = parsed.data.source;

    const existing = await db
      .select()
      .from(blogSubscribersTable)
      .where(eq(blogSubscribersTable.email, email))
      .limit(1);

    if (existing[0]) {
      // If previously unsubscribed, re-subscribe.
      if (existing[0].status !== "subscribed") {
        await db
          .update(blogSubscribersTable)
          .set({
            status: "subscribed",
            unsubscribedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(blogSubscribersTable.id, existing[0].id));
        req.log.info({ email, source }, "blog: re-subscribed existing email");
        res.json({ ok: true, alreadySubscribed: false });
        return;
      }
      req.log.info({ email, source }, "blog: subscribe already-subscribed email");
      res.json({ ok: true, alreadySubscribed: true });
      return;
    }

    await db.insert(blogSubscribersTable).values({
      id: shortId("sub"),
      email,
      source,
      status: "subscribed",
    });
    req.log.info({ email, source }, "blog: new subscriber");
    res.json({ ok: true, alreadySubscribed: false });
  } catch (err) {
    next(err);
  }
});

export default router;
