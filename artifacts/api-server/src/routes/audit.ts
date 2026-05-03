import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, auditsTable } from "@workspace/db";
import { RequestAuditBody } from "@workspace/api-zod";
import { shortId } from "../lib/ids";
import {
  generateAudit,
  buildAuditViewUrl,
  getCachedAuditPdf,
} from "../lib/auditGenerator";

const router: IRouter = Router();

const RATE_LIMIT_PER_HOUR = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_LIMIT_PER_DAY = 3;
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
const ipBuckets = new Map<string, number[]>();
const emailBuckets = new Map<string, number[]>();

function consumeFromBucket(
  buckets: Map<string, number[]>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

function consumeRateToken(ip: string): boolean {
  return consumeFromBucket(ipBuckets, ip, RATE_LIMIT_PER_HOUR, RATE_WINDOW_MS);
}

function consumeEmailToken(email: string): boolean {
  return consumeFromBucket(
    emailBuckets,
    email,
    EMAIL_LIMIT_PER_DAY,
    EMAIL_WINDOW_MS,
  );
}

function makeAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

router.post("/request", async (req, res, next) => {
  try {
    // `req.ip` is set by Express from the trusted proxy (see `trust proxy`
    // in app.ts) — do NOT read x-forwarded-for directly, it's spoofable.
    const ip = req.ip || "unknown";
    if (!consumeRateToken(ip)) {
      res.status(429).json({
        error: "rate_limited",
        message: "Too many audit requests from this network. Try again later.",
      });
      return;
    }
    // Per-email cap (3/day) so an attacker rotating IPs can't spam one inbox.
    const emailNorm = String(req.body?.leadEmail ?? "")
      .trim()
      .toLowerCase();
    if (emailNorm && !consumeEmailToken(emailNorm)) {
      res.status(429).json({
        error: "rate_limited",
        message:
          "We've already generated an audit for this email recently. Check your inbox or contact us.",
      });
      return;
    }

    const parsed = RequestAuditBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "invalid_input",
        message: "Please complete every required field correctly.",
      });
      return;
    }
    const data = parsed.data;
    const id = shortId("aud");
    const accessToken = makeAccessToken();

    await db.insert(auditsTable).values({
      id,
      accessToken,
      leadName: data.leadName.trim(),
      leadEmail: data.leadEmail.trim().toLowerCase(),
      businessName: data.businessName.trim(),
      websiteUrl: data.websiteUrl?.trim() || null,
      phone: data.phone?.trim() || null,
      industry: data.industry?.trim() || null,
      monthlyLeads: data.monthlyLeads ?? null,
      averageDealValue: data.averageDealValue ?? null,
      currentResponseTime: data.currentResponseTime?.trim() || null,
      mainChannel: data.mainChannel?.trim() || null,
      biggestPain: data.biggestPain?.trim() || null,
      utmSource: data.utmSource?.trim() || null,
      utmCampaign: data.utmCampaign?.trim() || null,
      source: "audit-page",
      status: "pending",
    });

    req.log.info(
      { auditId: id, leadEmail: data.leadEmail.toLowerCase() },
      "audit: new request",
    );

    // Kick off generation outside the request lifecycle so the form
    // returns instantly. Errors are logged inside generateAudit() and
    // flip the row to status=failed for the success-page UI to surface.
    setImmediate(() => {
      void generateAudit(id);
    });

    res.json({
      ok: true,
      auditId: id,
      accessToken,
      viewUrl: `/audit/${id}?token=${accessToken}`,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = String(req.query.token ?? "");
    if (!token) {
      res
        .status(401)
        .json({ error: "invalid_token", message: "Missing access token." });
      return;
    }
    const [audit] = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.id, id))
      .limit(1);
    if (!audit) {
      res.status(404).json({ error: "not_found", message: "Audit not found." });
      return;
    }
    if (audit.accessToken !== token) {
      res
        .status(401)
        .json({ error: "invalid_token", message: "Invalid access token." });
      return;
    }
    res.json({
      id: audit.id,
      status: audit.status,
      leadName: audit.leadName,
      businessName: audit.businessName,
      createdAt: audit.createdAt,
      emailedAt: audit.emailedAt,
      content: audit.content ?? null,
      pdfUrl:
        audit.status === "ready"
          ? `/api/audit/${audit.id}/pdf?token=${audit.accessToken}`
          : null,
      errorMessage: audit.errorMessage ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/pdf", async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = String(req.query.token ?? "");
    const [audit] = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.id, id))
      .limit(1);
    if (!audit || audit.accessToken !== token) {
      res.status(401).type("text/plain").send("Invalid token.");
      return;
    }
    if (audit.status !== "ready") {
      res.status(409).type("text/plain").send("Audit is not ready yet.");
      return;
    }
    const pdf = getCachedAuditPdf(id);
    if (!pdf) {
      // Cache miss (server restarted). Re-generate the PDF on the fly
      // from the persisted content so the lead never sees a dead link.
      const { renderAuditPdf } = await import("../lib/auditPdf");
      const fresh = await renderAuditPdf(audit, (audit.content ?? {
        leaks: [],
        quickWins: [],
        summary: "",
      }) as never);
      res
        .status(200)
        .setHeader("Content-Type", "application/pdf")
        .setHeader(
          "Content-Disposition",
          `attachment; filename="Alivio-Revenue-Audit.pdf"`,
        )
        .send(fresh);
      return;
    }
    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="Alivio-Revenue-Audit.pdf"`,
      )
      .send(pdf);
  } catch (err) {
    next(err);
  }
});

// Suppress unused-import warning when buildAuditViewUrl is referenced
// only via auditGenerator. Keep export available for future routes.
void buildAuditViewUrl;

export default router;
