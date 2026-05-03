import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV = [
  { href: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Browse AI Agents", icon: Sparkles },
  {
    href: "/assistant",
    label: "Open Business Assistant",
    icon: MessageSquare,
  },
  { href: "/search", label: "Search Cloud", icon: Search },
  { href: "/settings", label: "Workspace Settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search the Alivio workspace…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV.map(({ href, label, icon: Icon }) => (
            <CommandItem
              key={href}
              onSelect={() => {
                onOpenChange(false);
                setLocation(href);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
