import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { deleteCustomFood, listCustomFoods, upsertCustomFood } from "@/lib/admin";
import { FOODS } from "@/data/foods";
import type { FoodItem } from "@/lib/types";
import { Plus, Trash2, Save, Search } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/foods")({
  head: () => ({ meta: [{ title: "Foods · Admin" }] }),
  component: FoodsAdmin,
});

const EMPTY: FoodItem = {
  id: "", name: "", category: "Custom", calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: 1, servingUnit: "serving",
};

function FoodsAdmin() {
  const [custom, setCustom] = useState<FoodItem[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => listCustomFoods().then(setCustom);
  useEffect(() => { load(); }, []);

  const customIds = new Set(custom.map((c) => c.id));
  const merged: (FoodItem & { source: "bundled" | "custom" })[] = [
    ...custom.map((f) => ({ ...f, source: "custom" as const })),
    ...FOODS.filter((f) => !customIds.has(f.id)).map((f) => ({ ...f, source: "bundled" as const })),
  ];
  const filtered = q
    ? merged.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) || f.category.toLowerCase().includes(q.toLowerCase()))
    : merged;

  const save = async () => {
    if (!editing) return;
    const f = { ...editing };
    if (!f.name.trim()) { alert("Name required"); return; }
    if (!f.id) f.id = "cf-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    setBusy(true);
    try {
      await upsertCustomFood(f);
      await load();
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this custom food?\nThis action cannot be undone.")) return;
    await deleteCustomFood(id);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display font-bold text-2xl">Foods</h1>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-full gradient-hero text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-glow flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add food
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search foods"
          className="w-full rounded-full bg-input/60 border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <GlassCard>
        <div className="text-xs text-muted-foreground mb-2">
          Custom foods are saved to Firestore and appear live in the user app. Bundled foods can be overridden by saving a custom food with the same name (edit will create a custom copy).
        </div>
        <ul className="divide-y divide-border/50 max-h-[60vh] overflow-y-auto">
          {filtered.slice(0, 200).map((f) => (
            <li key={f.source + f.id} className="py-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {f.name}
                  {f.source === "custom" && <span className="ml-2 text-[10px] rounded-full bg-primary/20 text-primary px-1.5 py-0.5">custom</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {f.category} · {f.calories} kcal · {f.servingSize} {f.servingUnit} · P{f.protein} C{f.carbs} F{f.fat}
                </div>
              </div>
              <button
                onClick={() => setEditing({ ...f, id: f.source === "custom" ? f.id : "" })}
                className="text-xs px-2 py-1 rounded-full glass"
              >
                Edit
              </button>
              {f.source === "custom" && (
                <button onClick={() => remove(f.id)} className="text-destructive p-1.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {filtered.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No matches</li>}
        </ul>
      </GlassCard>

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-5 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{editing.id ? "Edit food" : "New food"}</h2>
              <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground">Cancel</button>
            </div>
            <div className="space-y-2">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
              <div className="grid grid-cols-2 gap-2">
                <NumField label="Calories" value={editing.calories} onChange={(v) => setEditing({ ...editing, calories: v })} />
                <NumField label="Serving size" value={editing.servingSize} onChange={(v) => setEditing({ ...editing, servingSize: v })} />
              </div>
              <Field label="Serving unit" value={editing.servingUnit} onChange={(v) => setEditing({ ...editing, servingUnit: v })} />
              <div className="grid grid-cols-3 gap-2">
                <NumField label="Protein" value={editing.protein} onChange={(v) => setEditing({ ...editing, protein: v })} />
                <NumField label="Carbs" value={editing.carbs} onChange={(v) => setEditing({ ...editing, carbs: v })} />
                <NumField label="Fat" value={editing.fat} onChange={(v) => setEditing({ ...editing, fat: v })} />
              </div>
            </div>
            <button
              onClick={save}
              disabled={busy}
              className="mt-4 w-full rounded-full gradient-hero text-primary-foreground py-3 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl bg-input/60 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value || 0)}
        className="mt-1 w-full rounded-xl bg-input/60 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
