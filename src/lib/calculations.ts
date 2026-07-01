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

export function calcBMR(weightKg: number, heightCm: number, age: number, gender: Gender) {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, level: ActivityLevel) {
  return Math.round(bmr * ACTIVITY_MULTIPLIER[level]);
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
