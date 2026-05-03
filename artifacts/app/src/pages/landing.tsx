import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { basePath } from "@/lib/clerkAppearance";

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 alivio-glow pointer-events-none" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-background font-bold">
            A
          </div>
          <span className="text-base font-semibold tracking-tight">
            Alivio Search Cloud
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-2">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col items-center px-6 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          12 AI agents · powered by Azure OpenAI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-[900px] text-balance text-4xl font-semibold tracking-tight md:text-6xl"
        >
          The AI workforce your{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            small business
          </span>{" "}
          deserves.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 max-w-[640px] text-balance text-base text-muted-foreground md:text-lg"
        >
          A unified workspace for marketing, support, sales, and operations
          agents — wired into your tools, your customers, and your assistant.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </motion.div>

        <div className="mt-20 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "12 production agents",
              body: "From content to support to outbound — all running on Azure OpenAI.",
            },
            {
              icon: BarChart3,
              title: "Live analytics",
              body: "Track tokens, runs, and outcomes for every agent in real time.",
            },
            {
              icon: Sparkles,
              title: "Business Assistant",
              body: "Chat with your business across web, SMS, and email channels.",
            },
          ].map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.05 }}
              className="rounded-2xl border border-border bg-card/60 p-6 text-left backdrop-blur hover-elevate"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-24 w-full max-w-[1200px] border-t border-border/60 px-6 py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alivio Search Cloud · {basePath || "/"}
      </footer>
    </div>
  );
}
