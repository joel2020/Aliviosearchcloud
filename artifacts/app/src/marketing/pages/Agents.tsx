import { MarketingLayout } from "../components/MarketingLayout";
import { Link } from "wouter";
import { Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/marketing/lib/useSeo";
import { MARKETING_AGENTS } from "@/marketing/lib/agents";
import { CTAButton } from "@/components/CTAButton";

export default function Agents() {
  useSeo({
    title: "AI Agents",
    description: "Meet your new 12-agent revenue workforce. Specialized AI for capturing leads, converting opportunities, and scaling outbound.",
    path: "/agents",
  });

  const captureAgents = MARKETING_AGENTS.filter(a => ["missed-call", "instant-response", "lead-research"].includes(a.id));
  const convertAgents = MARKETING_AGENTS.filter(a => ["follow-up", "reactivation", "proposal", "business-assistant"].includes(a.id));
  const scaleAgents = MARKETING_AGENTS.filter(a => ["outbound-sales", "linkedin-outreach", "cold-email", "seo-content", "revenue-leak"].includes(a.id));

  const renderAgentGroup = (title: string, description: string, agents: typeof MARKETING_AGENTS) => (
    <div className="mb-24 last:mb-0">
      <div className="mb-10 border-b border-border/40 pb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-3">{title}</h2>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {agents.map(agent => (
          <div key={agent.id} id={agent.id} className="scroll-mt-32 rounded-2xl border border-border/50 bg-card p-8 hover-elevate group transition-colors hover:border-primary/30">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{agent.name}</h3>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">{agent.description}</p>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              What it does: Working 24/7, this agent ensures your business never drops the ball. It integrates seamlessly into your existing workflow to handle repetitive tasks at superhuman speed and quality, freeing you to focus on closing deals and strategy.
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-16 md:pt-32">
        <div className="mx-auto max-w-4xl text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">The Revenue Workforce.</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            12 specialized AI agents wired together to form a relentless revenue engine. They don't sleep, they don't forget to follow up, and they never miss a detail.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {renderAgentGroup(
            "Capture Revenue", 
            "Agents designed to ensure no inbound opportunity is ever missed.", 
            captureAgents.length ? captureAgents : MARKETING_AGENTS.slice(0, 3)
          )}
          
          {renderAgentGroup(
            "Convert Revenue", 
            "Agents focused on turning interest into booked meetings and signed proposals.", 
            convertAgents.length ? convertAgents : MARKETING_AGENTS.slice(3, 7)
          )}
          
          {renderAgentGroup(
            "Scale Revenue", 
            "Proactive agents that generate new pipeline through outbound and content.", 
            scaleAgents.length ? scaleAgents : MARKETING_AGENTS.slice(7, 12)
          )}
        </div>
      </section>

      <section className="px-6 py-24 text-center border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">Ready to deploy your agents?</h2>
          <p className="text-muted-foreground mb-8">Run an audit to see exactly which agents will have the biggest impact on your bottom line today.</p>
          <CTAButton
            cta="audit"
            size="lg"
            className="h-14 px-8 text-lg"
            data-testid="cta-audit-agents"
          />
        </div>
      </section>
    </MarketingLayout>
  );
}
