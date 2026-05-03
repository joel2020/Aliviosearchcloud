import { useEffect, useMemo } from "react";
import { useRoute, useSearch, Link } from "wouter";
import { MarketingLayout } from "../components/MarketingLayout";
import { useSeo } from "@/marketing/lib/useSeo";
import {
  useGetAuditStatus,
  getGetAuditStatusQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function impactClass(impact: string): string {
  if (impact === "high")
    return "bg-red-500/10 text-red-400 border-red-500/30";
  if (impact === "medium")
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
}

export default function AuditResult() {
  const [, params] = useRoute("/audit/:id");
  const search = useSearch();
  const auditId = params?.id ?? "";
  const token = useMemo(() => {
    return new URLSearchParams(search).get("token") ?? "";
  }, [search]);

  useSeo({
    title: "Your Revenue Leak Audit",
    description: "Your custom AI-generated revenue audit from Alivio.",
    path: `/audit/${auditId}`,
  });

  const status = useGetAuditStatus(auditId, { token }, {
    query: {
      queryKey: getGetAuditStatusQueryKey(auditId, { token }),
      enabled: Boolean(auditId && token),
      refetchInterval: (q) => {
        const data = q.state.data;
        if (!data) return 2500;
        return data.status === "ready" || data.status === "failed"
          ? false
          : 2500;
      },
    },
  });

  // Fire a confetti-equivalent toast/log only once when ready.
  useEffect(() => {
    if (status.data?.status === "ready") {
      // Reserved for future analytics/tracking hook.
    }
  }, [status.data?.status]);

  if (!auditId || !token) {
    return (
      <MarketingLayout>
        <ErrorState message="This link looks incomplete. Please use the original link from your email." />
      </MarketingLayout>
    );
  }

  if (status.isLoading) {
    return (
      <MarketingLayout>
        <PendingState
          title="Loading your audit…"
          subtitle="One moment."
        />
      </MarketingLayout>
    );
  }

  if (status.isError) {
    return (
      <MarketingLayout>
        <ErrorState message="We couldn't find this audit. The link may be invalid or expired." />
      </MarketingLayout>
    );
  }

  const data = status.data!;

  if (data.status === "pending" || data.status === "generating") {
    return (
      <MarketingLayout>
        <PendingState
          title={`Generating your audit, ${data.leadName.split(" ")[0]}…`}
          subtitle="Our AI is analysing your funnel. This usually takes 15–60 seconds. Hang tight — we'll also email you the moment it's ready."
        />
      </MarketingLayout>
    );
  }

  if (data.status === "failed") {
    return (
      <MarketingLayout>
        <ErrorState
          message={
            data.errorMessage
              ? `Audit generation failed: ${data.errorMessage}. Please email hello@aliviosearch.com and we'll generate it manually.`
              : "Audit generation failed. Please email hello@aliviosearch.com and we'll generate it manually."
          }
        />
      </MarketingLayout>
    );
  }

  // status === "ready"
  const content = data.content;
  const totalLoss =
    content?.estimatedMonthlyLossUsd ??
    content?.leaks.reduce(
      (s, l) => s + (l.estimatedMonthlyLossUsd ?? 0),
      0,
    ) ??
    0;

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-24 md:pt-32" data-testid="audit-result">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-8 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Your audit is ready.</p>
              <p className="text-sm text-muted-foreground">
                {data.emailedAt
                  ? `Also sent to your inbox at ${new Date(data.emailedAt).toLocaleString()}.`
                  : "Email delivery is queued — meanwhile you can download the PDF below."}
              </p>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Revenue Leak Audit · {data.businessName}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {data.businessName} is leaking
            </h1>
            <div className="text-5xl md:text-7xl font-bold text-primary mb-2">
              {formatUsd(totalLoss)}
            </div>
            <p className="text-lg text-muted-foreground">
              per month — across {content?.leaks.length ?? 0} identified{" "}
              {content?.leaks.length === 1 ? "leak" : "leaks"} ·{" "}
              {formatUsd(totalLoss * 12)}/year
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {data.pdfUrl && (
                <a
                  href={data.pdfUrl}
                  data-testid="audit-pdf-download"
                >
                  <Button size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              )}
              <Link href="/contact">
                <Button size="lg" variant="outline" data-testid="audit-talk-to-us">
                  <Mail className="mr-2 h-4 w-4" />
                  Talk to us about fixing these
                </Button>
              </Link>
            </div>
          </div>

          {content?.summary && (
            <div className="rounded-2xl border border-border bg-card p-6 mb-8">
              <h2 className="text-xs font-bold text-muted-foreground tracking-widest mb-3">
                EXECUTIVE SUMMARY
              </h2>
              <p className="text-base leading-relaxed">{content.summary}</p>
            </div>
          )}

          <div className="space-y-4 mb-10">
            <h2 className="text-2xl font-bold">Top revenue leaks</h2>
            {content?.leaks.map((leak, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6"
                data-testid={`audit-leak-${i}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <h3 className="text-lg font-semibold">{leak.title}</h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${impactClass(leak.impact)}`}
                  >
                    {leak.impact}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary mb-4">
                  {formatUsd(leak.estimatedMonthlyLossUsd)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    / month
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground tracking-widest mb-1">
                      EVIDENCE
                    </div>
                    <p className="leading-relaxed">{leak.evidence}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-muted-foreground tracking-widest mb-1">
                      FIX
                    </div>
                    <p className="leading-relaxed">{leak.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {content && content.quickWins.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 mb-10">
              <h2 className="text-2xl font-bold mb-4">Quick wins this week</h2>
              <ul className="space-y-3">
                {content.quickWins.map((win, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span className="leading-relaxed">{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to plug these leaks?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Most of these can be live in your business inside 2 weeks. We
              install the AI Revenue Engine, configure it to your funnel, and
              hand you the keys.
            </p>
            <Link href="/contact">
              <Button size="lg" data-testid="audit-cta-contact">
                Book a strategy call <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function PendingState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="px-6 pt-32 pb-24" data-testid="audit-pending">
      <div className="mx-auto max-w-xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6" />
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="px-6 pt-32 pb-24" data-testid="audit-error-state">
      <div className="mx-auto max-w-xl text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-6" />
        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          Something's not right
        </h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Link href="/audit">
          <Button>Start a new audit</Button>
        </Link>
      </div>
    </section>
  );
}
