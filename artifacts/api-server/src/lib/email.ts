import { Resend } from "resend";
import { logger } from "./logger";

let cached: Resend | null | undefined;

function getClient(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    cached = null;
    logger.warn("email: RESEND_API_KEY not set — email sending disabled");
    return null;
  }
  cached = new Resend(key);
  return cached;
}

export interface SendAuditEmailArgs {
  to: string;
  leadName: string;
  businessName: string;
  viewUrl: string;
  pdfBuffer: Buffer;
  estimatedMonthlyLossUsd: number;
  topLeak: string;
}

const FROM = process.env.RESEND_FROM ?? "Alivio <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "hello@aliviosearch.com";

export async function sendAuditEmail(
  args: SendAuditEmailArgs,
): Promise<{ id: string | null; sent: boolean; reason?: string }> {
  const client = getClient();
  if (!client) {
    return { id: null, sent: false, reason: "RESEND_API_KEY not set" };
  }

  const lossFormatted = args.estimatedMonthlyLossUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const html = renderAuditEmailHtml({
    leadName: args.leadName,
    businessName: args.businessName,
    viewUrl: args.viewUrl,
    lossFormatted,
    topLeak: args.topLeak,
  });

  const text = `Hi ${args.leadName},

Your Alivio Revenue Leak Audit for ${args.businessName} is ready.

Headline finding: ${args.topLeak}
Estimated leak: ${lossFormatted}/month

View the full audit (and download the PDF):
${args.viewUrl}

Or open the PDF attached to this email.

— The Alivio team`;

  try {
    const result = await client.emails.send({
      from: FROM,
      to: args.to,
      replyTo: REPLY_TO,
      subject: `Your Revenue Leak Audit for ${args.businessName} is ready`,
      html,
      text,
      attachments: [
        {
          filename: `Alivio-Revenue-Audit-${slug(args.businessName)}.pdf`,
          content: args.pdfBuffer,
        },
      ],
    });
    if (result.error) {
      logger.error({ err: result.error, to: args.to }, "email: send failed");
      return { id: null, sent: false, reason: result.error.message };
    }
    return { id: result.data?.id ?? null, sent: true };
  } catch (err) {
    logger.error({ err, to: args.to }, "email: send threw");
    return {
      id: null,
      sent: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function renderAuditEmailHtml(args: {
  leadName: string;
  businessName: string;
  viewUrl: string;
  lossFormatted: string;
  topLeak: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0b0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e6e8ee;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f17;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 28px 0;">
          <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#7c8aa3;">Alivio Search Cloud</div>
          <h1 style="margin:6px 0 0;font-size:24px;line-height:1.2;color:#ffffff;">Your Revenue Leak Audit is ready</h1>
        </td></tr>
        <tr><td style="padding:20px 28px 0;font-size:15px;line-height:1.55;color:#cbd2dd;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(args.leadName)},</p>
          <p style="margin:0 0 14px;">We've finished analyzing <strong style="color:#ffffff;">${escapeHtml(args.businessName)}</strong>. Here's the headline:</p>
          <div style="border-left:3px solid #6366f1;padding:12px 16px;background:#0b0f17;border-radius:8px;margin:16px 0;">
            <div style="font-size:12px;color:#8b94a7;text-transform:uppercase;letter-spacing:.12em;">Estimated monthly leak</div>
            <div style="font-size:28px;font-weight:700;color:#ffffff;margin:4px 0 8px;">${escapeHtml(args.lossFormatted)}</div>
            <div style="font-size:14px;color:#cbd2dd;"><strong style="color:#ffffff;">Top finding:</strong> ${escapeHtml(args.topLeak)}</div>
          </div>
          <p style="margin:0 0 18px;">The full audit (with prioritized fixes and quick wins) is attached as a PDF and also lives at the link below.</p>
          <p style="margin:0 0 22px;">
            <a href="${args.viewUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">View full audit →</a>
          </p>
          <p style="margin:0 0 6px;color:#8b94a7;font-size:13px;">Want help executing on these fixes? Just hit reply — we read every message.</p>
          <p style="margin:18px 0 0;color:#cbd2dd;">— The Alivio team</p>
        </td></tr>
        <tr><td style="padding:24px 28px;border-top:1px solid #1f2937;margin-top:20px;color:#6c7689;font-size:12px;">
          You requested this audit at aliviosearch.com. If this wasn't you, you can ignore this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
