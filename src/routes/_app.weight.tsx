import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addWeight, deleteWeight, listWeights, todayKey } from "@/lib/firestore";
import { saveProfile } from "@/lib/firestore";
import type { WeightEntry } from "@/lib/types";
import { GlassCard } from "@/components/glass-card";
import { Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/weight")({
  head: () => ({ meta: [{ title: "Weight · Daniyal Fitness" }] }),
  component: WeightPage,
});

function WeightPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [w, setW] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalW, setGoalW] = useState(profile?.goalWeightKg ?? 0);

  useEffect(() => {
    if (!user) return;
    listWeights(user.uid).then(setEntries);
  }, [user, tick]);

  useEffect(() => {
    if (profile) setGoalW(profile.goalWeightKg);
  }, [profile]);

  const add = async () => {
    if (!user || !w) return;
    await addWeight(user.uid, { date: todayKey(), weightKg: +w, createdAt: Date.now() });
    setW("");
    await refreshProfile();
    setTick((t) => t + 1);
  };

  const del = async (id: string) => {
    if (!user) return;
    await deleteWeight(user.uid, id);
    setTick((t) => t + 1);
  };

  const saveGoal = async () => {
    if (!user) return;
    await saveProfile(user.uid, { goalWeightKg: goalW });
    await refreshProfile();
    setGoalEditing(false);
  };

  if (!profile) return null;
  const latest = entries[entries.length - 1]?.weightKg ?? profile.weightKg;
  const first = entries[0]?.weightKg ?? latest;
  const change = +(latest - first).toFixed(1);
  const toGoal = +(latest - profile.goalWeightKg).toFixed(1);

  // Chart
  const maxW = Math.max(...entries.map((e) => e.weightKg), profile.goalWeightKg, latest);
  const minW = Math.min(...entries.map((e) => e.weightKg), profile.goalWeightKg, latest);
  const range = Math.max(1, maxW - minW);

  return (
    <div className="px-4 pt-6 space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">Weight</h1>
        <p className="text-sm text-muted-foreground">Log daily, watch trends over weeks.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GlassCard padded={false} className="p-3">
          <div className="text-xs text-muted-foreground">Current</div>
          <div className="text-xl font-bold">{latest}<span className="text-xs">kg</span></div>
        </GlassCard>
        <GlassCard padded={false} className="p-3">
          <div className="text-xs text-muted-foreground">Change</div>
          <div className={`text-xl font-bold flex items-center gap-1 ${change < 0 ? "text-success" : change > 0 ? "text-warning" : ""}`}>
            {change < 0 ? <TrendingDown className="h-4 w-4" /> : change > 0 ? <TrendingUp className="h-4 w-4" /> : null}
            {Math.abs(change)}
          </div>
        </GlassCard>
        <GlassCard padded={false} className="p-3">
          <div className="text-xs text-muted-foreground">To goal</div>
          <div className="text-xl font-bold">{Math.abs(toGoal)}<span className="text-xs">kg</span></div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="text-sm font-semibold mb-2">Log today</div>
        <div className="flex gap-2">
          <input
            type="number"
            step={0.1}
            value={w}
            onChange={(e) => setW(e.target.value)}
            placeholder="Weight in kg"
            className="flex-1 rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button onClick={add} className="rounded-2xl gradient-hero text-primary-foreground px-4 shadow-glow">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Progress</div>
          {!goalEditing ? (
            <button onClick={() => setGoalEditing(true)} className="text-xs text-primary">
              Goal: {profile.goalWeightKg}kg
            </button>
          ) : (
            <div className="flex gap-1">
              <input
                type="number"
                step={0.1}
                value={goalW}
                onChange={(e) => setGoalW(+e.target.value)}
                className="w-16 rounded-md bg-input/60 border border-border px-2 py-1 text-xs"
              />
              <button onClick={saveGoal} className="text-xs text-primary font-medium">Save</button>
            </div>
          )}
        </div>
        {entries.length > 1 ? (
          <div className="h-40 relative">
            <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="oklch(0.78 0.19 145)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={entries
                  .map((e, i) => {
                    const x = (i / (entries.length - 1)) * 300;
                    const y = 120 - ((e.weightKg - minW) / range) * 100 - 10;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {/* Goal line */}
              <line
                x1="0"
                x2="300"
                y1={120 - ((profile.goalWeightKg - minW) / range) * 100 - 10}
                y2={120 - ((profile.goalWeightKg - minW) / range) * 100 - 10}
                stroke="oklch(0.78 0.17 75)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            </svg>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">Log at least 2 weights to see a chart.</div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold mb-2">History</div>
        <ul className="divide-y divide-border/50">
          {entries.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No entries yet.</li>}
          {[...entries].reverse().map((e) => (
            <li key={e.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{e.weightKg} kg</div>
                <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
              </div>
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
