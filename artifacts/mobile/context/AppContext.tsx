import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { insertActivity } from "@/lib/supabase";

export type ActivityType = "run" | "walk" | "pilates" | "yoga" | "strength";

export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  pace?: string;
  notes?: string;
}

export interface Goal {
  id: string;
  targetEvent: string;
  targetDistanceKm: number;
  targetDate: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AppContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  markOnboardingSeen: () => void;

  activities: Activity[];
  goals: Goal[];
  activeGoal: Goal | null;
  addActivity: (a: Omit<Activity, "id">) => void;
  deleteActivity: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  deleteGoal: (id: string) => void;

  weeklyKm: number;
  weeklyActivities: number;
  weeklyMinutes: number;
  monthlyKm: number;
  totalKm: number;
  totalActivities: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const KEYS = {
  session: "@c2f_session",
  users: "@c2f_users",
  activities: (uid: string) => `@c2f_activities_${uid}`,
  goals: (uid: string) => `@c2f_goals_${uid}`,
  onboarding: "@c2f_onboarding_seen",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [sessionStr, onboardingStr] = await Promise.all([
          AsyncStorage.getItem(KEYS.session),
          AsyncStorage.getItem(KEYS.onboarding),
        ]);

        if (onboardingStr === "true") setHasSeenOnboarding(true);

        if (sessionStr) {
          const sess: UserProfile = JSON.parse(sessionStr);
          setUser(sess);
          await loadUserData(sess.id);
        }
      } catch {}
      setIsLoading(false);
    }
    bootstrap();
  }, []);

  async function loadUserData(uid: string) {
    try {
      const [aStr, gStr] = await Promise.all([
        AsyncStorage.getItem(KEYS.activities(uid)),
        AsyncStorage.getItem(KEYS.goals(uid)),
      ]);
      if (aStr) setActivities(JSON.parse(aStr));
      if (gStr) setGoals(JSON.parse(gStr));
    } catch {}
  }

  async function saveActivities(uid: string, data: Activity[]) {
    await AsyncStorage.setItem(KEYS.activities(uid), JSON.stringify(data));
  }

  async function saveGoals(uid: string, data: Goal[]) {
    await AsyncStorage.setItem(KEYS.goals(uid), JSON.stringify(data));
  }

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const usersStr = await AsyncStorage.getItem(KEYS.users);
    const users: Record<string, { id: string; name: string; email: string; hash: string }> =
      usersStr ? JSON.parse(usersStr) : {};

    if (users[email.toLowerCase()]) {
      throw new Error("An account with this email already exists.");
    }

    const newUser: UserProfile = { id: generateId(), name, email: email.toLowerCase() };
    users[email.toLowerCase()] = { ...newUser, hash: encode(password) };

    await AsyncStorage.setItem(KEYS.users, JSON.stringify(users));
    await AsyncStorage.setItem(KEYS.session, JSON.stringify(newUser));
    setUser(newUser);
    setActivities([]);
    setGoals([]);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const usersStr = await AsyncStorage.getItem(KEYS.users);
    const users: Record<string, { id: string; name: string; email: string; hash: string }> =
      usersStr ? JSON.parse(usersStr) : {};

    const record = users[email.toLowerCase()];
    if (!record) throw new Error("No account found with this email.");
    if (record.hash !== encode(password)) throw new Error("Incorrect password.");

    const profile: UserProfile = { id: record.id, name: record.name, email: record.email };
    await AsyncStorage.setItem(KEYS.session, JSON.stringify(profile));
    setUser(profile);
    await loadUserData(profile.id);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(KEYS.session);
    setUser(null);
    setActivities([]);
    setGoals([]);
  }, []);

  const markOnboardingSeen = useCallback(() => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(KEYS.onboarding, "true").catch(() => {});
  }, []);

  const addActivity = useCallback(
    (a: Omit<Activity, "id">) => {
      if (!user) return;
      const newActivity: Activity = { ...a, id: generateId() };
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

  const addGoal = useCallback(
    (g: Omit<Goal, "id" | "createdAt">) => {
      if (!user) return;
      const newGoal: Goal = { ...g, id: generateId(), createdAt: new Date().toISOString() };
      setGoals((prev) => {
        const next = [newGoal, ...prev];
        saveGoals(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      if (!user) return;
      setGoals((prev) => {
        const next = prev.filter((g) => g.id !== id);
        saveGoals(user.id, next).catch(() => {});
        return next;
      });
    },
    [user]
  );

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
        signOut,
        markOnboardingSeen,
        activities,
        goals,
        activeGoal: goals.length > 0 ? goals[0] : null,
        addActivity,
        deleteActivity,
        addGoal,
        deleteGoal,
        weeklyKm: weekActs.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        weeklyActivities: weekActs.length,
        weeklyMinutes: weekActs.reduce((s, a) => s + a.durationMinutes, 0),
        monthlyKm: monthActs.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        totalKm: activities.reduce((s, a) => s + (a.distanceKm ?? 0), 0),
        totalActivities: activities.length,
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
