import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  Search,
  Settings,
  Activity,
  Clock,
} from "lucide-react";
import { getSearchWorkspaceQueryOptions } from "@workspace/api-client-react";
import { agentMeta } from "@/lib/agentMeta";
import { useRecentSearches } from "@/lib/recentSearches";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV = [
  { href: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Browse AI Agents", icon: Sparkles },
  { href: "/assistant", label: "Open Business Assistant", icon: MessageSquare },
  { href: "/search", label: "Open Search Cloud", icon: Search },
  { href: "/settings", label: "Workspace Settings", icon: Settings },
];

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query.trim(), 200);
  const { recents, record } = useRecentSearches();

  // Reset on close.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data, isFetching } = useQuery({
    ...getSearchWorkspaceQueryOptions({ q: debounced || "_" }),
    enabled: open && debounced.length > 0,
    staleTime: 5_000,
  });

  // Once results land for a typed query, remember it.
  useEffect(() => {
    if (data && debounced) record(debounced);
  }, [data, debounced, record]);

  function go(href: string) {
    onOpenChange(false);
    setLocation(href);
  }

  const hasResults =
    data &&
    (data.agents.length ||
      data.runs.length ||
      data.conversations.length ||
      data.settings.length);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search agents, runs, conversations…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {debounced && !hasResults ? (
          isFetching ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : (
            <CommandEmpty>No matches for “{debounced}”.</CommandEmpty>
          )
        ) : !debounced && recents.length === 0 ? (
          <CommandEmpty>Start typing to search the workspace.</CommandEmpty>
        ) : null}

        {!debounced && recents.length > 0 && (
          <>
            <CommandGroup heading="Recent searches">
              {recents.map((r) => (
                <CommandItem
                  key={`recent-${r}`}
                  value={`recent ${r}`}
                  onSelect={() => setQuery(r)}
                  data-testid={`palette-recent-${r.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {r}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {data && data.agents.length > 0 && (
          <>
            <CommandGroup heading="Agents">
              {data.agents.map((a) => {
                const meta = agentMeta(a.id);
                return (
                  <CommandItem
                    key={`agent-${a.id}`}
                    value={`agent ${a.id} ${a.name} ${a.description}`}
                    onSelect={() => go(`/agents/${a.id}`)}
                    data-testid={`palette-agent-${a.id}`}
                  >
                    <meta.icon className={`mr-2 h-4 w-4 ${meta.accent}`} />
                    <span>{a.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {data && data.runs.length > 0 && (
          <>
            <CommandGroup heading="Runs">
              {data.runs.map((r) => {
                const meta = agentMeta(r.agentSlug);
                return (
                  <CommandItem
                    key={`run-${r.id}`}
                    value={`run ${r.id} ${r.agentName} ${r.preview}`}
                    onSelect={() => go(`/agents/${r.agentSlug}/runs/${r.id}`)}
                    data-testid={`palette-run-${r.id}`}
                  >
                    <Activity className={`mr-2 h-4 w-4 ${meta.accent}`} />
                    <div className="flex flex-1 items-center justify-between gap-3 truncate">
                      <span className="truncate">
                        {r.agentName}{" "}
                        <span className="text-xs text-muted-foreground">— {r.status}</span>
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {r.id}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {data && data.conversations.length > 0 && (
          <>
            <CommandGroup heading="Conversations">
              {data.conversations.map((c) => (
                <CommandItem
                  key={`convo-${c.id}`}
                  value={`convo ${c.title} ${c.channel}`}
                  onSelect={() => go("/assistant")}
                  data-testid={`palette-convo-${c.id}`}
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  {c.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {data && data.settings.length > 0 && (
          <>
            <CommandGroup heading="Settings">
              {data.settings.map((s) => (
                <CommandItem
                  key={`set-${s.label}-${s.href}`}
                  value={`setting ${s.label} ${s.description}`}
                  onSelect={() => go(s.href)}
                  data-testid={`palette-setting-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  {s.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigate">
          {NAV.map(({ href, label, icon: Icon }) => (
            <CommandItem
              key={href}
              value={`nav ${label}`}
              onSelect={() => go(href)}
              data-testid={`palette-nav-${href.slice(1)}`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
