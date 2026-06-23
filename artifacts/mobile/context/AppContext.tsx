import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  name: string;
}

interface AppContextValue {
  activities: Activity[];
  goals: Goal[];
  activeGoal: Goal | null;
  user: UserProfile;
  addActivity: (a: Omit<Activity, "id">) => void;
  deleteActivity: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  deleteGoal: (id: string) => void;
  updateUser: (u: Partial<UserProfile>) => void;
  weeklyKm: number;
  weeklyActivities: number;
  weeklyMinutes: number;
  monthlyKm: number;
  totalKm: number;
  totalActivities: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  activities: "@c2f_activities",
  goals: "@c2f_goals",
  user: "@c2f_user",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<UserProfile>({ name: "Friend" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [aStr, gStr, uStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.activities),
          AsyncStorage.getItem(STORAGE_KEYS.goals),
          AsyncStorage.getItem(STORAGE_KEYS.user),
        ]);
        if (aStr) setActivities(JSON.parse(aStr));
        if (gStr) setGoals(JSON.parse(gStr));
        if (uStr) setUser(JSON.parse(uStr));
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities)).catch(() => {});
  }, [activities, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals)).catch(() => {});
  }, [goals, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)).catch(() => {});
  }, [user, loaded]);

  const addActivity = useCallback((a: Omit<Activity, "id">) => {
    const newActivity: Activity = { ...a, id: generateId() };
    setActivities((prev) => [newActivity, ...prev]);
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt">) => {
    const newGoal: Goal = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    setGoals((prev) => [newGoal, ...prev]);
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateUser = useCallback((u: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...u }));
  }, []);

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const weekActivities = activities.filter((a) => new Date(a.date) >= weekStart);
  const monthActivities = activities.filter((a) => new Date(a.date) >= monthStart);

  const weeklyKm = weekActivities.reduce((sum, a) => sum + (a.distanceKm ?? 0), 0);
  const weeklyActivities = weekActivities.length;
  const weeklyMinutes = weekActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const monthlyKm = monthActivities.reduce((sum, a) => sum + (a.distanceKm ?? 0), 0);
  const totalKm = activities.reduce((sum, a) => sum + (a.distanceKm ?? 0), 0);
  const totalActivities = activities.length;

  const activeGoal = goals.length > 0 ? goals[0] : null;

  return (
    <AppContext.Provider
      value={{
        activities,
        goals,
        activeGoal,
        user,
        addActivity,
        deleteActivity,
        addGoal,
        deleteGoal,
        updateUser,
        weeklyKm,
        weeklyActivities,
        weeklyMinutes,
        monthlyKm,
        totalKm,
        totalActivities,
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
