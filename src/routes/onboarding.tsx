import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { saveProfile, addWeight, todayKey } from "@/lib/firestore";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculations";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Get started · Daniyal Fitness" }],
  }),
  component: Onboarding,
});

const activities: { id: ActivityLevel; label: string; desc: string }[] = [
  { id: "sedentary", label: "Sedentary", desc: "Desk job, little exercise" },
  { id: "light", label: "Light", desc: "1–3 workouts / week" },
  { id: "moderate", label: "Moderate", desc: "3–5 workouts / week" },
  { id: "active", label: "Active", desc: "6–7 workouts / week" },
  { id: "athlete", label: "Athlete", desc: "Twice-daily training" },
];

const goals: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: "loss", label: "Weight loss", desc: "Lose fat sustainably" },
  { id: "gain", label: "Weight gain", desc: "Add healthy weight" },
  { id: "muscle", label: "Muscle gain", desc: "Build lean mass" },
  { id: "recomp", label: "Body recomp", desc: "Lose fat, build muscle" },
  { id: "maintenance", label: "Maintenance", desc: "Stay where you are" },
];

function Onboarding() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [goalWeightKg, setGoalWeightKg] = useState<number>(65);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("loss");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (profile) navigate({ to: "/dashboard", replace: true });
    else if (user.displayName) setFullName(user.displayName);
  }, [user, profile, loading, navigate]);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      await saveProfile(user.uid, {
        uid: user.uid,
        email: user.email ?? "",
        fullName,
        age,
        gender,
        heightCm,
        weightKg,
        goalWeightKg,
        activityLevel,
        fitnessGoal,
        photoURL: user.photoURL ?? "",
        streak: 0,
      });
      await addWeight(user.uid, {
        date: todayKey(),
        weightKg,
        createdAt: Date.now(),
      });
      navigate({ to: "/dashboard", replace: true });
      // hard reload for AuthProvider to refetch profile
      setTimeout(() => window.location.reload(), 200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-card">
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Tell us about you</h1>
              <p className="text-sm text-muted-foreground">We use this to calculate your daily calories & macros.</p>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Age</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(+e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Gender</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(["male", "female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-2xl py-3 text-sm font-medium border transition capitalize ${
                        gender === g
                          ? "bg-primary text-primary-foreground border-primary shadow-glow"
                          : "border-border bg-input/40"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Your body</h1>
              <p className="text-sm text-muted-foreground">Where you are now, and where you want to be.</p>
              <NumField label="Height (cm)" value={heightCm} onChange={setHeightCm} min={100} max={250} />
              <NumField label="Current weight (kg)" value={weightKg} onChange={setWeightKg} min={30} max={300} step={0.1} />
              <NumField label="Goal weight (kg)" value={goalWeightKg} onChange={setGoalWeightKg} min={30} max={300} step={0.1} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Activity level</h1>
              <p className="text-sm text-muted-foreground mb-2">How active are you day to day?</p>
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivityLevel(a.id)}
                  className={`w-full text-left rounded-2xl p-4 border transition ${
                    activityLevel === a.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border bg-input/30"
                  }`}
                >
                  <div className="font-semibold text-sm">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Your goal</h1>
              <p className="text-sm text-muted-foreground mb-2">What are you working towards?</p>
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setFitnessGoal(g.id)}
                  className={`w-full text-left rounded-2xl p-4 border transition ${
                    fitnessGoal === g.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border bg-input/30"
                  }`}
                >
                  <div className="font-semibold text-sm">{g.label}</div>
                  <div className="text-xs text-muted-foreground">{g.desc}</div>
                </button>
              ))}
              {error && <div className="text-xs text-destructive">{error}</div>}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className="glass rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < 3 ? (
              <button
                onClick={next}
                disabled={step === 0 && !fullName}
                className="rounded-full gradient-hero text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-50 flex items-center gap-1"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={busy}
                className="rounded-full gradient-hero text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-50 flex items-center gap-1"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-1 w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
