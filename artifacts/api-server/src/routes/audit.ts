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

function makeAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

router.post("/request", async (req, res, next) => {
  try {
    const ip =
      req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    if (!consumeRateToken(ip)) {
      res.status(429).json({
        error: "rate_limited",
        message: "Too many audit requests from this network. Try again later.",
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
