import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Dumbbell, Flame, LineChart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daniyal Fitness — Track calories, macros & progress" },
      {
        name: "description",
        content:
          "Premium calorie & macro tracker with a huge Pakistani, Indian, Western and fast-food database. Track weight, water and progress beautifully.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user && profile) navigate({ to: "/dashboard", replace: true });
    else if (user && !profile) navigate({ to: "/onboarding", replace: true });
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Daniyal Fitness</span>
        </div>
        <Link
          to="/auth"
          className="glass rounded-full px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <div className="glass rounded-full px-3 py-1 text-xs mb-6 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Built for real results
        </div>

        <h1 className="text-5xl font-bold tracking-tight leading-[1.05]">
          Your body,{" "}
          <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
            in numbers.
          </span>
        </h1>
        <p className="mt-4 text-muted-foreground text-base">
          Track calories, macros, water and weight with a food database built for
          Pakistani, Indian & Western meals.
        </p>

        <Link
          to="/auth"
          className="mt-8 rounded-full gradient-hero text-primary-foreground px-8 py-3.5 font-semibold shadow-glow hover:scale-105 transition"
        >
          Start free
        </Link>

        <div className="mt-10 grid grid-cols-3 gap-3 w-full">
          {[
            { icon: Flame, label: "Calories" },
            { icon: LineChart, label: "Progress" },
            { icon: Dumbbell, label: "Macros" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground">
        Daniyal Fitness · Mobile-first PWA
      </footer>
    </div>
  );
}
