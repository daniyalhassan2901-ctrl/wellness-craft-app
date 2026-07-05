import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { FOODS } from "@/data/foods";
import type { FoodItem } from "@/lib/types";

let cached: FoodItem[] = [];
const listeners = new Set<(v: FoodItem[]) => void>();
let started = false;

function start() {
  if (started) return;
  started = true;
  const { db } = getFirebase();
  if (!db) return;
  onSnapshot(collection(db, "foods"), (snap) => {
    cached = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FoodItem, "id">) }));
    listeners.forEach((l) => l(cached));
  });
}

export function useCustomFoods(): FoodItem[] {
  const [items, setItems] = useState<FoodItem[]>(cached);
  useEffect(() => {
    start();
    listeners.add(setItems);
    setItems(cached);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  return items;
}

export function useAllFoods(): { foods: FoodItem[]; categories: string[] } {
  const custom = useCustomFoods();
  // Custom overrides bundled by id
  const map = new Map<string, FoodItem>();
  FOODS.forEach((f) => map.set(f.id, f));
  custom.forEach((f) => map.set(f.id, f));
  const foods = Array.from(map.values());
  const categories = Array.from(new Set(foods.map((f) => f.category)));
  return { foods, categories };
}
