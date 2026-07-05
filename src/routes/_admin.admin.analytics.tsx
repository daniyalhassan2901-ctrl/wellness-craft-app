import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { listAllUsers } from "@/lib/admin";
import { getDailyLog, listRecentLogs, todayKey } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Admin" }] }),
  component: Analytics,
});

interface AnalyticsData {
  dau: number;
  mau: number;
  growth: { date: string; count: number }[];
  topFoods: { name: string; count: number }[];
  topUsers: { name: string; email: string; activity: number }[];
}

function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    (async () => {
      const users = await listAllUsers();
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const monthAgo = now - 30 * day;

      // Growth: users created per day, last 14 days
      const growth: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * day);
        const key = d.toISOString().slice(0, 10);
        const count = users.filter((u) => {
          if (!u.createdAt) return false;
          return new Date(u.createdAt).toISOString().slice(0, 10) === key;
        }).length;
        growth.push({ date: key.slice(5), count });
      }

      const foodCounts = new Map<string, number>();
      const userActivity: { u: UserProfile; activity: number }[] = [];
      let dau = 0;
      let mau = 0;

      const scan = users.slice(0, 50);
      await Promise.all(
        scan.map(async (u) => {
          const [today, recent] = await Promise.all([
            getDailyLog(u.uid, todayKey()),
            listRecentLogs(u.uid, 30),
          ]);
          if ((today.foods?.length ?? 0) > 0 || (today.waterMl ?? 0) > 0) dau++;
          const activeInMonth = recent.some(
            (l) => (l.foods?.length ?? 0) > 0 || (l.waterMl ?? 0) > 0,
          );
          if (activeInMonth) mau++;
          const activity = recent.reduce((s, l) => s + (l.foods?.length ?? 0), 0);
          userActivity.push({ u, activity });
          recent.forEach((l) => {
            (l.foods ?? []).forEach((f) => {
              foodCounts.set(f.name, (foodCounts.get(f.name) ?? 0) + 1);
            });
          });
        }),
      );

      const topFoods = Array.from(foodCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topUsers = userActivity
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 10)
        .map(({ u, activity }) => ({ name: u.fullName || "(no name)", email: u.email || "", activity }));

      setData({ dau, mau, growth, topFoods, topUsers });
      void monthAgo;
    })();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxGrowth = Math.max(1, ...data.growth.map((g) => g.count));

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">Analytics</h1>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <div className="text-[10px] uppercase text-muted-foreground">Daily active users</div>
          <div className="text-3xl font-bold mt-1">{data.dau}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-[10px] uppercase text-muted-foreground">Monthly active users</div>
          <div className="text-3xl font-bold mt-1">{data.mau}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">User growth (14 days)</h2>
        <div className="flex items-end gap-1 h-24">
          {data.growth.map((g) => (
            <div key={g.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count ? 2 : 0 }}
                title={`${g.date}: ${g.count}`}
              />
              <div className="text-[8px] text-muted-foreground">{g.date}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Most logged foods</h2>
        <ul className="divide-y divide-border/50 text-xs">
          {data.topFoods.map((f) => (
            <li key={f.name} className="py-1.5 flex justify-between">
              <span className="truncate">{f.name}</span>
              <span className="text-muted-foreground">{f.count}×</span>
            </li>
          ))}
          {data.topFoods.length === 0 && <li className="py-2 text-muted-foreground">No data yet</li>}
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Most active users</h2>
        <ul className="divide-y divide-border/50 text-xs">
          {data.topUsers.map((u) => (
            <li key={u.email} className="py-1.5 flex justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{u.name}</div>
                <div className="text-muted-foreground truncate">{u.email}</div>
              </div>
              <span className="shrink-0 text-muted-foreground">{u.activity} meals</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
