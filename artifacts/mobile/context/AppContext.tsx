import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { Experiment, ExperimentSession, Mood, PlanDay, PlanTarget } from "@/lib/experiments";
import { todayKey } from "@/lib/experiments";
import type { IntervalPlan } from "@/lib/intervals";
import type { LatLng } from "@/lib/locationTracking";
import {
  deriveProfile,
  getSession,
  insertActivity,
  isSupabaseConfigured,
  onAuthChange,
  signInWithGoogle as supabaseSignInWithGoogle,
  signInWithPassword,
  signOut as supabaseSignOut,
  signUpWithPassword,
  supabase,
} from "@/lib/supabase";

export type { LatLng };

export type ActivityType = "run" | "walk" | "pilates" | "yoga" | "strength";

export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  pace?: string;
  notes?: string;
  /** Recorded GPS route, present for tracked runs/walks. */
  coords?: LatLng[];
  /** Present when the session was a run/walk interval workout. */
  interval?: IntervalPlan;
  intervalLabel?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface CreateExperimentInput {
  title: string;
  hypothesis?: string;
  activityType: ActivityType;
  durationDays: number;
  targetPerDayKm?: number;
}

export interface ExperimentSessionUpdate {
  activityId?: string;
  mood?: Mood;
  note?: string;
}

export interface CreatePlanInput {
  title: string;
  objective: string;
  target: PlanTarget;
  activityType: ActivityType;
  durationDays: number;
  days: PlanDay[];
}

interface AppContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  markOnboardingSeen: () => void;
  updateName: (name: string) => Promise<void>;
  preferredActivities: ActivityType[];
  setPreferredActivities: (types: ActivityType[]) => void;

  activities: Activity[];
  addActivity: (a: Omit<Activity, "id">) => string;
  deleteActivity: (id: string) => void;

  experiments: Experiment[];
  activeExperiment: Experiment | null;
  createExperiment: (input: CreateExperimentInput) => string;
  createPlan: (input: CreatePlanInput) => string;
  recordExperimentSession: (expId: string, dayIndex: number, update: ExperimentSessionUpdate) => void;
  completeExperiment: (expId: string) => void;
  archiveExperiment: (expId: string) => void;
  deleteExperiment: (expId: string) => void;

  weeklyKm: number;
  weeklyActivities: number;
  weeklyMinutes: number;
  monthlyKm: number;
  totalKm: number;
  totalActivities: number;
  currentStreakDays: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const KEYS = {
  activities: (uid: string) => `@c2f_activities_${uid}`,
  experiments: (uid: string) => `@c2f_experiments_${uid}`,
  onboarding: (uid: string) => `@c2f_onboarding_${uid}`,
  preferred: (uid: string) => `@c2f_preferred_${uid}`,
  localName: (uid: string) => `@c2f_name_${uid}`,
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStreak(activities: Activity[]): number {
  if (activities.length === 0) return 0;
  const days = new Set<string>(activities.map((a) => a.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (days.has(key)) count++;
    else if (i === 0) continue;
    else break;
  }
  return count;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [preferredActivities, setPreferred] = useState<ActivityType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  // ─── bootstrap + auth subscription ───────────────────────────────────────
  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function applySession(session: Awaited<ReturnType<typeof getSession>>) {
      const profile = deriveProfile(session?.user ?? null);
      if (profile) {
        const cached = await AsyncStorage.getItem(KEYS.localName(profile.id));
        if (cached) profile.name = cached;
        setUser(profile);
        await loadUserData(profile.id);
      } else {
        setUser(null);
        setActivities([]);
        setExperiments([]);
        setHasSeenOnboarding(false);
        setPreferred([]);
      }
    }

    async function bootstrap() {
      try {
        const session = await getSession();
        await applySession(session);
        if (isSupabaseConfigured) {
          unsub = onAuthChange((s) => {
            applySession(s).catch(() => {});
          });
        }
      } catch {}
      setIsLoading(false);
    }

    bootstrap();
    return () => {
      unsub?.();
    };
  }, []);

  async function loadUserData(uid: string) {
    try {
      const [aStr, eStr, onb, prefStr] = await Promise.all([
        AsyncStorage.getItem(KEYS.activities(uid)),
        AsyncStorage.getItem(KEYS.experiments(uid)),
        AsyncStorage.getItem(KEYS.onboarding(uid)),
        AsyncStorage.getItem(KEYS.preferred(uid)),
      ]);
      setActivities(aStr ? JSON.parse(aStr) : []);
      setExperiments(eStr ? JSON.parse(eStr) : []);
      setHasSeenOnboarding(onb === "true");
      setPreferred(prefStr ? JSON.parse(prefStr) : []);
    } catch {}
  }

  async function saveActivities(uid: string, data: Activity[]) {
    await AsyncStorage.setItem(KEYS.activities(uid), JSON.stringify(data));
  }
  async function saveExperiments(uid: string, data: Experiment[]) {
    await AsyncStorage.setItem(KEYS.experiments(uid), JSON.stringify(data));
  }

  // ─── auth ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithPassword(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await signUpWithPassword(email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabaseSignInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setActivities([]);
    setExperiments([]);
    setHasSeenOnboarding(false);
    setPreferred([]);
  }, []);

  // ─── onboarding ──────────────────────────────────────────────────────────
  const markOnboardingSeen = useCallback(() => {
    setHasSeenOnboarding(true);
    if (user) AsyncStorage.setItem(KEYS.onboarding(user.id), "true").catch(() => {});
  }, [user]);

  const updateName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setUser((u) => (u ? { ...u, name: trimmed } : u));
      if (user) {
        await AsyncStorage.setItem(KEYS.localName(user.id), trimmed);
        if (isSupabaseConfigured) {
          supabase.auth.updateUser({ data: { name: trimmed } }).catch(() => {});
        }
      }
    },
    [user]
  );

  const setPreferredActivities = useCallback(
    (types: ActivityType[]) => {
      setPreferred(types);
      if (user) AsyncStorage.setItem(KEYS.preferred(user.id), JSON.stringify(types)).catch(() => {});
    },
    [user]
  );

  // ─── activities ──────────────────────────────────────────────────────────
  const addActivity = useCallback(
    (a: Omit<Activity, "id">): string => {
      const id = generateId();
      if (!user) return id;
      const newActivity: Activity = { ...a, id };
      setActivities((prev) => {
        const next = [newActivity, ...prev];
        saveActivities(user.id, next).catch(() => {});
        return next;
      });
      insertActivity({
        id: newActivity.id,
        user_id: user.id,
        date: newActivity.date,
        type: newActivity.type,
        duration_minutes: newActivity.durationMinutes,
        distance_km: newActivity.distanceKm ?? null,
        pace: newActivity.pace ?? null,
        notes: newActivity.notes ?? null,
      }).catch(() => {});
      return id;
    },
    [user]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      if (!user) return;
      setActivities((prev) => {
        const next = prev.filter((a) => a.id !== id);
        saveActivities(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  // ─── experiments ─────────────────────────────────────────────────────────
  const createExperiment = useCallback(
    (input: CreateExperimentInput): string => {
      const id = generateId();
      if (!user) return id;
      const exp: Experiment = {
        id,
        kind: "experiment",
        title: input.title.trim(),
        hypothesis: input.hypothesis?.trim() || undefined,
        activityType: input.activityType,
        durationDays: input.durationDays,
        targetPerDayKm: input.targetPerDayKm,
        startDate: todayKey(),
        status: "active",
        sessions: [],
        createdAt: new Date().toISOString(),
      };
      setExperiments((prev) => {
        // Auto-archive any prior active experiment — only one is "the" experiment at a time.
        const next = prev.map((p) => (p.status === "active" ? { ...p, status: "archived" as const } : p));
        next.unshift(exp);
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
      return id;
    },
    [user]
  );

  const createPlan = useCallback(
    (input: CreatePlanInput): string => {
      const id = generateId();
      if (!user) return id;
      const exp: Experiment = {
        id,
        kind: "plan",
        title: input.title.trim(),
        activityType: input.activityType,
        durationDays: input.durationDays,
        startDate: todayKey(),
        status: "active",
        sessions: [],
        createdAt: new Date().toISOString(),
        objective: input.objective,
        target: input.target,
        days: input.days,
      };
      setExperiments((prev) => {
        const next = prev.map((p) => (p.status === "active" ? { ...p, status: "archived" as const } : p));
        next.unshift(exp);
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
      return id;
    },
    [user]
  );

  const recordExperimentSession = useCallback(
    (expId: string, dayIndex: number, update: ExperimentSessionUpdate) => {
      if (!user) return;
      setExperiments((prev) => {
        const next = prev.map((e) => {
          if (e.id !== expId) return e;
          const existing = e.sessions.find((s) => s.dayIndex === dayIndex);
          const merged: ExperimentSession = {
            dayIndex,
            activityId: update.activityId ?? existing?.activityId,
            mood: update.mood ?? existing?.mood,
            note: update.note ?? existing?.note,
            completedAt: existing?.completedAt ?? new Date().toISOString(),
          };
          const sessions = existing
            ? e.sessions.map((s) => (s.dayIndex === dayIndex ? merged : s))
            : [...e.sessions, merged].sort((a, b) => a.dayIndex - b.dayIndex);
          return { ...e, sessions };
        });
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  const completeExperiment = useCallback(
    (expId: string) => {
      if (!user) return;
      setExperiments((prev) => {
        const next = prev.map((e) => (e.id === expId ? { ...e, status: "completed" as const } : e));
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  const archiveExperiment = useCallback(
    (expId: string) => {
      if (!user) return;
      setExperiments((prev) => {
        const next = prev.map((e) => (e.id === expId ? { ...e, status: "archived" as const } : e));
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  const deleteExperiment = useCallback(
    (expId: string) => {
      if (!user) return;
      setExperiments((prev) => {
        const next = prev.filter((e) => e.id !== expId);
        saveExperiments(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  const activeExperiment = experiments.find((e) => e.status === "active") ?? null;

  // ─── derived ─────────────────────────────────────────────────────────────
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const weekActs = activities.filter((a) => new Date(a.date) >= weekStart);
  const monthActs = activities.filter((a) => new Date(a.date) >= monthStart);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        hasSeenOnboarding,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        markOnboardingSeen,
        updateName,
        preferredActivities,
        setPreferredActivities,
        activities,
        addActivity,
        deleteActivity,
        experiments,
        activeExperiment,
        createExperiment,
        createPlan,
        recordExperimentSession,
        completeExperiment,
        archiveExperiment,
        deleteExperiment,
        weeklyKm: weekActs.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        weeklyActivities: weekActs.length,
        weeklyMinutes: weekActs.reduce((s, a) => s + a.durationMinutes, 0),
        monthlyKm: monthActs.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        totalKm: activities.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        totalActivities: activities.length,
        currentStreakDays: computeStreak(activities),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
