import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Scale, BookHeart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/weight", label: "Weight", icon: Scale },
  { to: "/diary", label: "Diary", icon: BookHeart },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="glass-strong rounded-full shadow-card px-2 py-2 flex items-center justify-between">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 rounded-full py-2 transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
