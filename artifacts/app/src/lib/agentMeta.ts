import {
  Activity,
  Bot,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Linkedin,
  Mail,
  MessageSquare,
  PhoneIncoming,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const META: Record<string, { icon: LucideIcon; accent: string }> = {
  "revenue-leak": { icon: CircleDollarSign, accent: "text-primary" },
  "missed-call": { icon: PhoneIncoming, accent: "text-accent" },
  "instant-response": { icon: Sparkles, accent: "text-chart-3" },
  "follow-up": { icon: CalendarClock, accent: "text-chart-4" },
  reactivation: { icon: Activity, accent: "text-chart-5" },
  "outbound-sales": { icon: TrendingUp, accent: "text-primary" },
  "linkedin-outreach": { icon: Linkedin, accent: "text-accent" },
  "cold-email": { icon: Mail, accent: "text-chart-3" },
  "lead-research": { icon: Search, accent: "text-chart-4" },
  proposal: { icon: FileText, accent: "text-chart-5" },
  "seo-content": { icon: Send, accent: "text-primary" },
  "business-assistant": { icon: MessageSquare, accent: "text-accent" },
};

const FALLBACK = { icon: Bot, accent: "text-muted-foreground" };

const NAMES: Record<string, string> = {
  "revenue-leak": "Revenue Leak Finder",
  "missed-call": "Missed Call Responder",
  "instant-response": "Instant Lead Response",
  "follow-up": "Follow-Up Sequencer",
  reactivation: "Reactivation Campaign",
  "outbound-sales": "Outbound Sales Strategist",
  "linkedin-outreach": "LinkedIn Outreach",
  "cold-email": "Cold Email Writer",
  "lead-research": "Lead Research",
  proposal: "Proposal Generator",
  "seo-content": "SEO Content Brief",
  "business-assistant": "Business Assistant",
};

export function agentMeta(slug: string) {
  return META[slug] ?? FALLBACK;
}

export function agentName(slug: string): string {
  return NAMES[slug] ?? slug;
}

export function statusTone(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case "ok":
      return { label: "OK", className: "bg-chart-4/15 text-chart-4 border-chart-4/30" };
    case "failed":
      return { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "invalid_input":
      return { label: "Invalid input", className: "bg-chart-5/15 text-chart-5 border-chart-5/30" };
    case "not_configured":
      return { label: "Not configured", className: "bg-muted/40 text-muted-foreground border-border" };
    case "pending":
      return { label: "Pending", className: "bg-primary/10 text-primary border-primary/30" };
    default:
      return { label: status, className: "bg-muted/40 text-muted-foreground border-border" };
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "—";
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}
