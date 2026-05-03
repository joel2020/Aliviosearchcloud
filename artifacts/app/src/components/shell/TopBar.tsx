import { useEffect } from "react";
import { useUser, useClerk } from "@clerk/react";
import { Search, Command, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopBarProps {
  onOpenPalette: () => void;
}

export function TopBar({ onOpenPalette }: TopBarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

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

  const initial =
    user?.firstName?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "A";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover-elevate gap-2 px-2"
            >
              <Avatar className="h-7 w-7">
                {user?.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={user.fullName ?? ""} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
