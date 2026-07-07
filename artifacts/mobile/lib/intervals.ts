/**
 * Interval workouts — alternate walk/run phases inside one session, the classic
 * way to transition from walking into running (e.g. "walk 5 min, then 20×[walk
 * 1 min / run 30 s]").
 *
 * A plan is authored as warmup + repeated blocks + cooldown; `flatten()` expands
 * it into an absolute timeline the live engine reads by elapsed seconds.
 */

export type PhaseType = "walk" | "run" | "rest";

export interface Phase {
  type: PhaseType;
  seconds: number;
  label?: string;
}

export interface IntervalBlock {
  repeat: number;
  phases: Phase[];
}

export interface IntervalPlan {
  id?: string;
  name: string;
  warmup?: Phase;
  blocks: IntervalBlock[];
  cooldown?: Phase;
}

export interface FlatPhase {
  type: PhaseType;
  seconds: number;
  label: string;
  startSec: number; // inclusive
  endSec: number; // exclusive
  repIndex?: number; // 1-based within its block
  repTotal?: number;
}

export const PHASE_META: Record<PhaseType, { label: string; verb: string; emoji: string; color: string }> = {
  walk: { label: "Walk", verb: "Walk", emoji: "🚶", color: "#9B8AA6" },
  run: { label: "Run", verb: "Run now", emoji: "🏃", color: "#C16E82" },
  rest: { label: "Rest", verb: "Ease off", emoji: "🌿", color: "#A9B7A4" },
};

function phaseLabel(p: Phase): string {
  return p.label ?? PHASE_META[p.type].label;
}

/** Expand a plan into an ordered timeline with absolute start/end seconds. */
export function flatten(plan: IntervalPlan): FlatPhase[] {
  const out: FlatPhase[] = [];
  let t = 0;
  const push = (p: Phase, repIndex?: number, repTotal?: number) => {
    if (p.seconds <= 0) return;
    out.push({
      type: p.type,
      seconds: p.seconds,
      label: phaseLabel(p),
      startSec: t,
      endSec: t + p.seconds,
      repIndex,
      repTotal,
    });
    t += p.seconds;
  };

  if (plan.warmup) push(plan.warmup);
  for (const block of plan.blocks) {
    for (let r = 1; r <= block.repeat; r++) {
      for (const ph of block.phases) push(ph, r, block.repeat);
    }
  }
  if (plan.cooldown) push(plan.cooldown);
  return out;
}

export function totalSeconds(plan: IntervalPlan): number {
  const flat = flatten(plan);
  return flat.length ? flat[flat.length - 1].endSec : 0;
}

export interface PhaseAt {
  phase: FlatPhase;
  index: number;
  remainingSec: number;
  isLast: boolean;
  done: boolean;
}

/** Which phase the given elapsed time falls in (clamped). */
export function phaseAt(flat: FlatPhase[], elapsedSec: number): PhaseAt | null {
  if (flat.length === 0) return null;
  const total = flat[flat.length - 1].endSec;
  if (elapsedSec >= total) {
    const last = flat[flat.length - 1];
    return { phase: last, index: flat.length - 1, remainingSec: 0, isLast: true, done: true };
  }
  for (let i = 0; i < flat.length; i++) {
    const p = flat[i];
    if (elapsedSec < p.endSec) {
      return {
        phase: p,
        index: i,
        remainingSec: Math.max(0, Math.ceil(p.endSec - elapsedSec)),
        isLast: i === flat.length - 1,
        done: false,
      };
    }
  }
  return null;
}

export function nextPhase(flat: FlatPhase[], index: number): FlatPhase | null {
  return index + 1 < flat.length ? flat[index + 1] : null;
}

/** Transition timestamps (seconds from start) + the phase that begins there — for scheduling cues. */
export function boundaries(flat: FlatPhase[]): { atSec: number; phase: FlatPhase }[] {
  return flat.map((p) => ({ atSec: p.startSec, phase: p })).filter((b) => b.atSec > 0);
}

/** Human summary like "Walk 5:00 · 20×(walk 1:00 / run 0:30) · ~25 min". */
export function summarize(plan: IntervalPlan): string {
  const parts: string[] = [];
  if (plan.warmup) parts.push(`${PHASE_META[plan.warmup.type].label} ${fmt(plan.warmup.seconds)}`);
  for (const b of plan.blocks) {
    const inner = b.phases.map((p) => `${PHASE_META[p.type].label.toLowerCase()} ${fmt(p.seconds)}`).join(" / ");
    parts.push(`${b.repeat}×(${inner})`);
  }
  if (plan.cooldown) parts.push(`${PHASE_META[plan.cooldown.type].label} ${fmt(plan.cooldown.seconds)}`);
  return parts.join(" · ");
}

export function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── presets ────────────────────────────────────────────────────────────────

export const INTERVAL_PRESETS: IntervalPlan[] = [
  {
    id: "walk5-20x-1w-30r",
    name: "Ease into running",
    warmup: { type: "walk", seconds: 300, label: "Warm-up walk" },
    blocks: [{ repeat: 20, phases: [{ type: "walk", seconds: 60 }, { type: "run", seconds: 30 }] }],
  },
  {
    id: "c25k-w1",
    name: "First runs · 8×(walk 90s / run 60s)",
    warmup: { type: "walk", seconds: 300, label: "Warm-up walk" },
    blocks: [{ repeat: 8, phases: [{ type: "walk", seconds: 90 }, { type: "run", seconds: 60 }] }],
    cooldown: { type: "walk", seconds: 300, label: "Cool-down walk" },
  },
  {
    id: "build-2min",
    name: "Building · 6×(walk 60s / run 2min)",
    warmup: { type: "walk", seconds: 300, label: "Warm-up walk" },
    blocks: [{ repeat: 6, phases: [{ type: "walk", seconds: 60 }, { type: "run", seconds: 120 }] }],
    cooldown: { type: "walk", seconds: 180, label: "Cool-down walk" },
  },
];

/** Build the user's canonical example: warm-up walk + N×(walk / run). */
export function buildSimpleInterval(
  warmupMin: number,
  reps: number,
  walkSec: number,
  runSec: number,
  cooldownMin = 0
): IntervalPlan {
  const plan: IntervalPlan = {
    name: `${reps}×(walk ${fmt(walkSec)} / run ${fmt(runSec)})`,
    blocks: [{ repeat: reps, phases: [{ type: "walk", seconds: walkSec }, { type: "run", seconds: runSec }] }],
  };
  if (warmupMin > 0) plan.warmup = { type: "walk", seconds: Math.round(warmupMin * 60), label: "Warm-up walk" };
  if (cooldownMin > 0) plan.cooldown = { type: "walk", seconds: Math.round(cooldownMin * 60), label: "Cool-down walk" };
  return plan;
}
