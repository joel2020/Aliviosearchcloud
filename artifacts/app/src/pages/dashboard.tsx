import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  useGetCurrentUser,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import { Section } from "@/components/shell/Section";
import { agentMeta, agentName, formatRelative, statusTone } from "@/lib/agentMeta";
import { CTAButton } from "@/components/CTAButton";

const QUICK_LAUNCH = [
  { id: "revenue-leak", title: "Find revenue leaks", blurb: "Audit your funnel for missed money." },
  { id: "follow-up", title: "Plan a follow-up", blurb: "Sequence the next 5 touches for an open lead." },
  { id: "cold-email", title: "Write a cold email", blurb: "Subject + body in seconds." },
  { id: "missed-call", title: "Reply to a missed call", blurb: "SMS reply ready to send." },
];

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();

  return (
    <div className="space-y-8" data-testid="page-dashboard">
      <PageHeader
        eyebrow="Workspace"
        title={
          isLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            data?.business?.name ?? "Your workspace"
          )
        }
        description={
          userLoading
            ? "Loading…"
            : `Welcome back, ${user?.fullName ?? user?.email ?? "operator"}.`
        }
      />

      <div className="flex flex-wrap gap-2" data-testid="dashboard-quick-ctas">
        <CTAButton cta="install" size="sm" data-testid="cta-install-dashboard" />
        <CTAButton
          cta="book-call"
          size="sm"
          variant="outline"
          data-testid="cta-book-call-dashboard"
        />
      </div>

      {isError ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="flex items-center justify-between py-4 text-sm text-destructive">
            <span>Could not load dashboard. The API may still be warming up.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-dashboard">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Section title="Today at a glance">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Active agents",
              value: data?.kpis.activeAgents ?? 0,
              icon: Bot,
              accent: "text-primary",
              hint: "Agents you've used (30d)",
            },
            {
              label: "Runs this week",
              value: data?.kpis.runsThisWeek ?? 0,
              icon: Activity,
              accent: "text-accent",
              hint: `${data?.kpis.runsTotal ?? 0} all-time`,
            },
            {
              label: "Conversations",
              value: data?.kpis.conversations ?? 0,
              icon: MessageSquare,
              accent: "text-chart-3",
              hint: "Total assistant threads",
            },
            {
              label: "Revenue leaks found",
              value: data?.kpis.revenueLeaksIdentified ?? 0,
              icon: CircleDollarSign,
              accent: "text-chart-4",
              hint: "Latest Revenue Leak run",
            },
          ].map(({ label, value, icon: Icon, accent, hint }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Card className="border-border/70 bg-card/60 backdrop-blur hover-elevate" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${accent}`} />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-semibold">{value}</div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section
          title="Quick launch"
          className="lg:col-span-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LAUNCH.map((q) => {
              const meta = agentMeta(q.id);
              return (
                <Link
                  key={q.id}
                  href={`/agents/${q.id}`}
                  data-testid={`quick-launch-${q.id}`}
                >
                  <Card className="group h-full cursor-pointer border-border/70 bg-card/60 backdrop-blur hover-elevate">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg bg-primary/10 ${meta.accent}`}>
                        <meta.icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-sm font-semibold">{q.title}</div>
                      <p className="text-xs text-muted-foreground">{q.blurb}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Section>

        <Section
          title="Suggested next actions"
          className="lg:col-span-2"
        >
          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardContent className="p-4 space-y-3" data-testid="card-suggestions">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : data?.suggestedActions.length ? (
                data.suggestedActions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed">{s.text}</p>
                      {s.agentSlug ? (
                        <Link
                          href={
                            s.runId
                              ? `/agents/${s.agentSlug}/runs/${s.runId}`
                              : `/agents/${s.agentSlug}`
                          }
                        >
                          <Button size="sm" variant="outline" data-testid={`suggestion-action-${i}`}>
                            Open
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.source}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Run an agent to start collecting suggestions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </div>

      <Section title="Recent activity">
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="p-0" data-testid="card-recent-activity">
            {isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data?.recentRuns.length ? (
              <ul className="divide-y divide-border/60">
                {data.recentRuns.map((r) => {
                  const meta = agentMeta(r.agentSlug);
                  const tone = statusTone(r.status);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/agents/${r.agentSlug}/runs/${r.id}`}
                        className="hover-elevate block px-4 py-3"
                        data-testid={`recent-run-${r.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`grid h-9 w-9 place-items-center rounded-lg bg-primary/10 ${meta.accent}`}>
                            <meta.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {agentName(r.agentSlug)}
                              </span>
                              <Badge variant="outline" className={tone.className}>
                                {tone.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(r.startedAt)}
                              {r.tokensUsed ? ` · ${r.tokensUsed} tokens` : ""}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <Activity className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground max-w-md">
                  No agent runs yet. Pick an agent above to get your first run on the board.
                </p>
                <Link href="/agents">
                  <Button size="sm" data-testid="button-browse-agents">Browse agents</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
