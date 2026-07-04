import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { calcBMR, calcTDEE, calcTargets } from "@/lib/calculations";

export const Route = createFileRoute("/_app/meal-plan")({
  head: () => ({ meta: [{ title: "Weekly Meal Plan · Daniyal Fitness" }] }),
  component: MealPlan,
});

type Meal = { name: string; kcal: number };
type Day = { breakfast: Meal[]; lunch: Meal[]; dinner: Meal[]; snacks: Meal[] };

// Pakistani meal pool with approximate calories
const POOL = {
  breakfast: [
    [{ name: "Anda Paratha", kcal: 400 }, { name: "Doodh Patti Chai", kcal: 180 }],
    [{ name: "2 Boiled Eggs", kcal: 156 }, { name: "Brown Bread (2 slices)", kcal: 140 }, { name: "Chai", kcal: 120 }],
    [{ name: "Halwa Puri", kcal: 750 }],
    [{ name: "Aloo Paratha", kcal: 330 }, { name: "Dahi (100g)", kcal: 60 }, { name: "Chai", kcal: 120 }],
    [{ name: "Omelette (2 eggs)", kcal: 220 }, { name: "Roti", kcal: 120 }, { name: "Chai", kcal: 120 }],
    [{ name: "Chana Chaat", kcal: 240 }, { name: "White Bread (2)", kcal: 150 }],
    [{ name: "Oats with Milk", kcal: 250 }, { name: "Banana", kcal: 105 }],
  ],
  lunch: [
    [{ name: "Chicken Karahi (250g)", kcal: 450 }, { name: "2 Rotis", kcal: 240 }, { name: "Salad", kcal: 30 }],
    [{ name: "Daal", kcal: 180 }, { name: "Rice (150g)", kcal: 195 }, { name: "Salad", kcal: 30 }],
    [{ name: "Chicken Biryani", kcal: 490 }, { name: "Raita", kcal: 70 }],
    [{ name: "Aloo Gosht", kcal: 380 }, { name: "2 Rotis", kcal: 240 }],
    [{ name: "Chana Curry", kcal: 230 }, { name: "2 Rotis", kcal: 240 }, { name: "Salad", kcal: 30 }],
    [{ name: "Chicken Pulao", kcal: 420 }, { name: "Raita", kcal: 70 }],
    [{ name: "Grilled Chicken (150g)", kcal: 250 }, { name: "Roti", kcal: 120 }, { name: "Salad", kcal: 30 }],
  ],
  dinner: [
    [{ name: "Chicken Handi", kcal: 420 }, { name: "2 Rotis", kcal: 240 }],
    [{ name: "Seekh Kebab (2)", kcal: 420 }, { name: "Naan", kcal: 260 }, { name: "Salad", kcal: 30 }],
    [{ name: "Palak Paneer", kcal: 280 }, { name: "2 Rotis", kcal: 240 }],
    [{ name: "Chicken Tikka (2)", kcal: 440 }, { name: "Roti", kcal: 120 }, { name: "Salad", kcal: 30 }],
    [{ name: "Nihari (small)", kcal: 380 }, { name: "Naan", kcal: 260 }],
    [{ name: "Fish Curry", kcal: 320 }, { name: "Rice (100g)", kcal: 130 }],
    [{ name: "Vegetable Curry", kcal: 220 }, { name: "2 Rotis", kcal: 240 }, { name: "Dahi", kcal: 60 }],
  ],
  snacks: [
    [{ name: "Apple", kcal: 95 }, { name: "Almonds (15g)", kcal: 90 }],
    [{ name: "Greek Yogurt", kcal: 100 }, { name: "Banana", kcal: 105 }],
    [{ name: "Samosa", kcal: 260 }],
    [{ name: "Fruit Chaat", kcal: 180 }],
    [{ name: "Peanut Butter Toast", kcal: 260 }],
    [{ name: "Lassi (small)", kcal: 150 }],
    [{ name: "Boiled Egg + Fruit", kcal: 170 }],
  ],
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function sumKcal(meals: Meal[]) {
  return meals.reduce((s, m) => s + m.kcal, 0);
}

function scaleDay(day: Day, targetCal: number): { day: Day; total: number; factor: number } {
  const total = sumKcal(day.breakfast) + sumKcal(day.lunch) + sumKcal(day.dinner) + sumKcal(day.snacks);
  const factor = +Math.min(1.4, Math.max(0.6, targetCal / total)).toFixed(2);
  const scale = (m: Meal[]): Meal[] => m.map((x) => ({ ...x, kcal: Math.round(x.kcal * factor) }));
  const scaled: Day = {
    breakfast: scale(day.breakfast),
    lunch: scale(day.lunch),
    dinner: scale(day.dinner),
    snacks: scale(day.snacks),
  };
  return {
    day: scaled,
    total: sumKcal(scaled.breakfast) + sumKcal(scaled.lunch) + sumKcal(scaled.dinner) + sumKcal(scaled.snacks),
    factor,
  };
}

function MealPlan() {
  const { profile } = useAuth();

  const targetCal = useMemo(() => {
    if (!profile) return 2000;
    if (profile.dailyCalorieTarget && profile.dailyCalorieTarget > 0) return profile.dailyCalorieTarget;
    const bmr = calcBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    return calcTargets(tdee, profile.fitnessGoal).calories;
  }, [profile]);

  const week = useMemo(() => {
    return DAYS.map((name, i) => {
      const base: Day = {
        breakfast: POOL.breakfast[i % POOL.breakfast.length],
        lunch: POOL.lunch[i % POOL.lunch.length],
        dinner: POOL.dinner[i % POOL.dinner.length],
        snacks: POOL.snacks[i % POOL.snacks.length],
      };
      const scaled = scaleDay(base, targetCal);
      return { name, ...scaled };
    });
  }, [targetCal]);

  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      <header className="flex items-center gap-2 mb-2">
        <Link to="/dashboard" className="glass rounded-full p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="font-display font-bold text-lg leading-tight">Weekly Meal Plan</div>
          <div className="text-xs text-muted-foreground">Pakistani cuisine · ~{targetCal} kcal/day target</div>
        </div>
      </header>

      {week.map((d) => (
        <GlassCard key={d.name}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">{d.name}</div>
            <div className="text-[11px] text-muted-foreground">~{d.total} kcal</div>
          </div>
          <div className="space-y-2">
            <MealRow label="Breakfast" meals={d.day.breakfast} />
            <MealRow label="Lunch" meals={d.day.lunch} />
            <MealRow label="Dinner" meals={d.day.dinner} />
            <MealRow label="Snacks" meals={d.day.snacks} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function MealRow({ label, meals }: { label: string; meals: Meal[] }) {
  const total = sumKcal(meals);
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-[11px] font-semibold">{total} kcal</div>
      </div>
      <ul className="text-sm space-y-0.5">
        {meals.map((m, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span>{m.name}</span>
            <span className="text-muted-foreground text-xs">{m.kcal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
