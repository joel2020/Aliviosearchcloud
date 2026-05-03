import { Link, useLocation } from "wouter";
import {
  useGetAgent,
  useListAgentRuns,
  useRunAgent,
  type AgentRun,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Section } from "@/components/shell/Section";
import { AgentForm } from "@/components/agents/AgentForm";
import { useToast } from "@/hooks/use-toast";
import { agentMeta, formatRelative, statusTone } from "@/lib/agentMeta";

interface AgentDetailPageProps {
  params: { id: string };
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const id = params.id;
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const {
    data: agent,
    isLoading: agentLoading,
    isError,
    error,
  } = useGetAgent(id);
  const { data: runs, isLoading: runsLoading } = useListAgentRuns({
    limit: 10,
    agentId: id,
  });

  const runAgent = useRunAgent({
    mutation: {
      onSuccess: (run: AgentRun) => {
        toast({
          title: "Agent run complete",
          description: `Status: ${run.status}.`,
        });
        qc.invalidateQueries({ queryKey: ["/api/agent-runs"] });
        qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
        setLocation(`/agents/${id}/runs/${run.id}`);
      },
      onError: (err) => {
        toast({
          title: "Run failed",
          description: err instanceof Error ? err.message : "Unknown error.",
          variant: "destructive",
        });
      },
    },
  });

  if (isError) {
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    return (
      <div className="space-y-6" data-testid="page-agent-not-found">
        <Link href="/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to agents
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="py-6 text-sm text-destructive">
            {status === 404
              ? `No agent with id "${id}".`
              : `Could not load agent: ${error instanceof Error ? error.message : "Unknown error"}.`}
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = agentMeta(id);

  return (
    <div className="space-y-8" data-testid="page-agent-detail">
      <Link href="/agents">
        <Button variant="ghost" size="sm" data-testid="button-back-agents">
          <ArrowLeft className="h-4 w-4" /> Back to agents
        </Button>
      </Link>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-md bg-primary/10 ${meta.accent}`}
            >
              <meta.icon className="h-4 w-4" />
            </span>
            <span>Agent · {agent?.mode ?? "—"}</span>
          </span>
        }
        title={
          agentLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            agent?.name ?? "Agent"
          )
        }
        description={agent?.description}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="border-border/70 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Configure & run</CardTitle>
            </CardHeader>
            <CardContent>
              {agentLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : agent ? (
                <AgentForm
                  fields={agent.fields}
                  isSubmitting={runAgent.isPending}
                  onSubmit={(input) =>
                    runAgent.mutate({ id, data: { input } })
                  }
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Section
            title={
              <span className="inline-flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Run history
              </span>
            }
          >
            <Card className="border-border/70 bg-card/60 backdrop-blur">
              <CardContent className="p-0" data-testid="card-run-history">
                {runsLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : runs && runs.length > 0 ? (
                  <ul className="divide-y divide-border/60">
                    {runs.map((r) => {
                      const tone = statusTone(r.status);
                      return (
                        <li key={r.id}>
                          <Link
                            href={`/agents/${id}/runs/${r.id}`}
                            className="hover-elevate block px-4 py-3"
                            data-testid={`history-run-${r.id}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">
                                  {formatRelative(r.startedAt)}
                                </div>
                                <div className="truncate font-mono text-[11px] text-muted-foreground/80">
                                  {r.id}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={tone.className}
                              >
                                {tone.label}
                              </Badge>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No runs yet for this agent.
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}
