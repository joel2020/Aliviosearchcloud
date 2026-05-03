/**
 * Single source of truth for Twilio messaging configuration.
 *
 * SECURITY CONTRACT:
 *  - Reads server-only env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *    TWILIO_WHATSAPP_FROM, TWILIO_SMS_FROM, PUBLIC_APP_URL).
 *  - Never returns secret values from getMessagingPublicStatus(); only
 *    "configured" / "not_configured" enum values for use in /api/status.
 *  - Must NOT be imported from frontend code.
 *
 * iMESSAGE NOTE:
 *  iMessage does NOT have a public business API equivalent to Twilio
 *  WhatsApp/SMS. Production iMessage support requires Apple Business
 *  Messages approval (Apple's enterprise messaging program) or going
 *  through a third-party broker that holds that approval. We do NOT
 *  fake iMessage support here. The frontend renders an "iMessage coming
 *  soon" placeholder card and the surface area below intentionally
 *  excludes iMessage until that real integration ships.
 */

export type MessagingStatusValue = "configured" | "not_configured";

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  whatsappFrom: string | null;
  smsFrom: string | null;
  publicAppUrl: string | null;
};

function readEnv(key: string): string | null {
  const raw = process.env[key];
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Returns the full Twilio config when both core credentials are present,
 * or null when Twilio is not configured. Callers must handle the null
 * case as "messaging not configured" — never throw.
 */
export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = readEnv("TWILIO_ACCOUNT_SID");
  const authToken = readEnv("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken) return null;
  return {
    accountSid,
    authToken,
    whatsappFrom: readEnv("TWILIO_WHATSAPP_FROM"),
    smsFrom: readEnv("TWILIO_SMS_FROM"),
    publicAppUrl: readEnv("PUBLIC_APP_URL"),
  };
}

export function getMessagingPublicStatus(): {
  twilio: MessagingStatusValue;
  whatsapp: MessagingStatusValue;
  sms: MessagingStatusValue;
} {
  const cfg = getTwilioConfig();
  return {
    twilio: cfg ? "configured" : "not_configured",
    whatsapp: cfg && cfg.whatsappFrom ? "configured" : "not_configured",
    sms: cfg && cfg.smsFrom ? "configured" : "not_configured",
  };
}

export function isChannelAvailable(
  channel: "whatsapp" | "sms",
): boolean {
  const cfg = getTwilioConfig();
  if (!cfg) return false;
  return channel === "whatsapp" ? Boolean(cfg.whatsappFrom) : Boolean(cfg.smsFrom);
}
