import type { Activity } from "@/context/AppContext";

/**
 * Pure statistics over the activity log — weekly buckets, pace/distance trends,
 * and "am I improving?" readouts. No React, no storage; just numbers in, numbers
 * out, so screens can render them however they like.
 */

function startOfWeekFor(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1); // Monday
  x.setDate(diff);
  return x;
}

export interface WeekBucket {
  weekStart: Date;
  label: string; // "Jun 16"
  km: number;
  count: number;
  minutes: number;
}

/** Last `n` weeks (oldest → newest), including the current week. */
export function weeklyBuckets(activities: Activity[], n = 6): WeekBucket[] {
  const thisWeek = startOfWeekFor(new Date());
  const buckets: WeekBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ws = new Date(thisWeek);
    ws.setDate(thisWeek.getDate() - i * 7);
    buckets.push({
      weekStart: ws,
      label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      km: 0,
      count: 0,
      minutes: 0,
    });
  }
  for (const a of activities) {
    const d = new Date(a.date + (a.date.length === 10 ? "T00:00:00" : ""));
    const ws = startOfWeekFor(d).getTime();
    const b = buckets.find((x) => x.weekStart.getTime() === ws);
    if (b) {
      b.km += a.distanceKm ?? 0;
      b.count += 1;
      b.minutes += a.durationMinutes;
    }
  }
  return buckets;
}

/** seconds-per-km for an activity that has distance, else null. */
export function activityPaceSec(a: Activity): number | null {
  if (!a.distanceKm || a.distanceKm < 0.3) return null;
  return (a.durationMinutes * 60) / a.distanceKm;
}

export type TrendDir = "improving" | "steady" | "easing";

export interface PaceTrend {
  dir: TrendDir;
  recentSec: number | null;
  earlierSec: number | null;
  deltaSec: number; // negative = faster/improving
  points: number[]; // recent-last pace series for a sparkline
}

/** Compare the recent half of runs vs the earlier half. Lower pace = improving. */
export function paceTrend(activities: Activity[], type: "run" | "walk" = "run"): PaceTrend {
  const paces = activities
    .filter((a) => a.type === type)
    .map((a) => ({ date: a.date, sec: activityPaceSec(a) }))
    .filter((x): x is { date: string; sec: number } => x.sec != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const points = paces.map((p) => p.sec);
  if (paces.length < 2) {
    return { dir: "steady", recentSec: points.at(-1) ?? null, earlierSec: null, deltaSec: 0, points };
  }
  const mid = Math.floor(paces.length / 2);
  const earlier = paces.slice(0, mid);
  const recent = paces.slice(mid);
  const avg = (xs: { sec: number }[]) => xs.reduce((s, x) => s + x.sec, 0) / xs.length;
  const earlierSec = avg(earlier);
  const recentSec = avg(recent);
  const deltaSec = recentSec - earlierSec;
  const dir: TrendDir = deltaSec < -3 ? "improving" : deltaSec > 3 ? "easing" : "steady";
  return { dir, recentSec, earlierSec, deltaSec, points };
}

export interface Delta {
  current: number;
  previous: number;
  diff: number;
  pct: number; // vs previous
}

export function weekOverWeek(activities: Activity[], pick: (b: WeekBucket) => number): Delta {
  const b = weeklyBuckets(activities, 2);
  const previous = b[0] ? pick(b[0]) : 0;
  const current = b[1] ? pick(b[1]) : 0;
  const diff = current - previous;
  const pct = previous > 0 ? (diff / previous) * 100 : 0;
  return { current, previous, diff, pct };
}

export function bestPaceSec(activities: Activity[], type: "run" | "walk" = "run"): number | null {
  const paces = activities.filter((a) => a.type === type).map(activityPaceSec).filter((x): x is number => x != null);
  return paces.length ? Math.min(...paces) : null;
}

export function longestRunKm(activities: Activity[]): number {
  return activities.filter((a) => a.type === "run").reduce((m, a) => Math.max(m, a.distanceKm ?? 0), 0);
}

/** Average distinct active days per week over the last `n` weeks. */
export function consistencyPerWeek(activities: Activity[], n = 4): number {
  const thisWeek = startOfWeekFor(new Date());
  const earliest = new Date(thisWeek);
  earliest.setDate(thisWeek.getDate() - (n - 1) * 7);
  const perWeek = new Map<number, Set<string>>();
  for (const a of activities) {
    const d = new Date(a.date + (a.date.length === 10 ? "T00:00:00" : ""));
    if (d < earliest) continue;
    const wk = startOfWeekFor(d).getTime();
    if (!perWeek.has(wk)) perWeek.set(wk, new Set());
    perWeek.get(wk)!.add(a.date);
  }
  let total = 0;
  perWeek.forEach((set) => (total += set.size));
  return total / n;
}

export function formatPaceSec(sec: number | null): string {
  if (sec == null) return "--";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
