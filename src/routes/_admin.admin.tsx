import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { getAdminStats, listAllUsers, type AdminStats } from "@/lib/admin";
import { Users, UserCheck, UserPlus, UtensilsCrossed, Flame, Droplet, BookHeart, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({ meta: [{ title: "Admin · Daniyal Fitness" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const users = await listAllUsers();
      const s = await getAdminStats(users);
      if (!cancelled) {
        setStats(s);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const tiles = [
    { label: "Total users", value: stats.totalUsers, icon: Users, tone: "text-primary" },
    { label: "Active today", value: stats.activeToday, icon: UserCheck, tone: "text-success" },
    { label: "New today", value: stats.newToday, icon: UserPlus, tone: "text-info" },
    { label: "Meals logged", value: stats.totalMeals, icon: UtensilsCrossed, tone: "text-warning" },
    { label: "Calories tracked", value: stats.totalCalories.toLocaleString(), icon: Flame, tone: "text-destructive" },
    { label: "Water (L)", value: Math.round(stats.totalWaterMl / 1000), icon: Droplet, tone: "text-info" },
    { label: "Diary entries", value: stats.totalDiaries, icon: BookHeart, tone: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">Overview</h1>
        <p className="text-sm text-muted-foreground">Live snapshot from Firestore.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <GlassCard key={t.label}>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-muted/40 grid place-items-center">
                  <Icon className={`h-4 w-4 ${t.tone}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{t.label}</div>
                  <div className="font-bold text-lg leading-none mt-0.5">{t.value}</div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Aggregated stats scan up to 50 users × 30 recent days for performance.
      </p>
    </div>
  );
}
