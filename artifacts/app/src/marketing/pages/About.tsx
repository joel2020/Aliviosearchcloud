import { MarketingLayout } from "../components/MarketingLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/marketing/lib/useSeo";
import { CTA_AUDIT } from "@/marketing/lib/ctas";

export default function About() {
  useSeo({
    title: "About Us",
    description: "We install AI systems that capture, convert, and scale revenue for small businesses.",
    path: "/about",
  });

  return (
    <MarketingLayout>
      <section className="px-6 pt-24 pb-20 md:pt-32 md:pb-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">About Alivio</h1>
          
          <div className="space-y-16">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-primary">The Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We install AI systems that capture, convert, and scale revenue — starting with the leads you're already losing. We believe that small business owners shouldn't have to work 80-hour weeks just to keep up with follow-ups and inbound inquiries.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-primary">Who it's for</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Small to medium businesses making good money but feeling the operational strain. If you have leads you can't keep up with, quotes that take too long to send, and a nagging feeling that things are slipping through the cracks—Alivio is built for you.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-primary">How we are different</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We don't just hand you a software tool and wish you luck. We deploy 24/7 AI agents wired directly into the channels you actually use. Our engine works alongside you, handling the high-volume, low-leverage work so you can focus on the relationships that matter.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-6 text-primary">Our Principles</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="h-6 w-1 bg-accent rounded-full shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Honest Measurement</h3>
                    <p className="text-muted-foreground">We track real revenue impact, not vanity metrics.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="h-6 w-1 bg-accent rounded-full shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">No Hallucinated Metrics</h3>
                    <p className="text-muted-foreground">If the data isn't there, our agents will tell you. We value accuracy over sounding smart.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="h-6 w-1 bg-accent rounded-full shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Ship in 10 Days</h3>
                    <p className="text-muted-foreground">Time kills deals. We get your engine live and generating value in less than two weeks.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="h-6 w-1 bg-accent rounded-full shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Plain English</h3>
                    <p className="text-muted-foreground">No technical jargon. We speak the language of business and revenue.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-8">Join the businesses scaling with Alivio.</h2>
          <Link href={CTA_AUDIT.href}>
            <Button size="lg" className="h-14 px-8 text-lg">{CTA_AUDIT.label}</Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
