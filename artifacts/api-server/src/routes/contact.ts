import { Router, type IRouter } from "express";
import { db, contactSubmissionsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";
import { shortId } from "../lib/ids";

const router: IRouter = Router();

const RATE_LIMIT_PER_HOUR = 10;
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

router.post("/submit", async (req, res, next) => {
  try {
    // Use req.ip (Express resolves it from the trusted proxy hop set in
    // app.ts via `trust proxy`). Never read x-forwarded-for directly — it's
    // spoofable.
    const ip = req.ip || "unknown";
    if (!consumeRateToken(ip)) {
      res
        .status(429)
        .json({
          error: "rate_limited",
          message: "Too many submissions from this network. Try again later.",
        });
      return;
    }

    const parsed = SubmitContactBody.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: "invalid_input",
          message: "Please complete every required field correctly.",
        });
      return;
    }
    const data = parsed.data;
    const email = data.email.trim().toLowerCase();

    await db.insert(contactSubmissionsTable).values({
      id: shortId("ctc"),
      name: data.name.trim(),
      businessName: data.businessName?.trim() || null,
      email,
      phone: data.phone?.trim() || null,
      preferredChannel: data.preferredChannel,
      message: data.message.trim(),
      source: data.source ?? "contact-page",
      status: "new",
    });
    req.log.info(
      { email, source: data.source ?? "contact-page" },
      "contact: new submission",
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
