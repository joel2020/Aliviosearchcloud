/**
 * Single source of truth for the public Stripe + Cal.com config.
 *
 * SECURITY CONTRACT:
 *  - STRIPE_SECRET_KEY is read here ONLY to report `status.stripe`. It is
 *    never returned in any payload. The presence flag below is a boolean.
 *  - This module must NEVER be imported from frontend code, and the object
 *    returned by `getPublicConfig()` must NEVER include any secret values.
 *    The runtime assertion at the bottom guards this contract.
 */

export type PublicStatusValue = "configured" | "not_configured";

export type PublicConfig = {
  stripe: {
    auditLink: string | null;
    engineLink: string | null;
  };
  cal: {
    link: string | null;
  };
  status: {
    stripe: PublicStatusValue;
    cal: PublicStatusValue;
  };
};

function readPublicLink(key: string): string | null {
  const raw = process.env[key];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Only surface https:// (or http:// for local dev) URLs to the frontend.
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function getPublicConfig(): PublicConfig {
  const auditLink = readPublicLink("STRIPE_PAYMENT_LINK_AUDIT");
  const engineLink = readPublicLink("STRIPE_PAYMENT_LINK_ENGINE");
  const calLink =
    readPublicLink("CAL_LINK") ?? readPublicLink("VITE_CAL_LINK");

  // Stripe is "configured" when at least one public payment link is present.
  // STRIPE_SECRET_KEY alone does not flip this on, because the customer-facing
  // CTAs need a public URL — not the secret key.
  const stripeConfigured = Boolean(auditLink || engineLink);
  const calConfigured = Boolean(calLink);

  return {
    stripe: { auditLink, engineLink },
    cal: { link: calLink },
    status: {
      stripe: stripeConfigured ? "configured" : "not_configured",
      cal: calConfigured ? "configured" : "not_configured",
    },
  };
}

/**
 * Reports whether the server has STRIPE_SECRET_KEY (used for future webhooks).
 * Does NOT return the key itself.
 */
export function hasStripeSecretKey(): boolean {
  const v = process.env["STRIPE_SECRET_KEY"];
  return Boolean(v && v.trim());
}

// Runtime contract: the public config payload must never contain a string that
// looks like a Stripe secret key (sk_live_..., sk_test_..., rk_live_..., etc).
// This is a defensive assertion that runs once at module load to catch any
// regression in dev/test before it ships.
{
  const cfg = getPublicConfig();
  const serialized = JSON.stringify(cfg);
  if (/sk_(live|test)_|rk_(live|test)_/.test(serialized)) {
    throw new Error(
      "publicConfig: refusing to start — payload appears to contain a Stripe secret key.",
    );
  }
}
