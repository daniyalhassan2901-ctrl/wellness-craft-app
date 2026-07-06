export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type FitnessGoal = "loss" | "gain" | "muscle" | "recomp" | "maintenance";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function calcBMR(weightKg: number, heightCm: number, age: number, gender: Gender) {
  // Mifflin-St Jeor — sanitize inputs to avoid NaN propagation.
  const w = num(weightKg, 70);
  const h = num(heightCm, 170);
  const a = num(age, 30);
  const base = 10 * w + 6.25 * h - 5 * a;
  const bmr = gender === "male" ? base + 5 : base - 161;
  return Math.max(0, Math.round(Number.isFinite(bmr) ? bmr : 0));
}

export function calcTDEE(bmr: number, level: ActivityLevel) {
  const mult = ACTIVITY_MULTIPLIER[level] ?? 1.2;
  const tdee = num(bmr, 0) * mult;
  return Math.max(0, Math.round(Number.isFinite(tdee) ? tdee : 0));
}

export function calcTargets(tdee: number, goal: FitnessGoal) {
  const map: Record<FitnessGoal, number> = {
    loss: -500,
    gain: 300,
    muscle: 250,
    recomp: -150,
    maintenance: 0,
  };
  const calories = Math.max(1200, tdee + map[goal]);
  const aggressiveLoss = Math.max(1200, tdee - 750);
  const leanBulk = tdee + 200;
  return {
    calories,
    aggressiveLoss,
    leanBulk,
    maintenance: tdee,
    weightLoss: Math.max(1200, tdee - 500),
    weightGain: tdee + 300,
  };
}

export function calcMacros(calories: number, weightKg: number, goal: FitnessGoal) {
  // Protein: 1.6-2.2g/kg depending on goal
  const proteinPerKg = goal === "muscle" || goal === "recomp" ? 2.0 : goal === "loss" ? 1.8 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const water = Math.round(weightKg * 35); // ml
  return { protein, carbs, fat, water };
}

export function calcBMI(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function weeklyProgress(deltaCal: number) {
  // ~7700 kcal per kg
  return +((deltaCal * 7) / 7700).toFixed(2);
}
