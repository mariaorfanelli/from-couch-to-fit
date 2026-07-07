import type { ActivityType } from "@/context/AppContext";
import type { PlanDay, PlanTarget } from "@/lib/experiments";
import { formatPace } from "@/lib/experiments";
import { buildSimpleInterval, summarize } from "@/lib/intervals";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * Turns an objective ("run 6 km", "reach 7:10 pace") into a trackable schedule.
 *
 * Primary path: a Supabase Edge Function (`deepseek-plan`) that calls DeepSeek
 * server-side so the API key never ships in the app. If the function is missing
 * or errors, we fall back to a solid local generator so the feature always works.
 */

export interface PlanStats {
  weeklyKm: number;
  bestPaceSec: number | null;
  typicalRunKm: number;
}

export interface GeneratedPlan {
  title: string;
  durationDays: number;
  summary: string;
  days: PlanDay[];
  source: "ai" | "local";
}

export interface GenerateInput {
  objective: string;
  target: PlanTarget;
  weeks: number;
  stats: PlanStats;
}

export async function generatePlan(input: GenerateInput): Promise<GeneratedPlan> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke("deepseek-plan", { body: input });
      if (!error && data && Array.isArray(data.days) && data.days.length > 0) {
        return { ...normalizeAiPlan(data, input), source: "ai" };
      }
    } catch {
      // fall through to local
    }
  }
  return { ...localPlan(input), source: "local" };
}

// ─── AI response normalization ───────────────────────────────────────────────

function normalizeAiPlan(data: any, input: GenerateInput): Omit<GeneratedPlan, "source"> {
  const durationDays = input.weeks * 7;
  const days: PlanDay[] = (data.days as any[])
    .filter((d) => typeof d.dayIndex === "number" && d.dayIndex >= 0 && d.dayIndex < durationDays)
    .map((d) => ({
      dayIndex: d.dayIndex,
      label: String(d.label ?? "Session"),
      prescription: String(d.prescription ?? ""),
      activityType: (["run", "walk", "pilates", "yoga", "strength"].includes(d.activityType)
        ? d.activityType
        : "run") as ActivityType,
      targetKm: typeof d.targetKm === "number" ? d.targetKm : undefined,
      interval: d.interval && Array.isArray(d.interval.blocks) ? d.interval : undefined,
      rest: !!d.rest,
    }));
  return {
    title: String(data.title ?? planTitle(input.target)),
    durationDays,
    summary: String(data.summary ?? `${input.weeks}-week plan`),
    days,
  };
}

// ─── local fallback generator ────────────────────────────────────────────────

function planTitle(t: PlanTarget): string {
  return t.kind === "distance" ? `Run ${t.value} km` : `Reach ${formatPace(t.value)} pace`;
}

/**
 * A gentle, progressive 3-sessions-per-week schedule (Mon/Wed/Sat). Distance
 * goals ramp run/walk intervals into continuous runs; pace goals add a weekly
 * speed session. Everything stays kind and achievable.
 */
function localPlan(input: GenerateInput): Omit<GeneratedPlan, "source"> {
  const { target, weeks } = input;
  const durationDays = weeks * 7;
  const trainingOffsets = [0, 2, 5]; // Mon, Wed, Sat within each week
  const sessions: { week: number; offset: number; i: number }[] = [];
  let i = 0;
  for (let w = 0; w < weeks; w++) {
    for (const off of trainingOffsets) {
      sessions.push({ week: w, offset: off, i: i++ });
    }
  }
  const total = sessions.length;
  const days: PlanDay[] = [];

  for (const s of sessions) {
    const dayIndex = s.week * 7 + s.offset;
    const frac = (s.i + 1) / total;

    if (target.kind === "distance") {
      if (frac < 0.5) {
        const reps = Math.round(6 + frac * 12); // 6 → ~12
        const runSec = Math.round(30 + frac * 120); // 30 → ~90s
        const interval = buildSimpleInterval(5, reps, 60, runSec, 3);
        interval.name = `Wk ${s.week + 1} · run/walk builder`;
        days.push({
          dayIndex,
          label: `Week ${s.week + 1} · Run/walk builder`,
          prescription: `Ease in with ${summarize(interval)}. Keep the runs conversational.`,
          activityType: "run",
          interval,
        });
      } else {
        const targetKm = Math.max(1, Math.round(target.value * frac * 10) / 10);
        days.push({
          dayIndex,
          label: `Week ${s.week + 1} · Continuous run`,
          prescription: `Run ${targetKm} km at an easy, steady pace — walk breaks are fine.`,
          activityType: "run",
          targetKm,
        });
      }
    } else {
      // pace goal: 2 easy runs + 1 weekly speed session
      const isSpeed = s.offset === 2;
      if (isSpeed) {
        const reps = 5 + Math.min(3, s.week); // 5 → 8
        const interval = buildSimpleInterval(8, reps, 90, 120, 5);
        interval.name = `Wk ${s.week + 1} · speed intervals`;
        interval.blocks = [{ repeat: reps, phases: [{ type: "run", seconds: 120, label: "Fast" }, { type: "walk", seconds: 90 }] }];
        days.push({
          dayIndex,
          label: `Week ${s.week + 1} · Speed intervals`,
          prescription: `${reps}×(2 min faster than ${formatPace(target.value)} / 90 s walk). This is what lifts your pace.`,
          activityType: "run",
          interval,
        });
      } else {
        const km = Math.max(2, Math.round((input.stats.typicalRunKm || 3) * 10) / 10);
        days.push({
          dayIndex,
          label: `Week ${s.week + 1} · Easy run`,
          prescription: `Comfortable ${km} km run — relaxed effort so your legs recover and adapt.`,
          activityType: "run",
          targetKm: km,
        });
      }
    }
  }

  return {
    title: planTitle(target),
    durationDays,
    summary: `${weeks}-week gentle plan · 3 sessions/week`,
    days,
  };
}
