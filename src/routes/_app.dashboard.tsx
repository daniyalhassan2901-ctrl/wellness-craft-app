import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDailyLog, listRecentLogs, setWater, todayKey } from "@/lib/firestore";
import type { DailyLog } from "@/lib/types";
import { calcBMI, calcBMR, calcMacros, calcTDEE, calcTargets, bmiLabel } from "@/lib/calculations";
import { GlassCard } from "@/components/glass-card";
import { ProgressRing } from "@/components/progress-ring";
import { ThemeToggle } from "@/components/theme-toggle";
import { Droplet, Flame, Plus, Sparkles, TrendingDown, User } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Daniyal Fitness" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const [today, setToday] = useState<DailyLog | null>(null);
  const [week, setWeek] = useState<DailyLog[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    getDailyLog(user.uid, todayKey()).then(setToday);
    listRecentLogs(user.uid, 7).then(setWeek);
  }, [user, tick]);

  const stats = useMemo(() => {
    if (!profile) return null;
    const bmr = calcBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    const targets = calcTargets(tdee, profile.fitnessGoal);
    const macros = calcMacros(targets.calories, profile.weightKg, profile.fitnessGoal);
    const bmi = calcBMI(profile.weightKg, profile.heightCm);
    return { bmr, tdee, targets, macros, bmi };
  }, [profile]);

  const consumed = useMemo(() => {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (today) today.foods.forEach((f) => {
      t.calories += f.calories;
      t.protein += f.protein;
      t.carbs += f.carbs;
      t.fat += f.fat;
    });
    return t;
  }, [today]);

  if (!profile || !stats) return null;

  const remaining = Math.max(0, stats.targets.calories - consumed.calories);
  const water = today?.waterMl ?? 0;
  const goalDiff = profile.weightKg - profile.goalWeightKg;

  const addWater = async (delta: number) => {
    if (!user) return;
    await setWater(user.uid, todayKey(), Math.max(0, water + delta));
    setTick((t) => t + 1);
  };

  const recs = generateRecommendations(consumed, stats.targets.calories, stats.macros, water);

  return (
    <div className="px-4 pt-6 space-y-4">
      <header className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-muted-foreground">Hello,</div>
          <div className="font-display font-bold text-xl">{profile.fullName.split(" ")[0]}</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/profile" className="glass rounded-full p-2.5">
            <User className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Main ring */}
      <GlassCard className="text-center">
        <div className="flex items-center justify-center">
          <ProgressRing
            value={consumed.calories}
            max={stats.targets.calories}
            size={200}
            stroke={14}
            label={`${Math.round(remaining)}`}
            sublabel="kcal left"
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <MiniStat label="Consumed" value={`${Math.round(consumed.calories)}`} sub="kcal" />
          <MiniStat label="Target" value={`${stats.targets.calories}`} sub="kcal" />
          <MiniStat label="BMR" value={`${stats.bmr}`} sub="kcal" />
        </div>
        <Link
          to="/food"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-hero text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" /> Log food
        </Link>
      </GlassCard>

      {/* Macros */}
      <GlassCard>
        <div className="text-sm font-semibold mb-3">Macros</div>
        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="Protein" value={consumed.protein} max={stats.macros.protein} color="oklch(0.72 0.19 145)" />
          <MacroBar label="Carbs" value={consumed.carbs} max={stats.macros.carbs} color="oklch(0.78 0.17 75)" />
          <MacroBar label="Fat" value={consumed.fat} max={stats.macros.fat} color="oklch(0.7 0.15 300)" />
        </div>
      </GlassCard>

      {/* Water + Weight */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="h-4 w-4 text-info" />
            <div className="text-sm font-semibold">Water</div>
          </div>
          <div className="text-2xl font-bold">{water}<span className="text-xs text-muted-foreground">/{stats.macros.water}ml</span></div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-info transition-all"
              style={{ width: `${Math.min(100, (water / stats.macros.water) * 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[250, 500, 1000, 2000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => addWater(n)}
                aria-label={`Add ${n}ml water`}
                className="glass rounded-xl py-2.5 px-1 text-xs font-semibold leading-none min-h-[44px] flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
              >
                {n >= 1000 ? `${n / 1000}L` : `${n}ml`}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            <input
              type="number"
              min={1}
              placeholder="Custom ml"
              className="flex-1 rounded-full bg-input/60 border border-border px-3 py-1.5 text-xs outline-none focus:border-primary min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (v > 0) { addWater(v); (e.target as HTMLInputElement).value = ""; }
                }
              }}
            />
            <button onClick={() => addWater(-250)} className="glass rounded-full px-3 py-1.5 text-xs shrink-0">-250</button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Weight</div>
          </div>
          <div className="text-2xl font-bold">{profile.weightKg}<span className="text-xs text-muted-foreground">kg</span></div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Goal: {profile.goalWeightKg}kg ({goalDiff > 0 ? "-" : "+"}{Math.abs(goalDiff).toFixed(1)}kg)
          </div>
          <Link to="/weight" className="mt-3 block text-center glass rounded-full py-1.5 text-xs font-medium">
            Log weight
          </Link>
        </GlassCard>
      </div>

      {/* BMI + TDEE */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard padded={false} className="p-3 text-center">
          <div className="text-xs text-muted-foreground">BMI</div>
          <div className="text-lg font-bold">{stats.bmi}</div>
          <div className="text-[10px] text-primary">{bmiLabel(stats.bmi)}</div>
        </GlassCard>
        <GlassCard padded={false} className="p-3 text-center">
          <div className="text-xs text-muted-foreground">TDEE</div>
          <div className="text-lg font-bold">{stats.tdee}</div>
          <div className="text-[10px] text-muted-foreground">kcal/day</div>
        </GlassCard>
        <GlassCard padded={false} className="p-3 text-center">
          <div className="text-xs text-muted-foreground">Streak</div>
          <div className="text-lg font-bold flex items-center justify-center gap-1"><Flame className="h-4 w-4 text-warning" />{calcStreak(week)}</div>
          <div className="text-[10px] text-muted-foreground">days</div>
        </GlassCard>
      </div>

      {/* Weekly bars */}
      <GlassCard>
        <div className="text-sm font-semibold mb-3">This week</div>
        <div className="flex items-end justify-between gap-1.5 h-24">
          {week.map((d) => {
            const cal = d.foods.reduce((s, f) => s + f.calories, 0);
            const pct = Math.min(100, (cal / stats.targets.calories) * 100);
            const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "narrow" });
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md gradient-hero transition-all"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recommendations */}
      {recs.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Insights</div>
          </div>
          <ul className="space-y-2">
            {recs.map((r, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary">•</span>
                {r}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold">{value}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{sub}</span></div>
    </div>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-bold">{Math.round(value)}<span className="text-[10px] text-muted-foreground">/{max}g</span></div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function calcStreak(logs: DailyLog[]): number {
  let s = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].foods.length > 0) s++;
    else break;
  }
  return s;
}

function generateRecommendations(
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  targetCal: number,
  macros: { protein: number; carbs: number; fat: number; water: number },
  water: number,
): string[] {
  const out: string[] = [];
  const capPct = consumed.calories / targetCal;
  if (capPct >= 1.1) out.push("You've exceeded your calorie target. Consider a lighter dinner or a short walk.");
  else if (capPct >= 0.9 && capPct <= 1.05) out.push("Great pacing today — you're right on target.");
  if (consumed.protein < macros.protein * 0.6) out.push("Protein is low — add eggs, chicken, or a whey shake.");
  if (water < macros.water * 0.5) out.push("Drink more water — you're behind on hydration.");
  if (consumed.fat > macros.fat * 1.3) out.push("Fat intake is high today. Balance with leaner choices tomorrow.");
  return out.slice(0, 3);
}
