import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { FoodItem, UserProfile } from "./types";

export const ADMIN_EMAIL = "daniyalhassan2901@gmail.com";

export interface AdminRecord {
  role: "superadmin" | "admin";
  active: boolean;
  email?: string;
}

export async function checkIsAdmin(uid: string): Promise<AdminRecord | null> {
  const { db } = getFirebase();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (!snap.exists()) return null;
    const data = snap.data() as AdminRecord;
    if (!data.active) return null;
    if (data.role !== "superadmin" && data.role !== "admin") return null;
    return data;
  } catch {
    return null;
  }
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }));
}

export async function getUserProfileById(uid: string): Promise<UserProfile | null> {
  const { db } = getFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

export async function updateUserFlags(uid: string, flags: Partial<UserProfile> & { banned?: boolean; disabled?: boolean }) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  await updateDoc(doc(db, "users", uid), flags as Record<string, unknown>);
}

async function deleteSubcollection(uid: string, name: string) {
  const { db } = getFirebase();
  if (!db) return;
  const snap = await getDocs(collection(db, "users", uid, name));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function resetUserData(uid: string) {
  await Promise.all([
    deleteSubcollection(uid, "dailyLogs"),
    deleteSubcollection(uid, "weights"),
    deleteSubcollection(uid, "diaries"),
    deleteSubcollection(uid, "favorites"),
    deleteSubcollection(uid, "recentFoods"),
  ]);
}

export async function deleteUserAccount(uid: string) {
  await resetUserData(uid);
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, "users", uid));
}

// ---- Custom foods (Firestore-managed) ----
export async function listCustomFoods(): Promise<FoodItem[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const snap = await getDocs(collection(db, "foods"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FoodItem, "id">) }));
}

export async function upsertCustomFood(food: FoodItem) {
  const { db } = getFirebase();
  if (!db) throw new Error("DB not ready");
  await setDoc(doc(db, "foods", food.id), food);
}

export async function deleteCustomFood(id: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, "foods", id));
}

// ---- Stats ----
export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newToday: number;
  totalMeals: number;
  totalCalories: number;
  totalWaterMl: number;
  totalDiaries: number;
}

export async function getAdminStats(users: UserProfile[]): Promise<AdminStats> {
  const { db } = getFirebase();
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  let totalMeals = 0;
  let totalCalories = 0;
  let totalWaterMl = 0;
  let totalDiaries = 0;
  let activeToday = 0;
  let newToday = 0;

  if (!db) {
    return {
      totalUsers: users.length,
      activeToday: 0,
      newToday: 0,
      totalMeals: 0,
      totalCalories: 0,
      totalWaterMl: 0,
      totalDiaries: 0,
    };
  }

  // Limit deep scans to first 50 users to keep costs bounded.
  const scanUsers = users.slice(0, 50);
  await Promise.all(
    scanUsers.map(async (u) => {
      if (u.createdAt && u.createdAt >= startTs) newToday++;
      try {
        const todaySnap = await getDoc(doc(db, "users", u.uid, "dailyLogs", today));
        if (todaySnap.exists()) {
          const data = todaySnap.data() as { foods?: { calories?: number }[]; waterMl?: number };
          if ((data.foods?.length ?? 0) > 0 || (data.waterMl ?? 0) > 0) activeToday++;
        }
        const logsQ = query(collection(db, "users", u.uid, "dailyLogs"), orderBy("date", "desc"), limit(30));
        const logs = await getDocs(logsQ);
        logs.docs.forEach((d) => {
          const data = d.data() as { foods?: { calories?: number }[]; waterMl?: number };
          totalMeals += data.foods?.length ?? 0;
          totalCalories += (data.foods ?? []).reduce((s, f) => s + (f.calories ?? 0), 0);
          totalWaterMl += data.waterMl ?? 0;
        });
        const diaries = await getDocs(collection(db, "users", u.uid, "diaries"));
        totalDiaries += diaries.size;
      } catch {
        /* ignore individual user errors */
      }
    }),
  );

  return {
    totalUsers: users.length,
    activeToday,
    newToday,
    totalMeals,
    totalCalories: Math.round(totalCalories),
    totalWaterMl,
    totalDiaries,
  };
}
