import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { saveProfile } from "@/lib/firestore";
import { calcBMR, calcMacros, calcTDEE, calcTargets, calcBMI, bmiLabel } from "@/lib/calculations";
import type { ActivityLevel, FitnessGoal } from "@/lib/calculations";
import { GlassCard } from "@/components/glass-card";
import { ChatSupport } from "@/components/chat-support";
import { LogOut, Save } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · Daniyal Fitness" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [age, setAge] = useState(profile?.age ?? 25);
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? 170);
  const [weightKg, setWeightKg] = useState(profile?.weightKg ?? 70);
  const [goalWeightKg, setGoalWeightKg] = useState(profile?.goalWeightKg ?? 65);
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? "moderate");
  const [goal, setGoal] = useState<FitnessGoal>(profile?.fitnessGoal ?? "loss");
  const [customCal, setCustomCal] = useState<string>(
    profile?.dailyCalorieTarget ? String(profile.dailyCalorieTarget) : "",
  );

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setAge(profile.age);
    setHeightCm(profile.heightCm);
    setWeightKg(profile.weightKg);
    setGoalWeightKg(profile.goalWeightKg);
    setActivity(profile.activityLevel);
    setGoal(profile.fitnessGoal);
    setCustomCal(profile.dailyCalorieTarget ? String(profile.dailyCalorieTarget) : "");
  }, [profile]);

  if (!profile || !user) return null;

  const bmr = calcBMR(weightKg, heightCm, age, profile.gender);
  const tdee = calcTDEE(bmr, activity);
  const t = calcTargets(tdee, goal);
  const customCalNum = parseInt(customCal, 10);
  const effectiveCalories = customCalNum && customCalNum > 0 ? customCalNum : t.calories;
  const m = calcMacros(effectiveCalories, weightKg, goal);
  const bmi = calcBMI(weightKg, heightCm);

  const save = async () => {
    setBusy(true);
    await saveProfile(user.uid, {
      fullName, age, heightCm, weightKg, goalWeightKg,
      activityLevel: activity, fitnessGoal: goal,
      dailyCalorieTarget: customCalNum && customCalNum > 0 ? customCalNum : 0,
    });
    await refreshProfile();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <GlassCard>
        <div className="text-sm font-semibold mb-3">Your targets</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="kcal" value={effectiveCalories} />
          <Stat label="P" value={m.protein} suffix="g" />
          <Stat label="C" value={m.carbs} suffix="g" />
          <Stat label="F" value={m.fat} suffix="g" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="BMR" value={bmr} />
          <Stat label="TDEE" value={tdee} />
          <Stat label={`BMI · ${bmiLabel(bmi)}`} value={bmi} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="glass rounded-xl p-2 text-center">
            <div className="text-muted-foreground">Weekly progress</div>
            <div className="font-semibold">
              {(((effectiveCalories - tdee) * 7) / 7700).toFixed(2)} kg/wk
            </div>
          </div>
          <div className="glass rounded-xl p-2 text-center">
            <div className="text-muted-foreground">Monthly</div>
            <div className="font-semibold">
              {(((effectiveCalories - tdee) * 30) / 7700).toFixed(1)} kg/mo
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold mb-3">Personal info</div>
        <div className="space-y-3">
          <Field label="Full name" value={fullName} onChange={setFullName} />
          <Field label="Age" value={age} onChange={(v) => setAge(+v)} type="number" />
          <Field label="Height (cm)" value={heightCm} onChange={(v) => setHeightCm(+v)} type="number" />
          <Field label="Current weight (kg)" value={weightKg} onChange={(v) => setWeightKg(+v)} type="number" step={0.1} />
          <Field label="Goal weight (kg)" value={goalWeightKg} onChange={(v) => setGoalWeightKg(+v)} type="number" step={0.1} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold">Daily calorie target</div>
          <span className="text-[10px] text-muted-foreground">
            Auto: {t.calories} kcal
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Set a custom daily calorie goal, or leave blank to use the automatic calculation.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={`e.g. ${t.calories}`}
            value={customCal}
            onChange={(e) => setCustomCal(e.target.value)}
            className="flex-1 rounded-2xl bg-input/60 border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setCustomCal("")}
            className="glass rounded-2xl px-4 text-xs font-medium shrink-0"
          >
            Reset
          </button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Currently using: <span className="font-semibold text-foreground">{effectiveCalories} kcal/day</span>
          {customCalNum > 0 ? " (custom)" : " (auto)"}
        </div>
      </GlassCard>



      <GlassCard>
        <div className="text-sm font-semibold mb-3">Activity level</div>
        <div className="grid grid-cols-2 gap-2">
          {(["sedentary", "light", "moderate", "active", "athlete"] as ActivityLevel[]).map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={`rounded-xl py-2 text-xs font-medium border capitalize ${
                activity === a ? "bg-primary text-primary-foreground border-primary" : "border-border bg-input/30"
              }`}
            >{a}</button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold mb-3">Fitness goal</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "loss", l: "Loss" },
            { id: "gain", l: "Gain" },
            { id: "muscle", l: "Muscle" },
            { id: "recomp", l: "Recomp" },
            { id: "maintenance", l: "Maintain" },
          ] as { id: FitnessGoal; l: string }[]).map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`rounded-xl py-2 text-xs font-medium border ${
                goal === g.id ? "bg-primary text-primary-foreground border-primary" : "border-border bg-input/30"
              }`}
            >{g.l}</button>
          ))}
        </div>
      </GlassCard>

      <button
        onClick={save}
        disabled={busy}
        className="w-full rounded-full gradient-hero text-primary-foreground py-3 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save changes"}
      </button>

      <ChatSupport />

      <button
        onClick={logout}
        className="w-full glass rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2 text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="glass rounded-xl p-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="font-bold">{value}{suffix}</div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", step,
}: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl bg-input/60 border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
