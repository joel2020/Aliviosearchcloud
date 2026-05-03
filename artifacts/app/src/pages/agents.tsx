import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useListAgents,
  useListAgentRuns,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { agentMeta, formatRelative } from "@/lib/agentMeta";

export default function AgentsPage() {
  const { data: agents, isLoading } = useListAgents();
  const { data: runs } = useListAgentRuns({ limit: 50 });

  const lastBySlug = useMemo(() => {
    const m = new Map<string, { id: string; startedAt: string; status: string }>();
    for (const r of runs ?? []) {
      if (!m.has(r.agentSlug)) {
        m.set(r.agentSlug, {
          id: r.id,
          startedAt: r.startedAt,
          status: r.status,
        });
      }
    }
    return m;
  }, [runs]);

  return (
    <div className="space-y-8" data-testid="page-agents">
      <PageHeader
        eyebrow="AI workforce"
        title="Your 12 production agents"
        description="All agents run on your Azure OpenAI deployment. Pick one to configure and run."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(agents ?? []).map((agent, i) => {
            const meta = agentMeta(agent.id);
            const last = lastBySlug.get(agent.id);
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.025 }}
              >
                <Link href={`/agents/${agent.id}`} data-testid={`agent-card-${agent.id}`}>
                  <Card className="group flex h-full cursor-pointer flex-col border-border/70 bg-card/60 backdrop-blur hover-elevate">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-lg bg-primary/10 ${meta.accent}`}>
                        <meta.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {agent.mode}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {agent.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
                        <span>
                          {last
                            ? `Last run ${formatRelative(last.startedAt)}`
                            : "Never run"}
                        </span>
                        <Button
                          size="sm"
                          className="pointer-events-none opacity-95 group-hover:opacity-100"
                        >
                          Run agent
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
