import { MarketingLayout } from "../components/MarketingLayout";
import { CheckCircle2 } from "lucide-react";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTAButton } from "@/components/CTAButton";

export default function Pricing() {
  useSeo({
    title: "Pricing",
    description: "Simple, transparent pricing for your AI Revenue Engine. Stop losing leads and start scaling pipeline today.",
    path: "/pricing",
  });

  const faqs = [
    {
      q: "What does the 10-day implementation include?",
      a: "We fully configure all 12 agents, integrate with your existing channels (website, email, CRM), load your business context, and train the AI on your specific offers. You go live on day 10."
    },
    {
      q: "How does the ongoing optimization work?",
      a: "AI isn't set-and-forget. We monitor agent conversations, tweak prompts, adjust to new products you launch, and ensure your revenue engine is constantly improving its conversion rates."
    },
    {
      q: "Are there long-term contracts?",
      a: "No. After the initial implementation, the monthly optimization fee is month-to-month. We keep your business by driving revenue, not by locking you into paper."
    },
    {
      q: "Do I pay separately for AI tokens?",
      a: "Your monthly fee includes a generous allocation of Azure OpenAI tokens that covers 95% of small businesses. High-volume outbound accounts may incur exact-cost token pass-throughs, which we discuss upfront."
    },
    {
      q: "What channels do you support?",
      a: "Out of the box, we support web chat, email, and SMS (via Twilio). WhatsApp is supported for a small additional setup fee. We wire the agents directly into where your customers are."
    },
    {
      q: "Who is this for?",
      a: "Small to medium businesses making $500k to $5M/year who are spending on marketing but feeling the pain of missed calls, slow response times, and inconsistent follow-ups."
    }
  ];

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-16 md:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Transparent pricing for real revenue growth.</h1>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto text-balance">
            Stop paying for disjointed tools. Invest in a unified system that pays for itself by capturing the leads you're already dropping.
          </p>

          <div className="rounded-3xl border border-primary/30 bg-card/50 p-8 md:p-12 shadow-2xl relative overflow-hidden text-left backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="flex flex-col md:flex-row gap-12 relative z-10">
              <div className="flex-1">
                <div className="inline-block rounded-full bg-primary/20 text-primary px-4 py-1.5 text-sm font-bold tracking-wider uppercase mb-6">The Engine</div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">10-Day AI Revenue Engine</h2>
                <div className="space-y-3 mb-10">
                  <div>
                    <p className="text-3xl font-light text-foreground">$2,500–$5,000</p>
                    <p className="text-muted-foreground">one-time implementation</p>
                  </div>
                  <div className="h-px w-16 bg-border my-4"></div>
                  <div>
                    <p className="text-2xl font-light text-foreground">$750–$1,500<span className="text-lg">/mo</span></p>
                    <p className="text-muted-foreground">ongoing optimization & platform access</p>
                  </div>
                </div>
                
                <CTAButton
                  cta="install"
                  size="lg"
                  className="w-full text-lg h-14 font-semibold shadow-xl shadow-primary/20"
                  data-testid="cta-install-pricing"
                />
                <CTAButton
                  cta="audit-paid"
                  variant="outline"
                  size="lg"
                  className="w-full text-base h-12 mt-3"
                  data-testid="cta-audit-paid-pricing"
                />
              </div>
              
              <div className="flex-1 md:border-l md:border-border/50 md:pl-12">
                <h4 className="font-semibold text-xl mb-6">Everything you need to scale:</h4>
                <ul className="space-y-5">
                  {[
                    "Full setup of all 12 AI agents",
                    "Custom business context loading",
                    "Channel wiring (Web, SMS, Email)",
                    "Dedicated Business Assistant setup",
                    "Comprehensive revenue audit",
                    "Continuous prompt optimization",
                    "Priority technical support",
                    "Monthly performance reviews"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 bg-card/30 border-t border-border/40">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-background border border-border/50 rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-3">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center border-t border-border/40">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">Need a custom enterprise setup?</h2>
          <p className="text-muted-foreground mb-8">For high-volume operations requiring deep CRM integrations and custom agent workflows.</p>
          <CTAButton
            cta="book-call"
            variant="outline"
            size="lg"
            data-testid="cta-book-call-pricing"
          />
        </div>
      </section>
    </MarketingLayout>
  );
}
