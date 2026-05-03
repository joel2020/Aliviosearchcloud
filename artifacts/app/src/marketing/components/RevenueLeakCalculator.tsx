import { useId, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WEEKS_PER_YEAR = 50;

const DEFAULTS = {
  missedCalls: 15,
  ticket: 400,
  closeRate: 25,
} as const;

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function parseNumber(value: string, fallback: number): number {
  if (value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type CalculatorInputs = {
  missedCalls: number;
  ticket: number;
  closeRate: number;
};

function computeRecovery({ missedCalls, ticket, closeRate }: CalculatorInputs) {
  const safeMissed = clamp(missedCalls, 0, 1000);
  const safeTicket = clamp(ticket, 0, 1_000_000);
  const safeClose = clamp(closeRate, 0, 100) / 100;
  const weekly = safeMissed * safeClose * safeTicket;
  const annual = weekly * WEEKS_PER_YEAR;
  return { weekly, annual };
}

export type RevenueLeakCalculatorProps = {
  /** Optional heading override for context-specific embeds. */
  heading?: string;
  /** Stable id used in test selectors so multiple embeds don't collide. */
  testIdPrefix?: string;
};

/**
 * Inline revenue-leak calculator embedded inside long-form articles.
 *
 * Lets a reader plug in their own missed calls/week, ticket size, and current
 * close rate and see live weekly + annual recovery, with a one-click CTA into
 * the free Revenue Audit pre-filled with their numbers.
 */
export function RevenueLeakCalculator({
  heading = "Size your revenue leak",
  testIdPrefix = "revenue-calculator",
}: RevenueLeakCalculatorProps) {
  const reactId = useId();
  const missedId = `${reactId}-missed`;
  const ticketId = `${reactId}-ticket`;
  const closeId = `${reactId}-close`;
  const outputId = `${reactId}-output`;

  const { isSignedIn } = useAuth();

  const [missedRaw, setMissedRaw] = useState(String(DEFAULTS.missedCalls));
  const [ticketRaw, setTicketRaw] = useState(String(DEFAULTS.ticket));
  const [closeRaw, setCloseRaw] = useState(String(DEFAULTS.closeRate));

  const missedCalls = parseNumber(missedRaw, DEFAULTS.missedCalls);
  const ticket = parseNumber(ticketRaw, DEFAULTS.ticket);
  const closeRate = parseNumber(closeRaw, DEFAULTS.closeRate);

  const { weekly, annual } = useMemo(
    () => computeRecovery({ missedCalls, ticket, closeRate }),
    [missedCalls, ticket, closeRate],
  );

  const auditHref = useMemo(() => {
    const base = isSignedIn ? "/agents/revenue-leak" : "/sign-up";
    const params = new URLSearchParams();
    if (!isSignedIn) params.set("intent", "audit");
    params.set("missedCalls", String(clamp(missedCalls, 0, 1000)));
    params.set("ticket", String(clamp(ticket, 0, 1_000_000)));
    params.set("closeRate", String(clamp(closeRate, 0, 100)));
    return `${base}?${params.toString()}`;
  }, [isSignedIn, missedCalls, ticket, closeRate]);

  return (
    <aside
      className="not-prose my-10 rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm md:p-8"
      aria-labelledby={`${reactId}-heading`}
      data-testid={testIdPrefix}
    >
      <div className="mb-6 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h3
            id={`${reactId}-heading`}
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            {heading}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Plug in your numbers to see what missed calls are costing you each
            week and over a year.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={missedId} className="text-sm font-medium">
            Missed calls per week
          </Label>
          <Input
            id={missedId}
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            step={1}
            value={missedRaw}
            onChange={(e) => setMissedRaw(e.target.value)}
            aria-describedby={outputId}
            data-testid={`${testIdPrefix}-missed-calls`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={ticketId} className="text-sm font-medium">
            Average ticket ($)
          </Label>
          <Input
            id={ticketId}
            type="number"
            inputMode="decimal"
            min={0}
            max={1_000_000}
            step={50}
            value={ticketRaw}
            onChange={(e) => setTicketRaw(e.target.value)}
            aria-describedby={outputId}
            data-testid={`${testIdPrefix}-ticket`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={closeId} className="text-sm font-medium">
            Close rate on recovered calls (%)
          </Label>
          <Input
            id={closeId}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={1}
            value={closeRaw}
            onChange={(e) => setCloseRaw(e.target.value)}
            aria-describedby={outputId}
            data-testid={`${testIdPrefix}-close-rate`}
          />
        </div>
      </div>

      <div
        id={outputId}
        role="status"
        aria-live="polite"
        className="mt-6 grid gap-4 rounded-xl border border-border/60 bg-background/60 p-5 sm:grid-cols-2"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Weekly recovery
          </p>
          <p
            className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            data-testid={`${testIdPrefix}-weekly`}
          >
            {CURRENCY.format(weekly)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Annual recovery
          </p>
          <p
            className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl"
            data-testid={`${testIdPrefix}-annual`}
          >
            {CURRENCY.format(annual)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Math: missed calls/week × close rate × ticket × {WEEKS_PER_YEAR} weeks.
      </p>

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link
          href={auditHref}
          data-testid={`${testIdPrefix}-cta-link`}
          className="sm:flex-none"
        >
          <Button
            size="lg"
            className="h-11 w-full px-6 text-sm font-bold sm:w-auto"
            data-testid={`${testIdPrefix}-cta`}
          >
            Run my full audit
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground sm:ml-1">
          We'll pre-fill these numbers so the audit picks up where you left off.
        </p>
      </div>
    </aside>
  );
}
