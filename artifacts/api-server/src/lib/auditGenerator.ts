import { eq } from "drizzle-orm";
import { db, auditsTable, leadsTable, type Audit } from "@workspace/db";
import { agentRegistry } from "@workspace/agents";
import {
  AzureOpenAINotConfiguredError,
  getAzureOpenAIClient,
} from "@workspace/azure-openai";
import { renderAuditPdf, type AuditContent } from "./auditPdf";
import { sendAuditEmail } from "./email";
import { logger } from "./logger";
import { shortId } from "./ids";

/**
 * The PDF storage strategy is intentionally simple: we keep the bytes in
 * `auditPdfCache` keyed by audit id and serve them through the
 * `GET /audit/:id/pdf` route. This avoids a hard dependency on object
 * storage for Week 1; the email also carries the PDF as an attachment so
 * it survives a server restart.
 *
 * When we move to multi-tenant storage (Week 6) the cache flips to App
 * Storage transparently.
 */
const auditPdfCache = new Map<string, Buffer>();

export function getCachedAuditPdf(auditId: string): Buffer | undefined {
  return auditPdfCache.get(auditId);
}

function publicAppUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}`;
  return "http://localhost:80";
}

export function buildAuditViewUrl(auditId: string, token: string): string {
  return `${publicAppUrl()}/audit/${auditId}?token=${token}`;
}

/**
 * Coerce the structured agent output into the wider `AuditContent` shape
 * the PDF/email rendering layer expects. We compute `estimatedMonthlyLossUsd`
 * client-side so consumers don't need to re-walk `leaks`.
 */
function shapeContent(raw: unknown): AuditContent {
  const safe = (raw ?? {}) as Partial<AuditContent>;
  const leaks = Array.isArray(safe.leaks) ? safe.leaks : [];
  const quickWins = Array.isArray(safe.quickWins) ? safe.quickWins : [];
  const summary = typeof safe.summary === "string" ? safe.summary : "";
  return { leaks, quickWins, summary };
}

/**
 * Run the audit pipeline end-to-end:
 *   1. Mark `generating`
 *   2. Run revenueLeakAgent with the captured form inputs (synthesised
 *      business + user context — no Clerk session needed for public leads)
 *   3. Persist the structured content
 *   4. Render PDF, cache it
 *   5. Email the lead with the PDF attached and a view link
 *   6. Mark `ready` (even if email failed — they can still download from
 *      the success page)
 *
 * Errors flip the row to `failed` with `errorMessage` for ops triage.
 * Designed to be invoked from a `setImmediate` after the form POST so
 * the request returns instantly.
 */
export async function generateAudit(auditId: string): Promise<void> {
  const log = logger.child({ component: "auditGenerator", auditId });
  const [audit] = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.id, auditId))
    .limit(1);
  if (!audit) {
    log.warn("generateAudit: audit row not found");
    return;
  }

  try {
    await db
      .update(auditsTable)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(auditsTable.id, auditId));

    let ai;
    try {
      ai = getAzureOpenAIClient();
    } catch (err) {
      if (err instanceof AzureOpenAINotConfiguredError) {
        await markFailed(auditId, "AI provider not configured");
        return;
      }
      throw err;
    }

    const agentInput = {
      monthlyLeads: audit.monthlyLeads ?? undefined,
      averageDealValue: audit.averageDealValue ?? undefined,
      knownIssues: [
        audit.biggestPain ?? "",
        audit.currentResponseTime
          ? `Current response time: ${audit.currentResponseTime}`
          : "",
        audit.mainChannel ? `Main lead channel: ${audit.mainChannel}` : "",
      ].filter((s) => s.length > 0),
      notes: [
        `Business: ${audit.businessName}`,
        audit.industry ? `Industry: ${audit.industry}` : "",
        audit.websiteUrl ? `Website: ${audit.websiteUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const ctx = {
      business: {
        id: `audit_${audit.id}`,
        name: audit.businessName,
        industry: audit.industry ?? null,
        website: audit.websiteUrl ?? null,
      } as never,
      user: {
        id: `lead_${audit.id}`,
        email: audit.leadEmail,
        firstName: audit.leadName.split(" ")[0] ?? audit.leadName,
        lastName: audit.leadName.split(" ").slice(1).join(" ") || null,
      } as never,
      ai,
      log: {
        info: (...a: unknown[]) => log.info(...(a as [object])),
        warn: (...a: unknown[]) => log.warn(...(a as [object])),
        error: (...a: unknown[]) => log.error(...(a as [object])),
        debug: (...a: unknown[]) => log.debug(...(a as [object])),
      },
    };

    const agent = agentRegistry.get("revenue-leak");
    if (!agent) {
      await markFailed(auditId, "revenue-leak agent not registered");
      return;
    }
    const result = await agent.run(agentInput, ctx);
    if (result.status !== "ok") {
      await markFailed(
        auditId,
        result.errorMessage || `Agent returned ${result.status}`,
      );
      return;
    }

    const content = shapeContent(result.output);
    const totalLoss = content.leaks.reduce(
      (s, l) =>
        s +
        (Number.isFinite(l.estimatedMonthlyLossUsd)
          ? l.estimatedMonthlyLossUsd
          : 0),
      0,
    );

    const refreshed: Audit = {
      ...audit,
      content: { ...content, estimatedMonthlyLossUsd: totalLoss },
    };

    const pdf = await renderAuditPdf(refreshed, content);
    auditPdfCache.set(auditId, pdf);

    // Mirror the audit lead into the in-house CRM so it shows up in the
    // pipeline immediately — this is the seam the Week 3 CRM UI hangs off.
    try {
      await db
        .insert(leadsTable)
        .values({
          id: shortId("ld"),
          ownerBusinessId: null,
          fullName: audit.leadName,
          email: audit.leadEmail,
          phone: audit.phone,
          companyName: audit.businessName,
          companyIndustry: audit.industry,
          source: "audit",
          stage: "qualified",
          score: Math.min(100, Math.round(totalLoss / 500)),
          notes: `Estimated leak: $${totalLoss.toLocaleString()}/mo. Top finding: ${content.leaks[0]?.title ?? "—"}`,
          auditId: audit.id,
        })
        .onConflictDoNothing();
    } catch (err) {
      log.warn({ err }, "auditGenerator: failed to mirror lead into CRM");
    }

    const viewUrl = buildAuditViewUrl(audit.id, audit.accessToken);
    const email = await sendAuditEmail({
      to: audit.leadEmail,
      leadName: audit.leadName,
      businessName: audit.businessName,
      viewUrl,
      pdfBuffer: pdf,
      estimatedMonthlyLossUsd: totalLoss,
      topLeak: content.leaks[0]?.title ?? "Multiple revenue leaks identified",
    });

    await db
      .update(auditsTable)
      .set({
        status: "ready",
        content: { ...content, estimatedMonthlyLossUsd: totalLoss },
        emailedAt: email.sent ? new Date() : null,
        emailMessageId: email.id,
        errorMessage: email.sent ? null : email.reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(auditsTable.id, auditId));

    log.info(
      {
        leaks: content.leaks.length,
        totalLoss,
        emailSent: email.sent,
      },
      "audit generated",
    );
  } catch (err) {
    log.error({ err }, "audit generation failed");
    await markFailed(
      auditId,
      err instanceof Error ? err.message : "unknown error",
    );
  }
}

async function markFailed(auditId: string, reason: string): Promise<void> {
  await db
    .update(auditsTable)
    .set({
      status: "failed",
      errorMessage: reason,
      updatedAt: new Date(),
    })
    .where(eq(auditsTable.id, auditId));
}
