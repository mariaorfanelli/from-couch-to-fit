import type { Activity, ActivityType } from "@/context/AppContext";

/**
 * Tiny experiments — small, time-boxed promises ("Run 1 km a day for 5 days").
 * No pass/fail, only noticing: after each session the user logs a mood + note,
 * and the wrap-up screen summarizes the whole arc.
 */

export type Mood = 0 | 1 | 2 | 3 | 4;

export const MOODS: { emoji: string; label: string }[] = [
  { emoji: "😣", label: "Tough" },
  { emoji: "😐", label: "Meh" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥰", label: "Great" },
];

export interface ExperimentSession {
  dayIndex: number;
  activityId?: string;
  mood?: Mood;
  note?: string;
  completedAt?: string;
}

export interface Experiment {
  id: string;
  title: string;
  hypothesis?: string;
  activityType: ActivityType;
  durationDays: number;
  targetPerDayKm?: number;
  startDate: string;
  status: "active" | "completed" | "archived";
  sessions: ExperimentSession[];
  createdAt: string;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function daysBetween(a: string, b: string): number {
  const aD = new Date(a + "T00:00:00");
  const bD = new Date(b + "T00:00:00");
  return Math.round((bD.getTime() - aD.getTime()) / (1000 * 60 * 60 * 24));
}

export function dayDate(exp: Experiment, dayIndex: number): Date {
  const d = new Date(exp.startDate + "T00:00:00");
  d.setDate(d.getDate() + dayIndex);
  return d;
}

/** Which day index "today" maps to, or null if today is outside the experiment window. */
export function todayDayIndex(exp: Experiment): number | null {
  const offset = daysBetween(exp.startDate, todayKey());
  if (offset < 0 || offset >= exp.durationDays) return null;
  return offset;
}

export function completedDaysCount(exp: Experiment): number {
  return exp.sessions.filter((s) => !!s.activityId).length;
}

export function isExperimentComplete(exp: Experiment): boolean {
  return completedDaysCount(exp) >= exp.durationDays;
}

/** True iff every day has both an activity AND a recorded mood (i.e. fully reflected). */
export function isExperimentReflected(exp: Experiment): boolean {
  return (
    exp.sessions.filter((s) => s.activityId && typeof s.mood === "number").length >= exp.durationDays
  );
}

export function experimentTotalKm(exp: Experiment, activities: Activity[]): number {
  let sum = 0;
  for (const s of exp.sessions) {
    if (!s.activityId) continue;
    const a = activities.find((x) => x.id === s.activityId);
    if (a?.distanceKm) sum += a.distanceKm;
  }
  return sum;
}

export function experimentTotalMinutes(exp: Experiment, activities: Activity[]): number {
  let sum = 0;
  for (const s of exp.sessions) {
    if (!s.activityId) continue;
    const a = activities.find((x) => x.id === s.activityId);
    if (a) sum += a.durationMinutes;
  }
  return sum;
}

/** Average pace in seconds-per-km across linked activities; null if no distance recorded. */
export function avgPaceSecPerKm(exp: Experiment, activities: Activity[]): number | null {
  const km = experimentTotalKm(exp, activities);
  if (km <= 0) return null;
  const secs = experimentTotalMinutes(exp, activities) * 60;
  return secs / km;
}

export function formatPace(secPerKm: number | null): string {
  if (secPerKm == null) return "--";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Three onboarding templates — the "first experiment" presets shown after activity selection. */
export const EXPERIMENT_TEMPLATES: {
  id: string;
  title: string;
  hypothesis: string;
  activityType: ActivityType;
  durationDays: number;
  targetPerDayKm?: number;
}[] = [
  {
    id: "walk-15min-5d",
    title: "Walk 15 minutes a day for 5 days",
    hypothesis: "I want to see if a tiny daily walk feels grounding.",
    activityType: "walk",
    durationDays: 5,
  },
  {
    id: "run-1km-5d",
    title: "Run 1 km a day for 5 days",
    hypothesis: "I want to see if a tiny daily run feels lighter than one big one.",
    activityType: "run",
    durationDays: 5,
    targetPerDayKm: 1,
  },
  {
    id: "yoga-5min-7d",
    title: "5-minute breathwork for 7 days",
    hypothesis: "I want to notice if a short morning practice changes my day.",
    activityType: "yoga",
    durationDays: 7,
  },
];
