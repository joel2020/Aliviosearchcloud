import { useGetCurrentUser, useGetCurrentBusiness } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Sparkles, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATS = [
  { label: "Active agents", value: "12", icon: Bot, accent: "text-primary" },
  { label: "Runs this week", value: "—", icon: Activity, accent: "text-accent" },
  { label: "Conversations", value: "—", icon: MessageSquare, accent: "text-chart-3" },
  { label: "Tokens used", value: "—", icon: Sparkles, accent: "text-chart-4" },
];

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const { data: biz, isLoading: bizLoading } = useGetCurrentBusiness();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {bizLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            biz?.name ?? "Your workspace"
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          {userLoading ? "Loading…" : `Welcome back, ${user?.fullName ?? user?.email ?? "operator"}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, accent }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
          >
            <Card className="border-border/70 bg-card/60 backdrop-blur hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${accent}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Get started</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="text-foreground font-medium mb-1">1. Pick an agent</div>
            Browse the 12-agent library and run your first workflow.
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="text-foreground font-medium mb-1">2. Connect a channel</div>
            Wire up email, SMS, or web for your Business Assistant.
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="text-foreground font-medium mb-1">3. Invite teammates</div>
            Coming soon — multi-user workspaces are around the corner.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
