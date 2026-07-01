import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listRecentLogs, listWeights } from "@/lib/firestore";
import type { DailyLog, WeightEntry } from "@/lib/types";
import { calcBMR, calcMacros, calcTDEE, calcTargets } from "@/lib/calculations";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Daniyal Fitness" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [range, setRange] = useState<7 | 14 | 30>(7);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    listRecentLogs(user.uid, range).then(setLogs);
    listWeights(user.uid).then(setWeights);
  }, [user, range]);

  const targets = useMemo(() => {
    if (!profile) return null;
    const bmr = calcBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    const t = calcTargets(tdee, profile.fitnessGoal);
    const m = calcMacros(t.calories, profile.weightKg, profile.fitnessGoal);
    return { ...t, ...m };
  }, [profile]);

  const summary = useMemo(() => {
    const days = logs.length || 1;
    let cal = 0, p = 0, c = 0, f = 0, hit = 0;
    logs.forEach((d) => {
      const cc = d.foods.reduce((s, x) => s + x.calories, 0);
      cal += cc;
      p += d.foods.reduce((s, x) => s + x.protein, 0);
      c += d.foods.reduce((s, x) => s + x.carbs, 0);
      f += d.foods.reduce((s, x) => s + x.fat, 0);
      if (targets && cc > 0 && cc <= targets.calories * 1.05) hit++;
    });
    return {
      avgCal: Math.round(cal / days),
      avgP: Math.round(p / days),
      avgC: Math.round(c / days),
      avgF: Math.round(f / days),
      goalRate: Math.round((hit / days) * 100),
    };
  }, [logs, targets]);

  if (!profile || !targets) return null;

  const maxCal = Math.max(targets.calories, ...logs.map((d) => d.foods.reduce((s, f) => s + f.calories, 0)));

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Trends across time.</p>
        </div>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${range === r ? "bg-primary text-primary-foreground" : "glass"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard padded={false} className="p-4">
          <div className="text-xs text-muted-foreground">Avg calories</div>
          <div className="text-2xl font-bold">{summary.avgCal}</div>
          <div className="text-[10px] text-muted-foreground">target {targets.calories}</div>
        </GlassCard>
        <GlassCard padded={false} className="p-4">
          <div className="text-xs text-muted-foreground">On-target days</div>
          <div className="text-2xl font-bold">{summary.goalRate}%</div>
          <div className="text-[10px] text-muted-foreground">over {logs.length}d</div>
        </GlassCard>
        <GlassCard padded={false} className="p-4">
          <div className="text-xs text-muted-foreground">Avg protein</div>
          <div className="text-2xl font-bold">{summary.avgP}g</div>
        </GlassCard>
        <GlassCard padded={false} className="p-4">
          <div className="text-xs text-muted-foreground">Avg carbs / fat</div>
          <div className="text-2xl font-bold">{summary.avgC}<span className="text-sm text-muted-foreground"> / {summary.avgF}g</span></div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="text-sm font-semibold mb-3">Calories per day</div>
        <div className="flex items-end justify-between gap-1 h-32">
          {logs.map((d) => {
            const cal = d.foods.reduce((s, f) => s + f.calories, 0);
            const pct = Math.max(4, (cal / maxCal) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md gradient-hero transition-all"
                    style={{ height: `${pct}%`, opacity: cal > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(d.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold mb-3">Weight trend</div>
        {weights.length > 1 ? (
          <WeightMini entries={weights.slice(-range)} />
        ) : (
          <div className="text-sm text-muted-foreground text-center py-6">Log more weights to see trends.</div>
        )}
      </GlassCard>
    </div>
  );
}

function WeightMini({ entries }: { entries: WeightEntry[] }) {
  const min = Math.min(...entries.map((e) => e.weightKg));
  const max = Math.max(...entries.map((e) => e.weightKg));
  const range = Math.max(0.5, max - min);
  return (
    <div className="h-32">
      <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="oklch(0.78 0.19 145)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={entries
            .map((e, i) => {
              const x = (i / Math.max(1, entries.length - 1)) * 300;
              const y = 120 - ((e.weightKg - min) / range) * 100 - 10;
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
    </div>
  );
}
