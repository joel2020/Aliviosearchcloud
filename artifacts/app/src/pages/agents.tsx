import { motion } from "framer-motion";
import {
  Bot,
  Megaphone,
  Headphones,
  PenTool,
  Mail,
  Phone,
  TrendingUp,
  Search,
  Calendar,
  ListChecks,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AGENTS = [
  { slug: "marketing-strategist", name: "Marketing Strategist", icon: Megaphone, blurb: "Plans launches and campaigns end-to-end." },
  { slug: "content-writer", name: "Content Writer", icon: PenTool, blurb: "Long-form posts, briefs, and SEO drafts." },
  { slug: "customer-support", name: "Customer Support", icon: Headphones, blurb: "First-line replies on every channel." },
  { slug: "email-outreach", name: "Email Outreach", icon: Mail, blurb: "Cold sequences with personalization." },
  { slug: "sms-concierge", name: "SMS Concierge", icon: Phone, blurb: "Two-way SMS for bookings and reminders." },
  { slug: "sales-coach", name: "Sales Coach", icon: TrendingUp, blurb: "Reviews calls and recommends next steps." },
  { slug: "seo-auditor", name: "SEO Auditor", icon: Search, blurb: "On-page audit + keyword expansion." },
  { slug: "scheduler", name: "Scheduler", icon: Calendar, blurb: "Books meetings across teams and zones." },
  { slug: "ops-checklist", name: "Ops Checklist", icon: ListChecks, blurb: "Daily and weekly operating rhythms." },
  { slug: "compliance-watch", name: "Compliance Watch", icon: ShieldCheck, blurb: "Reviews docs against your policies." },
  { slug: "billing-bot", name: "Billing Bot", icon: Wallet, blurb: "Drafts invoices and chases collections." },
  { slug: "research-assistant", name: "Research Assistant", icon: Bot, blurb: "Briefs on competitors and markets." },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          AI workforce
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your 12 production agents
        </h1>
        <p className="text-sm text-muted-foreground">
          All agents run on your Azure OpenAI deployment. Deeper wiring lands in the next release.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map(({ slug, name, icon: Icon, blurb }, i) => (
          <motion.div
            key={slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.025 }}
          >
            <Card className="group h-full border-border/70 bg-card/60 backdrop-blur hover-elevate cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  Beta
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="text-base">{name}</CardTitle>
                <p className="text-sm text-muted-foreground">{blurb}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
