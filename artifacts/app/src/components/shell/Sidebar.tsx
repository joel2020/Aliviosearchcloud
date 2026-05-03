import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  Search,
  Settings,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "AI Agents", icon: Sparkles },
  { href: "/assistant", label: "Business Assistant", icon: MessageSquare },
  { href: "/search", label: "Search Cloud", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-6 backdrop-blur md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 pb-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-background">
          <CircleDot className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Alivio</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Search Cloud
          </span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover-elevate",
                active
                  ? "text-foreground"
                  : "text-sidebar-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
        <div className="text-xs font-semibold text-foreground">Pro tip</div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Press{" "}
          <kbd className="rounded border border-sidebar-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          to open the command palette.
        </p>
      </div>
    </aside>
  );
}
