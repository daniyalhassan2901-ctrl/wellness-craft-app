// Safe formatting for arbitrary numeric values coming from Firestore / user input.
// Guards against NaN, Infinity, non-numeric, and absurdly large values that can
// break UI layout (e.g. 1e+150 rendered as a 150-char string).

const MAX_SAFE = 1e15;

export function safeNumber(value: unknown, fallback = "N/A"): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (Math.abs(n) > MAX_SAFE) return "∞";
  try {
    return Math.round(n).toLocaleString();
  } catch {
    return fallback;
  }
}

export function safeDecimal(value: unknown, digits = 1, fallback = "N/A"): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (Math.abs(n) > MAX_SAFE) return "∞";
  try {
    return n.toFixed(digits);
  } catch {
    return fallback;
  }
}

export function safeInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (Math.abs(n) > MAX_SAFE) return fallback;
  return Math.round(n);
}
