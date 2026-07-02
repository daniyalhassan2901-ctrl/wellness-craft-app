import type { ActivityLevel, FitnessGoal, Gender } from "./calculations";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  photoURL?: string;
  createdAt: number;
  streak?: number;
  lastLogDate?: string;
  dailyCalorieTarget?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  servingSize: number;
  servingUnit: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface LoggedFood {
  id: string;
  foodId: string;
  name: string;
  meal: MealType;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  foods: LoggedFood[];
  waterMl: number;
  notes?: string;
  mood?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: number;
}
