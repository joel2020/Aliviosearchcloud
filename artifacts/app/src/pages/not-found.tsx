import { Link } from "wouter";
import { ArrowRight, Home } from "lucide-react";
import { MarketingLayout } from "@/marketing/components/MarketingLayout";
import { CTAButton } from "@/components/CTAButton";
import { useSeo } from "@/marketing/lib/useSeo";

export default function NotFound() {
  useSeo({
    title: "Page not found",
    description:
      "The page you're looking for doesn't exist. Head back to Alivio Search Cloud or run a free revenue audit.",
    path: "/404",
    noIndex: true,
  });

  return (
    <MarketingLayout>
      <section className="px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-primary mb-6">
            Error 404
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            This page got away from us.
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto text-balance">
            The page you tried to reach doesn't exist — or it moved. The good
            news: every other lead in your business doesn't have to slip away
            too.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <CTAButton
              cta="audit"
              size="lg"
              className="h-12 px-6"
              data-testid="cta-audit-404"
            />
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md border border-border/60 text-foreground hover-elevate"
              data-testid="link-home-404"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </div>

          <div className="mx-auto max-w-md text-left rounded-2xl border border-border/40 bg-card/40 p-6">
            <p className="text-sm font-medium text-foreground/80 mb-3">
              Looking for something specific?
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Meet the 12 AI agents <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Read the revenue engine blog{" "}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  About Alivio <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Talk to us <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
