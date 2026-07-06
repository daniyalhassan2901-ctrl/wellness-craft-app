import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, LayoutDashboard, Users, Utensils, BarChart3, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          You do not have permission to view this page. This area is restricted to authorized administrators.
        </p>
        <button
          onClick={() => navigate({ to: "/dashboard", replace: true })}
          className="mt-6 rounded-full gradient-hero text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-glow"
        >
          Back to app
        </button>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/foods", label: "Foods", icon: Utensils },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">Admin Panel</div>
              <div className="text-[10px] text-muted-foreground">Daniyal Fitness</div>
            </div>
          </div>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/auth", replace: true }))}
            className="glass rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
        <div className="mx-auto max-w-5xl px-2 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => {
            const active =
              n.to === "/admin"
                ? pathname === "/admin"
                : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "glass text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">
        <ErrorBoundary label="Admin panel error">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
