import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { DailyLog, DiaryEntry, LoggedFood, UserProfile, WeightEntry } from "./types";

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export async function saveProfile(uid: string, profile: Partial<UserProfile>) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, profile);
  } else {
    await setDoc(ref, { ...profile, createdAt: Date.now() });
  }
}

export async function getDailyLog(uid: string, date: string): Promise<DailyLog> {
  const { db } = getFirebase();
  if (!db) return { date, foods: [], waterMl: 0 };
  const snap = await getDoc(doc(db, "users", uid, "dailyLogs", date));
  if (snap.exists()) return snap.data() as DailyLog;
  return { date, foods: [], waterMl: 0 };
}

export async function upsertDailyLog(uid: string, log: DailyLog) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  await setDoc(doc(db, "users", uid, "dailyLogs", log.date), log);
}

export async function addFoodToLog(uid: string, date: string, food: LoggedFood) {
  const log = await getDailyLog(uid, date);
  log.foods.push(food);
  await upsertDailyLog(uid, log);
  // recent foods
  const { db } = getFirebase();
  if (db) {
    await setDoc(doc(db, "users", uid, "recentFoods", food.foodId), {
      foodId: food.foodId,
      name: food.name,
      lastUsed: Date.now(),
    });
  }
}

export async function removeFoodFromLog(uid: string, date: string, logId: string) {
  const log = await getDailyLog(uid, date);
  log.foods = log.foods.filter((f) => f.id !== logId);
  await upsertDailyLog(uid, log);
}

export async function setWater(uid: string, date: string, waterMl: number) {
  const log = await getDailyLog(uid, date);
  log.waterMl = Math.max(0, waterMl);
  await upsertDailyLog(uid, log);
}

export async function listWeights(uid: string): Promise<WeightEntry[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(collection(db, "users", uid, "weights"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WeightEntry, "id">) }));
}

export async function addWeight(uid: string, entry: Omit<WeightEntry, "id">) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  await addDoc(collection(db, "users", uid, "weights"), entry);
  await updateDoc(doc(db, "users", uid), { weightKg: entry.weightKg });
}

export async function deleteWeight(uid: string, id: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, "users", uid, "weights", id));
}

export async function toggleFavorite(uid: string, foodId: string, name: string, on: boolean) {
  const { db } = getFirebase();
  if (!db) return;
  const ref = doc(db, "users", uid, "favorites", foodId);
  if (on) await setDoc(ref, { foodId, name, at: Date.now() });
  else await deleteDoc(ref);
}

export async function listFavorites(uid: string): Promise<{ foodId: string; name: string }[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const snap = await getDocs(collection(db, "users", uid, "favorites"));
  return snap.docs.map((d) => d.data() as { foodId: string; name: string });
}

export async function listRecent(uid: string): Promise<{ foodId: string; name: string }[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(
    collection(db, "users", uid, "recentFoods"),
    orderBy("lastUsed", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.slice(0, 20).map((d) => d.data() as { foodId: string; name: string });
}

export async function listRecentLogs(uid: string, days: number): Promise<DailyLog[]> {
  const results: DailyLog[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    results.push(await getDailyLog(uid, todayKey(d)));
  }
  return results.reverse();
}

export async function addDiaryEntry(uid: string, entry: Omit<DiaryEntry, "id">) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  await addDoc(collection(db, "users", uid, "diaries"), entry);
}

export async function listDiary(uid: string): Promise<DiaryEntry[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(collection(db, "users", uid, "diaries"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DiaryEntry, "id">) }));
}

export async function deleteDiary(uid: string, id: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, "users", uid, "diaries", id));
}

export { serverTimestamp };
