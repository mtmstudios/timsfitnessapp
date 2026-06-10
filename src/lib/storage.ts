const KEY = "atlas-fitness-v1";

export interface SessionLog {
  workoutId: string;
  date: string; // ISO date
  rpe?: number;
  energy?: "low" | "mid" | "high";
  note?: string;
}

export interface ProgressState {
  completed: Record<string, string>; // day key (YYYY-Www-Mo) -> workoutId
  logs: SessionLog[];
  weightKg?: number;
  waistCm?: number;
}

const empty: ProgressState = { completed: {}, logs: [] };

export function loadState(): ProgressState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveState(s: ProgressState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getWeekKey(d = new Date()) {
  const start = new Date(d);
  const day = (start.getDay() + 6) % 7; // Mon=0
  start.setDate(start.getDate() - day);
  return start.toISOString().slice(0, 10);
}

export function getTodayWeekdayIndex() {
  if (typeof window === "undefined") return 0;
  return (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
}

export function markCompleted(day: string, workoutId: string) {
  const s = loadState();
  s.completed[`${getWeekKey()}-${day}`] = workoutId;
  saveState(s);
}

export function unmarkCompleted(day: string) {
  const s = loadState();
  delete s.completed[`${getWeekKey()}-${day}`];
  saveState(s);
}

export function isCompleted(day: string) {
  const s = loadState();
  return !!s.completed[`${getWeekKey()}-${day}`];
}

export function addLog(log: SessionLog) {
  const s = loadState();
  s.logs.push(log);
  saveState(s);
}