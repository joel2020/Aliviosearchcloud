/**
 * Marketing CTAs.
 *
 * The four CTAs mandated by the product brief. Hrefs are kept here so
 * downstream tasks (Stripe payment links, Cal.com booking) can flip
 * them in a single place.
 */

export type MarketingCta = {
  readonly id: "audit" | "book-call" | "install" | "assistant";
  readonly label: string;
  readonly href: string;
  /** True when the destination is a final integrated link; false when it's
   *  a placeholder waiting on a downstream task to wire it. */
  readonly wired: boolean;
};

/** Run Free Revenue Audit — sends to sign-up with audit intent. */
export const CTA_AUDIT: MarketingCta = {
  id: "audit",
  label: "Run Free Revenue Audit",
  href: "/sign-up?intent=audit",
  wired: true,
};

/** Book Strategy Call — placeholder until Cal.com task wires the booking link. */
export const CTA_BOOK_CALL: MarketingCta = {
  id: "book-call",
  label: "Book Strategy Call",
  href: "/book-call",
  wired: false,
};

/** Install My Revenue Engine — placeholder until Stripe task wires the payment link. */
export const CTA_INSTALL: MarketingCta = {
  id: "install",
  label: "Install My Revenue Engine",
  href: "/install",
  wired: false,
};

/** Talk to My AI Assistant — Clerk-protected route inside the app. */
export const CTA_ASSISTANT: MarketingCta = {
  id: "assistant",
  label: "Talk to My AI Assistant",
  href: "/assistant",
  wired: true,
};

export const ALL_CTAS: readonly MarketingCta[] = [
  CTA_AUDIT,
  CTA_BOOK_CALL,
  CTA_INSTALL,
  CTA_ASSISTANT,
] as const;
