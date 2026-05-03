import { type ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { useGetPublicConfig } from "@workspace/api-client-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * The four PRD CTAs that need product-aware behavior.
 * `audit` and `assistant` are in-app routes (always wired).
 * `book-call` and `install` route to public Stripe/Cal links when configured,
 * otherwise to /contact with a "Coming soon — contact us" label.
 */
export type CTAId =
  | "audit"
  | "audit-paid"
  | "book-call"
  | "install"
  | "assistant";

type CTAButtonProps = Omit<ButtonProps, "asChild" | "onClick"> & {
  cta: CTAId;
  /** Override the visible label (e.g. "Already a customer? Talk to my AI"). */
  label?: string;
  /** Optional content rendered after the label (e.g. an arrow icon). */
  trailing?: ReactNode;
  /** When true and the user is not signed in, route the assistant CTA to sign-in. */
  signedIn?: boolean;
  "data-testid"?: string;
};

const FALLBACK_LABEL = "Coming soon — contact us";
const FALLBACK_HREF = "/contact";

const DEFAULT_LABELS: Record<CTAId, string> = {
  audit: "Run Free Revenue Audit",
  "audit-paid": "Upgrade to Paid Audit",
  "book-call": "Book Strategy Call",
  install: "Install My Revenue Engine",
  assistant: "Talk to My AI Assistant",
};

export function CTAButton({
  cta,
  label,
  trailing,
  signedIn,
  className,
  "data-testid": testId,
  children,
  ...buttonProps
}: CTAButtonProps) {
  const { data: config } = useGetPublicConfig();
  const { isSignedIn } = useAuth();
  const effectiveSignedIn = signedIn ?? isSignedIn;

  const resolved = resolveCta(cta, config, effectiveSignedIn);
  const visibleLabel = resolved.fallback
    ? FALLBACK_LABEL
    : (label ?? DEFAULT_LABELS[cta]);
  const finalTestId = testId ?? `cta-${cta}`;

  const inner = (
    <Button
      {...buttonProps}
      className={className}
      data-testid={finalTestId}
      data-cta-state={resolved.fallback ? "fallback" : "wired"}
    >
      {children ?? visibleLabel}
      {trailing}
    </Button>
  );

  if (resolved.external) {
    return (
      <a
        href={resolved.href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`${finalTestId}-link`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={resolved.href} data-testid={`${finalTestId}-link`}>
      {inner}
    </Link>
  );
}

type ResolvedCta = {
  href: string;
  external: boolean;
  fallback: boolean;
};

function resolveCta(
  cta: CTAId,
  config: { stripe?: { auditLink?: string | null; engineLink?: string | null }; cal?: { link?: string | null } } | undefined,
  signedIn: boolean | undefined,
): ResolvedCta {
  switch (cta) {
    case "audit": {
      // The FREE audit CTA always routes to the in-app audit flow — never to a
      // Stripe payment link. Signed-in users go straight to the Revenue Leak
      // Finder agent; signed-out users are sent to sign-up which then funnels
      // them into the same agent.
      if (signedIn) {
        return { href: "/agents/revenue-leak", external: false, fallback: false };
      }
      return { href: "/sign-up?intent=audit", external: false, fallback: false };
    }
    case "audit-paid": {
      const auditLink = config?.stripe?.auditLink ?? null;
      if (auditLink) return { href: auditLink, external: true, fallback: false };
      return { href: FALLBACK_HREF, external: false, fallback: true };
    }
    case "book-call": {
      const link = config?.cal?.link ?? null;
      if (link) return { href: link, external: true, fallback: false };
      return { href: FALLBACK_HREF, external: false, fallback: true };
    }
    case "install": {
      const link = config?.stripe?.engineLink ?? null;
      if (link) return { href: link, external: true, fallback: false };
      return { href: FALLBACK_HREF, external: false, fallback: true };
    }
    case "assistant": {
      // In-app destination — always wired.
      return {
        href: signedIn === false ? "/sign-in?redirect=/assistant" : "/assistant",
        external: false,
        fallback: false,
      };
    }
  }
}
