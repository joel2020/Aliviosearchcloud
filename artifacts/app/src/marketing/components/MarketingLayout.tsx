import { ReactNode } from "react";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground selection:bg-primary/30">
      <div className="pointer-events-none fixed inset-0 z-0 alivio-glow opacity-50 dark:opacity-100" />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
