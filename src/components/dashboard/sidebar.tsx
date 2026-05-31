import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Contact2,
  LayoutDashboard,
  MessageSquareText,
  Send,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Campaigns", to: "/campaigns", icon: Send },
  { label: "Contacts", to: "/contacts", icon: Contact2 },
  { label: "Templates", to: "/templates", icon: MessageSquareText },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Billing", to: "/billing", icon: Wallet },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Pulse SMS</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Workspace
        </p>
        {nav.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-primary")} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 rounded-xl glass p-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
              AK
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Alex Kim</p>
              <p className="text-[10px] text-muted-foreground truncate">acme.co</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
