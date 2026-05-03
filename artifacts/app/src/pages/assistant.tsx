import { MessageSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssistantPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Business Assistant
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          One assistant for every channel.
        </h1>
        <p className="text-sm text-muted-foreground">
          Web, SMS, and email connect into the same conversation thread per
          customer.
        </p>
      </div>

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/20 text-accent">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Conversations</CardTitle>
            <p className="text-xs text-muted-foreground">
              Live chat coming online with the Business Assistant rollout.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-background/40 text-center">
            <Sparkles className="h-6 w-6 text-primary" />
            <div className="text-sm text-muted-foreground max-w-sm">
              No conversations yet. Once channel connections are configured,
              your customers' messages appear here in real time.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
