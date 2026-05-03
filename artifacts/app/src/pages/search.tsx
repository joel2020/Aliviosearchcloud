import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Search Cloud
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Search across every agent run.
        </h1>
        <p className="text-sm text-muted-foreground">
          Indexing pipeline ships with the agent runtime release.
        </p>
      </div>

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agent runs, conversations, documents…"
              className="pl-9"
              disabled
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Search index is provisioning. This UI will activate once the agent
            runtime publishes its first run events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
