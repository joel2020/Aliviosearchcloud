import { type MouseEvent, type ReactNode } from "react";
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
  /**
   * Side-effect to run when the CTA is clicked (e.g. closing a mobile menu
   * sheet). Navigation still happens via the underlying anchor / wouter Link.
   */
  onNavigate?: () => void;
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
  onNavigate,
  className,
  "data-testid": testId,
  children,
  ...buttonProps
}: CTAButtonProps) {
  const { data: config, isLoading: configLoading } = useGetPublicConfig();
  const { isSignedIn } = useAuth();
  const effectiveSignedIn = signedIn ?? isSignedIn;

  const resolved = resolveCta(cta, config, effectiveSignedIn);
  // While the public config is still loading we don't yet know whether
  // book-call/install/audit-paid should be wired or fall back, so render the
  // default label (not the "Coming soon" string) to avoid a visible flicker
  // when the link is actually configured.
  const showFallbackLabel = resolved.fallback && !configLoading;
  // Disable the link-dependent CTAs while config is still loading, so a fast
  // click can't navigate to the /contact fallback when the real link is about
  // to resolve in. In-app CTAs (audit, assistant) are not link-dependent.
  const linkDependent =
    cta === "book-call" || cta === "install" || cta === "audit-paid";
  const isPending = linkDependent && configLoading;
  const visibleLabel = showFallbackLabel
    ? FALLBACK_LABEL
    : (label ?? DEFAULT_LABELS[cta]);
  const finalTestId = testId ?? `cta-${cta}`;

  const inner = (
    <Button
      {...buttonProps}
      className={className}
      disabled={buttonProps.disabled || isPending}
      data-testid={finalTestId}
      data-cta-state={
        isPending ? "loading" : resolved.fallback ? "fallback" : "wired"
      }
      aria-busy={isPending || undefined}
    >
      {children ?? visibleLabel}
      {trailing}
    </Button>
  );

  // While config is still loading for a link-dependent CTA, render the button
  // without an anchor wrapper so an early click can't navigate anywhere.
  if (isPending) return inner;

  const handleClick = (e: MouseEvent) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
    onNavigate?.();
  };

  if (resolved.external) {
    return (
      <a
        href={resolved.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        data-testid={`${finalTestId}-link`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={resolved.href}
      onClick={handleClick}
      data-testid={`${finalTestId}-link`}
    >
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
      // The FREE audit CTA routes to the public `/audit` form — no sign-up
      // required. Within an hour the lead receives a branded PDF audit by
      // email. Signed-in users still get the in-app Revenue Leak Finder.
      if (signedIn) {
        return { href: "/agents/revenue-leak", external: false, fallback: false };
      }
      return { href: "/audit", external: false, fallback: false };
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
