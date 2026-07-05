import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    // Enforce ban / disabled flags
    const anyProfile = profile as (typeof profile & { banned?: boolean; disabled?: boolean }) | null;
    if (anyProfile?.banned || anyProfile?.disabled) {
      signOut().finally(() => navigate({ to: "/auth", replace: true }));
      return;
    }
    if (!profile) navigate({ to: "/onboarding", replace: true });
  }, [user, profile, isAdmin, loading, navigate, signOut]);

  if (loading || !user || !profile || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
