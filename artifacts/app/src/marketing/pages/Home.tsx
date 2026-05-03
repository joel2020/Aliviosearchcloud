import { MarketingLayout } from "../components/MarketingLayout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Target, Zap, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTA_AUDIT, CTA_BOOK_CALL, CTA_INSTALL, CTA_ASSISTANT } from "@/marketing/lib/ctas";
import { MARKETING_AGENTS } from "@/marketing/lib/agents";
import { MARKETING_BLOG_POSTS } from "@/marketing/lib/blogPosts";
import { Input } from "@/components/ui/input";

export default function Home() {
  useSeo({
    title: "Alivio Search Cloud | AI Revenue Engine",
    description: "Alivio helps small businesses recover missed revenue, follow up with every lead, and scale pipeline with AI agents that never sleep.",
    path: "/",
  });

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-36 md:pb-40 overflow-hidden">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Meet your new 24/7 AI workforce
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-balance text-foreground mb-6"
          >
            AI Revenue Engine That Captures, Converts, and Scales Your Pipeline
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
          >
            Alivio helps small businesses recover missed revenue, follow up with every lead, and scale pipeline with AI agents that never sleep.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={CTA_AUDIT.href}>
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-xl shadow-primary/20 gap-2">
                {CTA_AUDIT.label} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={CTA_BOOK_CALL.href}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold">
                {CTA_BOOK_CALL.label}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-t border-border/40 bg-card/30 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Target className="h-12 w-12 text-destructive mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-balance">
            Most businesses don't have a lead problem. They have a response and follow-up problem.
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Every missed call, delayed email, and forgotten follow-up is money left on the table. You're spending on marketing, but losing the revenue in the gaps. Alivio plugs the leaks instantly.
          </p>
        </div>
      </section>

      {/* The System */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">The System</h2>
            <p className="text-muted-foreground text-lg">A complete loop to maximize every opportunity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-border/50 bg-card p-8 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Capture Revenue</h3>
              <p className="text-muted-foreground mb-6">
                Never let a lead slip away. We instantly capture missed calls, respond to inquiries within seconds, and research prospects before you even speak to them.
              </p>
              <div className="text-sm font-medium text-foreground">
                Powered by: Missed Call, Instant Response, Lead Research
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-8 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Convert Revenue</h3>
              <p className="text-muted-foreground mb-6">
                Turn interest into closed deals. Relentless automated follow-ups, reactivation of dead leads, and instant proposal generation while the intent is high.
              </p>
              <div className="text-sm font-medium text-foreground">
                Powered by: Follow-Up, Reactivation, Proposal, Business Assistant
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-8 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-chart-4/20 text-chart-4 flex items-center justify-center mb-6">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Scale Revenue</h3>
              <p className="text-muted-foreground mb-6">
                Create new pipeline proactively. AI-driven outbound sales, personalized LinkedIn outreach, cold email campaigns, and SEO content generation.
              </p>
              <div className="text-sm font-medium text-foreground">
                Powered by: Outbound Sales, LinkedIn Outreach, Cold Email, SEO Content, Revenue Leak
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Grid */}
      <section className="border-t border-border/40 bg-card/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">12 Agents. One Mission.</h2>
            <p className="text-muted-foreground text-lg">Your specialized AI workforce, ready to deploy.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MARKETING_AGENTS.map((agent) => (
              <Link key={agent.id} href={`/agents#${agent.id}`}>
                <div className="group rounded-xl border border-border/40 bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{agent.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Audit CTA Band */}
      <section className="relative px-6 py-24 overflow-hidden bg-primary/5 border-y border-primary/20">
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 text-balance">
            See how much revenue you are losing before another lead disappears.
          </h2>
          <Link href={CTA_AUDIT.href}>
            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20">
              {CTA_AUDIT.label}
            </Button>
          </Link>
        </div>
      </section>

      {/* Offer Card */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex flex-col md:flex-row gap-12 relative z-10">
              <div className="flex-1">
                <div className="inline-block rounded-full bg-accent/20 text-accent px-3 py-1 text-xs font-bold tracking-wider uppercase mb-6">Premium Setup</div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">10-Day AI Revenue Engine</h2>
                <div className="space-y-2 mb-8">
                  <p className="text-2xl font-light text-foreground">$2,500–$5,000 <span className="text-lg text-muted-foreground">implementation</span></p>
                  <p className="text-xl font-light text-foreground">$750–$1,500/month <span className="text-lg text-muted-foreground">optimization</span></p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={CTA_INSTALL.href} className="flex-1">
                    <Button size="lg" className="w-full text-base font-semibold">
                      {CTA_INSTALL.label}
                    </Button>
                  </Link>
                  <Link href="/pricing" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full text-base">
                      See full pricing
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex-1 md:border-l md:border-border/50 md:pl-12">
                <h4 className="font-semibold text-lg mb-6">What's included:</h4>
                <ul className="space-y-4">
                  {[
                    "Installation of all 12 specialized agents",
                    "Business assistant setup & training",
                    "Complete revenue audit + roadmap",
                    "Channel integrations (Web, Email, SMS)",
                    "Ongoing optimization & priority support"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="border-t border-border/40 bg-card/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Insights from the Revenue Engine</h2>
          </div>
          
          {(!MARKETING_BLOG_POSTS || MARKETING_BLOG_POSTS.length === 0) ? (
            <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-background p-10">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">New revenue playbooks landing soon.</h3>
              <p className="text-muted-foreground mb-6">Subscribe to be the first to read them.</p>
              <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); window.location.href = CTA_AUDIT.href; }}>
                <Input type="email" placeholder="hello@yourbusiness.com" className="flex-1" />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {MARKETING_BLOG_POSTS.slice(0, 3).map((post) => (
                <div key={post.slug} className="group rounded-2xl border border-border bg-background overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="aspect-[16/9] bg-muted/50 w-full"></div>
                  <div className="p-6">
                    <p className="text-xs text-muted-foreground mb-2">{post.publishedAt}</p>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-32 border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5"></div>
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Stop losing leads. Start scaling revenue.</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href={CTA_AUDIT.href}>
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold shadow-xl">
                {CTA_AUDIT.label}
              </Button>
            </Link>
            <Link href={CTA_BOOK_CALL.href}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-background">
                {CTA_BOOK_CALL.label}
              </Button>
            </Link>
          </div>
          <div className="mb-6">
            <Link href={CTA_ASSISTANT.href}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                Already a customer? {CTA_ASSISTANT.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Trusted by small businesses scaling to 7 figures and beyond.</span>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
