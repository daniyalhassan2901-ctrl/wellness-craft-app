import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { deleteUserAccount, getUserProfileById, resetUserData, updateUserFlags } from "@/lib/admin";
import { getDailyLog, listDiary, listRecentLogs, listWeights, todayKey } from "@/lib/firestore";
import { calcBMR, calcTDEE, calcTargets, calcMacros, calcBMI } from "@/lib/calculations";
import type { UserProfile, DailyLog, WeightEntry, DiaryEntry } from "@/lib/types";
import { Loader2, Ban, ShieldCheck, ShieldOff, Trash2, RotateCcw, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/users/$uid")({
  head: () => ({ meta: [{ title: "User · Admin" }] }),
  component: UserDetail,
});

function UserDetail() {
  const { uid } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [today, setToday] = useState<DailyLog | null>(null);
  const [recent, setRecent] = useState<DailyLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const p = await getUserProfileById(uid);
    setProfile(p);
    if (p) {
      const [t, r, w, d] = await Promise.all([
        getDailyLog(uid, todayKey()),
        listRecentLogs(uid, 7),
        listWeights(uid),
        listDiary(uid),
      ]);
      setToday(t);
      setRecent(r);
      setWeights(w);
      setDiaries(d);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const confirmAndRun = async (label: string, action: () => Promise<void>) => {
    if (!window.confirm(`Are you sure?\n${label}\nThis action cannot be undone.`)) return;
    setBusy(label);
    try {
      await action();
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const anyProfile = profile as UserProfile & { banned?: boolean; disabled?: boolean };
  const bmr = calcBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calcTDEE(bmr, profile.activityLevel);
  const targets = calcTargets(tdee, profile.fitnessGoal);
  const cals = profile.dailyCalorieTarget && profile.dailyCalorieTarget > 0 ? profile.dailyCalorieTarget : targets.calories;
  const macros = calcMacros(cals, profile.weightKg, profile.fitnessGoal);
  const bmi = calcBMI(profile.weightKg, profile.heightCm);
  const lastActive = recent
    .filter((l) => (l.foods?.length ?? 0) > 0 || (l.waterMl ?? 0) > 0)
    .slice(-1)[0]?.date;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate({ to: "/admin/users" })}
        className="text-xs text-muted-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      <GlassCard>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl truncate">{profile.fullName || "(no name)"}</h1>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            <p className="text-[10px] text-muted-foreground mt-1">UID: {profile.uid}</p>
          </div>
          <div className="flex flex-col gap-1 text-[10px]">
            {anyProfile.banned && <span className="rounded-full bg-destructive/20 text-destructive px-2 py-0.5">Banned</span>}
            {anyProfile.disabled && <span className="rounded-full bg-warning/20 text-warning px-2 py-0.5">Disabled</span>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Age" value={profile.age} />
          <Stat label="Height" value={`${profile.heightCm}cm`} />
          <Stat label="Weight" value={`${profile.weightKg}kg`} />
          <Stat label="Goal wt" value={`${profile.goalWeightKg}kg`} />
          <Stat label="Activity" value={profile.activityLevel} />
          <Stat label="Goal" value={profile.fitnessGoal} />
          <Stat label="BMI" value={bmi.toFixed(1)} />
          <Stat label="Cals" value={cals} />
          <Stat label="Water today" value={`${today?.waterMl ?? 0}ml`} />
          <Stat label="P" value={`${macros.protein}g`} />
          <Stat label="C" value={`${macros.carbs}g`} />
          <Stat label="F" value={`${macros.fat}g`} />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Last active: {lastActive || "—"}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Controls</h2>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            disabled={!!busy}
            active={anyProfile.banned}
            onClick={() =>
              confirmAndRun(anyProfile.banned ? "Unban user" : "Ban user", () =>
                updateUserFlags(uid, { banned: !anyProfile.banned } as Partial<UserProfile>),
              )
            }
            icon={Ban}
            label={anyProfile.banned ? "Unban" : "Ban"}
            tone="destructive"
          />
          <ActionBtn
            disabled={!!busy}
            active={anyProfile.disabled}
            onClick={() =>
              confirmAndRun(anyProfile.disabled ? "Enable account" : "Disable account", () =>
                updateUserFlags(uid, { disabled: !anyProfile.disabled } as Partial<UserProfile>),
              )
            }
            icon={anyProfile.disabled ? ShieldCheck : ShieldOff}
            label={anyProfile.disabled ? "Enable" : "Disable"}
            tone="warning"
          />
          <ActionBtn
            disabled={!!busy}
            onClick={() => confirmAndRun("Reset all user data (logs/weights/diaries)", () => resetUserData(uid))}
            icon={RotateCcw}
            label="Reset data"
            tone="warning"
          />
          <ActionBtn
            disabled={!!busy}
            onClick={() =>
              confirmAndRun("Delete account & all data", async () => {
                await deleteUserAccount(uid);
                navigate({ to: "/admin/users" });
              })
            }
            icon={Trash2}
            label="Delete"
            tone="destructive"
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Weight history ({weights.length})</h2>
        <ul className="text-xs divide-y divide-border/50 max-h-48 overflow-y-auto">
          {weights.slice(-10).reverse().map((w) => (
            <li key={w.id} className="py-1.5 flex justify-between">
              <span>{w.date}</span>
              <span>{w.weightKg} kg</span>
            </li>
          ))}
          {weights.length === 0 && <li className="py-2 text-muted-foreground">No entries</li>}
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Food history (last 7 days)</h2>
        <ul className="text-xs divide-y divide-border/50 max-h-56 overflow-y-auto">
          {recent.map((l) => {
            const cal = (l.foods ?? []).reduce((s, f) => s + f.calories, 0);
            return (
              <li key={l.date} className="py-1.5 flex justify-between">
                <span>{l.date}</span>
                <span>{l.foods?.length ?? 0} items · {Math.round(cal)} kcal · {l.waterMl ?? 0}ml</span>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold text-sm mb-2">Diary entries ({diaries.length})</h2>
        <ul className="text-xs divide-y divide-border/50 max-h-56 overflow-y-auto">
          {diaries.slice(0, 10).map((d) => (
            <li key={d.id} className="py-1.5">
              <div className="font-medium">{d.title || "(untitled)"} <span className="text-muted-foreground">· {d.date}</span></div>
              <div className="text-muted-foreground line-clamp-2">{d.content}</div>
            </li>
          ))}
          {diaries.length === 0 && <li className="py-2 text-muted-foreground">No entries</li>}
        </ul>
      </GlassCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 py-2">
      <div className="text-[9px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ActionBtn({
  onClick, icon: Icon, label, tone, disabled, active,
}: {
  onClick: () => void;
  icon: typeof Ban;
  label: string;
  tone: "destructive" | "warning" | "primary";
  disabled?: boolean;
  active?: boolean;
}) {
  const toneCls =
    tone === "destructive" ? "text-destructive border-destructive/40"
      : tone === "warning" ? "text-warning border-warning/40"
        : "text-primary border-primary/40";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border ${toneCls} bg-background/40 py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 ${active ? "ring-1 ring-current" : ""}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
