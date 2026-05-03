import { useEffect } from "react";
import { UserButton } from "@clerk/react";
import { Search, Command } from "lucide-react";
import { clerkAppearance } from "@/lib/clerkAppearance";

interface TopBarProps {
  onOpenPalette: () => void;
}

export function TopBar({ onOpenPalette }: TopBarProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenPalette]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <button
        type="button"
        onClick={onOpenPalette}
        className="hover-elevate group flex h-10 w-full max-w-[420px] items-center gap-3 rounded-lg border border-border bg-card/60 px-3 text-left text-sm text-muted-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Search agents, conversations, settings…</span>
        <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <UserButton
          appearance={clerkAppearance}
          showName
        />
      </div>
    </header>
  );
}
