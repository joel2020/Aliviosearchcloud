import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribeToBlog } from "@workspace/api-client-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variant = "card" | "inline";

interface NewsletterSignupProps {
  source: string;
  variant?: Variant;
  heading?: string;
  description?: string;
  className?: string;
  testIdPrefix?: string;
}

export function NewsletterSignup({
  source,
  variant = "card",
  heading = "Get new revenue playbooks in your inbox",
  description = "Practical, no-fluff posts on missed-call recovery, lead follow-up, and AI agents — about once a week.",
  className,
  testIdPrefix = "newsletter",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const subscribe = useSubscribeToBlog();

  const trimmed = email.trim();
  const looksValid = EMAIL_RE.test(trimmed);
  const showInlineError = touched && trimmed.length > 0 && !looksValid;

  const success = subscribe.isSuccess;
  const alreadySubscribed = success && subscribe.data?.alreadySubscribed === true;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!looksValid || subscribe.isPending) return;
    subscribe.mutate({ data: { email: trimmed, source } });
  }

  const containerClass =
    variant === "card"
      ? `mx-auto max-w-2xl rounded-2xl border border-border bg-card/50 p-8 text-center ${className ?? ""}`
      : `mx-auto max-w-2xl text-center ${className ?? ""}`;

  if (success) {
    return (
      <div
        className={containerClass}
        data-testid={`${testIdPrefix}-success`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="mb-2 text-xl font-semibold">
          {alreadySubscribed ? "You're already on the list" : "You're in — check your inbox"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {alreadySubscribed
            ? "Thanks for the enthusiasm. We'll keep sending new playbooks your way."
            : "Thanks for subscribing — new revenue playbooks will land in your inbox."}
        </p>
      </div>
    );
  }

  const apiError = subscribe.isError;

  return (
    <div className={containerClass}>
      {variant === "card" ? (
        <Mail className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
      ) : null}
      <h3 className="mb-2 text-xl font-semibold tracking-tight md:text-2xl">
        {heading}
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      <form
        className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
        onSubmit={handleSubmit}
        noValidate
        data-testid={`${testIdPrefix}-form`}
      >
        <label className="sr-only" htmlFor={`${testIdPrefix}-email`}>
          Email address
        </label>
        <Input
          id={`${testIdPrefix}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="hello@yourbusiness.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={subscribe.isPending}
          aria-invalid={showInlineError ? "true" : "false"}
          aria-describedby={
            showInlineError
              ? `${testIdPrefix}-error`
              : apiError
                ? `${testIdPrefix}-api-error`
                : undefined
          }
          className="flex-1"
          data-testid={`${testIdPrefix}-input`}
        />
        <Button
          type="submit"
          disabled={subscribe.isPending || (touched && !looksValid)}
          data-testid={`${testIdPrefix}-submit`}
        >
          {subscribe.isPending ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
      {showInlineError ? (
        <p
          id={`${testIdPrefix}-error`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Please enter a valid email address.
        </p>
      ) : null}
      {apiError ? (
        <p
          id={`${testIdPrefix}-api-error`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Couldn't subscribe right now. Please try again in a moment.
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">
        No spam. Unsubscribe with one click.
      </p>
    </div>
  );
}
