import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getSearchWorkspaceQueryOptions,
  type SearchResults,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/PageHeader";
import { agentMeta, formatRelative, statusTone } from "@/lib/agentMeta";

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const debounced = useDebounced(q.trim(), 250);

  const { data, isFetching } = useQuery({
    ...getSearchWorkspaceQueryOptions({ q: debounced || "_" }),
    enabled: debounced.length > 0,
  });

  return (
    <div className="space-y-8" data-testid="page-search">
      <PageHeader
        eyebrow="Search Cloud"
        title="Search across your workspace."
        description="Agents, runs, conversations, and settings — one box."
      />

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Try “revenue leak”, “cold email”, or “follow up”…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {!debounced ? (
        <EmptyHint />
      ) : isFetching && !data ? (
        <ResultSkeleton />
      ) : data ? (
        <Results results={data} />
      ) : null}
    </div>
  );
}

function EmptyHint() {
  return (
    <Card className="border-dashed border-border/60 bg-card/30">
      <CardContent className="py-12 text-center">
        <SearchIcon className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Type a query to search agents, runs, conversations, and settings.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tip: press{" "}
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          anywhere in the app for a quick palette.
        </p>
      </CardContent>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function Results({ results }: { results: SearchResults }) {
  const total = useMemo(
    () =>
      results.agents.length +
      results.runs.length +
      results.conversations.length +
      results.settings.length,
    [results],
  );

  if (total === 0) {
    return (
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No matches for <span className="font-medium text-foreground">“{results.query}”</span>.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {results.agents.length > 0 && (
        <Card className="border-border/70 bg-card/60 backdrop-blur" data-testid="results-agents">
          <CardHeader>
            <CardTitle className="text-base">
              Agents <Badge variant="outline">{results.agents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {results.agents.map((a) => {
              const meta = agentMeta(a.id);
              return (
                <Link
                  key={a.id}
                  href={`/agents/${a.id}`}
                  className="hover-elevate group flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                  data-testid={`result-agent-${a.id}`}
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-md bg-primary/10 ${meta.accent}`}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {results.runs.length > 0 && (
        <Card className="border-border/70 bg-card/60 backdrop-blur" data-testid="results-runs">
          <CardHeader>
            <CardTitle className="text-base">
              Agent runs <Badge variant="outline">{results.runs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {results.runs.map((r) => {
              const meta = agentMeta(r.agentSlug);
              const tone = statusTone(r.status);
              return (
                <Link
                  key={r.id}
                  href={`/agents/${r.agentSlug}/runs/${r.id}`}
                  className="hover-elevate group flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                  data-testid={`result-run-${r.id}`}
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-md bg-primary/10 ${meta.accent}`}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.agentName}</span>
                      <Badge variant="outline" className={tone.className}>
                        {tone.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelative(r.startedAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{r.preview}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {results.conversations.length > 0 && (
        <Card className="border-border/70 bg-card/60 backdrop-blur" data-testid="results-conversations">
          <CardHeader>
            <CardTitle className="text-base">
              Conversations <Badge variant="outline">{results.conversations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {results.conversations.map((c) => (
              <Link
                key={c.id}
                href="/assistant"
                className="hover-elevate group flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                data-testid={`result-convo-${c.id}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.channel} · {formatRelative(c.updatedAt)}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {results.settings.length > 0 && (
        <Card className="border-border/70 bg-card/60 backdrop-blur" data-testid="results-settings">
          <CardHeader>
            <CardTitle className="text-base">
              Settings <Badge variant="outline">{results.settings.length}</Badge>
            </CardTitle>
            <CardDescription>Jump to workspace config.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {results.settings.map((s) => (
              <Link
                key={s.href + s.label}
                href={s.href}
                className="hover-elevate group flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                data-testid={`result-setting-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
