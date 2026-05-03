import { Link } from "wouter";
import {
  useGetAgent,
  useGetAgentRun,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { RunResultViewer } from "@/components/agents/RunResultViewer";
import { agentMeta, formatRelative } from "@/lib/agentMeta";

interface AgentRunDetailPageProps {
  params: { id: string; runId: string };
}

export default function AgentRunDetailPage({
  params,
}: AgentRunDetailPageProps) {
  const { id, runId } = params;
  const { data: agent } = useGetAgent(id);
  const { data: run, isLoading, isError, error } = useGetAgentRun(runId);

  // Guard: route id must match the run's actual agent. Otherwise the page
  // would render misleading breadcrumb / icon / metadata.
  if (run && run.agentSlug !== id) {
    return (
      <div className="space-y-6" data-testid="page-run-mismatch">
        <Link href={`/agents/${run.agentSlug}/runs/${runId}`}>
          <Button variant="ghost" size="sm" data-testid="button-go-correct-agent">
            <ArrowLeft className="h-4 w-4" /> Open under {run.agentSlug}
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="py-6 text-sm text-destructive">
            Run <span className="font-mono">{runId}</span> belongs to agent{" "}
            <span className="font-mono">{run.agentSlug}</span>, not{" "}
            <span className="font-mono">{id}</span>.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    return (
      <div className="space-y-6" data-testid="page-run-not-found">
        <Link href={`/agents/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to agent
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="py-6 text-sm text-destructive">
            {status === 404
              ? `Run ${runId} not found in this workspace.`
              : `Could not load run: ${error instanceof Error ? error.message : "Unknown error"}.`}
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = agentMeta(id);

  return (
    <div className="space-y-6" data-testid="page-agent-run-detail">
      <Link href={`/agents/${id}`}>
        <Button variant="ghost" size="sm" data-testid="button-back-agent">
          <ArrowLeft className="h-4 w-4" /> Back to {agent?.name ?? "agent"}
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
            <span>{agent?.name ?? id}</span>
          </span>
        }
        title={
          isLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <span className="font-mono text-2xl">{runId}</span>
          )
        }
        description={
          run
            ? `Started ${formatRelative(run.startedAt)} · ${run.completedAt ? `completed ${formatRelative(run.completedAt)}` : "in progress"}`
            : undefined
        }
      />

      {isLoading || !run ? (
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : (
        <RunResultViewer run={run} />
      )}
    </div>
  );
}
