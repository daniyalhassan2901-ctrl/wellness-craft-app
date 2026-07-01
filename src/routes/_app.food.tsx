import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FOODS, FOOD_CATEGORIES } from "@/data/foods";
import type { FoodItem, LoggedFood, MealType } from "@/lib/types";
import { addFoodToLog, getDailyLog, listFavorites, listRecent, removeFoodFromLog, toggleFavorite, todayKey } from "@/lib/firestore";
import { GlassCard } from "@/components/glass-card";
import { Coffee, Croissant, Cookie, UtensilsCrossed, Search, Plus, X, Heart, Star, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/food")({
  head: () => ({ meta: [{ title: "Food log · Daniyal Fitness" }] }),
  component: FoodPage,
});

const MEAL_META: Record<MealType, { label: string; icon: typeof Coffee }> = {
  breakfast: { label: "Breakfast", icon: Coffee },
  lunch: { label: "Lunch", icon: UtensilsCrossed },
  dinner: { label: "Dinner", icon: Croissant },
  snacks: { label: "Snacks", icon: Cookie },
};

function FoodPage() {
  const { user } = useAuth();
  const [log, setLog] = useState(() => ({ date: todayKey(), foods: [] as LoggedFood[], waterMl: 0 }));
  const [openMeal, setOpenMeal] = useState<MealType | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    getDailyLog(user.uid, todayKey()).then(setLog);
  }, [user, tick]);

  const byMeal = useMemo(() => {
    const m: Record<MealType, LoggedFood[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    log.foods.forEach((f) => m[f.meal].push(f));
    return m;
  }, [log]);

  const total = log.foods.reduce((s, f) => s + f.calories, 0);

  const remove = async (id: string) => {
    if (!user) return;
    await removeFoodFromLog(user.uid, todayKey(), id);
    setTick((t) => t + 1);
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">Today's food</h1>
        <p className="text-sm text-muted-foreground">{Math.round(total)} kcal logged</p>
      </div>

      {(Object.keys(MEAL_META) as MealType[]).map((meal) => {
        const items = byMeal[meal];
        const cal = items.reduce((s, f) => s + f.calories, 0);
        const Icon = MEAL_META[meal].icon;
        return (
          <GlassCard key={meal}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{MEAL_META[meal].label}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(cal)} kcal</div>
                </div>
              </div>
              <button
                onClick={() => setOpenMeal(meal)}
                className="rounded-full gradient-hero text-primary-foreground p-2 shadow-glow"
                aria-label={`Add ${meal}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {items.length > 0 && (
              <ul className="mt-2 divide-y divide-border/50">
                {items.map((f) => (
                  <li key={f.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.servings}× · P{Math.round(f.protein)} C{Math.round(f.carbs)} F{Math.round(f.fat)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{Math.round(f.calories)}</span>
                      <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        );
      })}

      {openMeal && (
        <FoodPickerModal
          meal={openMeal}
          onClose={() => setOpenMeal(null)}
          onAdded={() => setTick((t) => t + 1)}
        />
      )}
    </div>
  );
}

function FoodPickerModal({
  meal,
  onClose,
  onAdded,
}: {
  meal: MealType;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [tab, setTab] = useState<"all" | "fav" | "recent" | "quick">("all");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<string[]>([]);
  const [quickCal, setQuickCal] = useState("");

  useEffect(() => {
    if (!user) return;
    listFavorites(user.uid).then((f) => setFavs(new Set(f.map((x) => x.foodId))));
    listRecent(user.uid).then((r) => setRecent(r.map((x) => x.foodId)));
  }, [user]);

  const filtered = useMemo(() => {
    let list = FOODS;
    if (tab === "fav") list = list.filter((f) => favs.has(f.id));
    if (tab === "recent") list = list.filter((f) => recent.includes(f.id));
    if (cat !== "all") list = list.filter((f) => f.category === cat);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(s));
    }
    return list.slice(0, 100);
  }, [q, cat, tab, favs, recent]);

  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);

  const add = async () => {
    if (!user || !picked) return;
    const entry: LoggedFood = {
      id: crypto.randomUUID(),
      foodId: picked.id,
      name: picked.name,
      meal,
      servings,
      calories: picked.calories * servings,
      protein: picked.protein * servings,
      carbs: picked.carbs * servings,
      fat: picked.fat * servings,
      loggedAt: Date.now(),
    };
    await addFoodToLog(user.uid, todayKey(), entry);
    onAdded();
    onClose();
  };

  const addQuick = async () => {
    if (!user) return;
    const cal = +quickCal;
    if (!cal || cal <= 0) return;
    const entry: LoggedFood = {
      id: crypto.randomUUID(),
      foodId: "quick",
      name: `Quick add (${cal} kcal)`,
      meal,
      servings: 1,
      calories: cal,
      protein: 0,
      carbs: 0,
      fat: 0,
      loggedAt: Date.now(),
    };
    await addFoodToLog(user.uid, todayKey(), entry);
    onAdded();
    onClose();
  };

  const toggleFav = async (id: string, name: string) => {
    if (!user) return;
    const on = !favs.has(id);
    const next = new Set(favs);
    if (on) next.add(id);
    else next.delete(id);
    setFavs(next);
    await toggleFavorite(user.uid, id, name, on);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md h-[92vh] sm:h-[85vh] sm:rounded-3xl bg-card border border-border shadow-card flex flex-col overflow-hidden rounded-t-3xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground uppercase">{MEAL_META[meal].label}</div>
            <div className="font-semibold">{picked ? picked.name : "Add food"}</div>
          </div>
          <button onClick={onClose} className="glass rounded-full p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        {picked ? (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-muted-foreground">Per serving ({picked.servingSize} {picked.servingUnit})</div>
              <div className="mt-1 grid grid-cols-4 gap-2 text-center">
                <div><div className="text-lg font-bold">{picked.calories}</div><div className="text-[10px] text-muted-foreground">kcal</div></div>
                <div><div className="text-lg font-bold">{picked.protein}</div><div className="text-[10px] text-muted-foreground">P</div></div>
                <div><div className="text-lg font-bold">{picked.carbs}</div><div className="text-[10px] text-muted-foreground">C</div></div>
                <div><div className="text-lg font-bold">{picked.fat}</div><div className="text-[10px] text-muted-foreground">F</div></div>
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Servings</span>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={servings}
                onChange={(e) => setServings(+e.target.value || 1)}
                className="mt-1 w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{Math.round(picked.calories * servings)} kcal</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPicked(null)} className="flex-1 glass rounded-full py-3 text-sm font-medium">Back</button>
              <button onClick={add} className="flex-1 rounded-full gradient-hero text-primary-foreground py-3 text-sm font-semibold shadow-glow">
                Add to log
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3 border-b border-border">
              <div className="flex gap-1">
                {(["all", "fav", "recent", "quick"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "flex-1 rounded-full py-1.5 text-xs font-medium capitalize transition",
                      tab === t ? "bg-primary text-primary-foreground" : "glass",
                    )}
                  >
                    {t === "fav" ? "Favorites" : t === "quick" ? "Quick add" : t}
                  </button>
                ))}
              </div>
              {tab !== "quick" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search 150+ foods..."
                      className="w-full rounded-full bg-input/60 border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    <CatChip active={cat === "all"} onClick={() => setCat("all")} label="All" />
                    {FOOD_CATEGORIES.map((c) => (
                      <CatChip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {tab === "quick" ? (
              <div className="p-5 space-y-4">
                <div className="text-sm text-muted-foreground">Log calories without a specific food.</div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Calories</span>
                  <div className="relative mt-1">
                    <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warning" />
                    <input
                      type="number"
                      value={quickCal}
                      onChange={(e) => setQuickCal(e.target.value)}
                      placeholder="e.g. 350"
                      className="w-full rounded-2xl bg-input/60 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </label>
                <button onClick={addQuick} className="w-full rounded-full gradient-hero text-primary-foreground py-3 text-sm font-semibold shadow-glow">
                  Add
                </button>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-border/50">
                {filtered.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">No matches</li>
                )}
                {filtered.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 p-3 hover:bg-muted/40">
                    <button onClick={() => setPicked(f)} className="flex-1 text-left">
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.calories} kcal · {f.servingSize} {f.servingUnit} · {f.category}
                      </div>
                    </button>
                    <button
                      onClick={() => toggleFav(f.id, f.name)}
                      className={cn("p-2 rounded-full transition", favs.has(f.id) ? "text-primary" : "text-muted-foreground")}
                      aria-label="Toggle favorite"
                    >
                      {favs.has(f.id) ? <Star className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
        active ? "bg-primary text-primary-foreground" : "glass",
      )}
    >
      {label}
    </button>
  );
}
