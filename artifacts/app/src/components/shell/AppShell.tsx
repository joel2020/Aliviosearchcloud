import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-[100dvh] flex-1 flex-col">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="relative flex-1 overflow-y-auto">
          <div className="absolute inset-0 alivio-glow opacity-60 pointer-events-none" />
          <div className="relative mx-auto w-full max-w-[1280px] px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
