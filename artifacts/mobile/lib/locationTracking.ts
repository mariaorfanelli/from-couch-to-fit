import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

/**
 * Background-capable GPS tracking.
 *
 * A single in-progress run lives in this module as `session`. Both the
 * foreground UI and the background `TaskManager` task read and mutate it, so
 * recording keeps going when the screen locks or another app is opened (this
 * requires a standalone build with the Android foreground service — it does NOT
 * run inside Expo Go). The session is mirrored to AsyncStorage so a relaunch
 * mid-run can recover via `restoreSession()`.
 *
 * Elapsed time is derived from timestamps (not a tick counter) so it stays
 * accurate across backgrounding.
 */

export type LatLng = { latitude: number; longitude: number };

export type TrackingState = "idle" | "tracking" | "paused";

export interface TrackingSnapshot {
  state: TrackingState;
  coords: LatLng[];
  distanceKm: number;
  seconds: number;
}

interface ActiveSession {
  state: "tracking" | "paused";
  coords: LatLng[];
  distanceKm: number;
  startedAt: number; // epoch ms when recording began
  pausedMs: number; // accumulated paused duration in ms
  pausedAt: number | null; // epoch ms when the current pause began
}

export const LOCATION_TASK_NAME = "c2f-location-tracking";
const SESSION_KEY = "@c2f_active_session";

// Discard GPS jitter: only count movement above this threshold (~4 m).
const MIN_MOVE_KM = 0.004;

const LOCATION_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 2000,
  distanceInterval: 5,
  showsBackgroundLocationIndicator: true,
  pausesUpdatesAutomatically: false,
  activityType: Location.ActivityType.Fitness,
  foregroundService: {
    notificationTitle: "From Couch to Fit",
    notificationBody: "Recording your run…",
    notificationColor: "#D4708A",
  },
};

let session: ActiveSession | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function ingest(points: LatLng[]) {
  if (!session || session.state !== "tracking") return;
  let changed = false;
  for (const pt of points) {
    const prev = session.coords[session.coords.length - 1];
    if (!prev) {
      session.coords.push(pt);
      changed = true;
      continue;
    }
    const delta = haversineKm(prev, pt);
    if (delta > MIN_MOVE_KM) {
      session.distanceKm += delta;
      session.coords.push(pt);
      changed = true;
    }
  }
  if (changed) {
    persist();
    emit();
  }
}

// Must be registered at module scope so it survives backgrounding. Not
// available on web, where TaskManager is a no-op shim that throws.
if (Platform.OS !== "web") {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error || !data) return;
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations?.length) return;
    ingest(
      locations.map((l) => ({
        latitude: l.coords.latitude,
        longitude: l.coords.longitude,
      }))
    );
  });
}

function elapsedSeconds(): number {
  if (!session) return 0;
  const end = session.state === "paused" && session.pausedAt ? session.pausedAt : Date.now();
  return Math.max(0, Math.floor((end - session.startedAt - session.pausedMs) / 1000));
}

export function getSnapshot(): TrackingSnapshot {
  return {
    state: session?.state ?? "idle",
    coords: session ? session.coords.slice() : [],
    distanceKm: session?.distanceKm ?? 0,
    seconds: elapsedSeconds(),
  };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isTracking(): boolean {
  return session !== null;
}

async function safeStop() {
  if (Platform.OS === "web") return;
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {}
}

async function safeStart() {
  if (Platform.OS === "web") return;
  await safeStop();
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, LOCATION_OPTIONS);
}

export type PermissionResult = "granted" | "denied";

export async function startTracking(): Promise<PermissionResult> {
  if (Platform.OS !== "web") {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return "denied";
    // Background permission lets recording continue when the app is not in the
    // foreground. Denial is non-fatal: the foreground service still records
    // while the app is open.
    try {
      await Location.requestBackgroundPermissionsAsync();
    } catch {}
  }

  const now = Date.now();
  session = {
    state: "tracking",
    coords: [],
    distanceKm: 0,
    startedAt: now,
    pausedMs: 0,
    pausedAt: null,
  };
  persist();
  emit();

  try {
    await safeStart();
  } catch {}
  return "granted";
}

export async function pauseTracking(): Promise<void> {
  if (!session) return;
  session.state = "paused";
  session.pausedAt = Date.now();
  persist();
  emit();
  await safeStop();
}

export async function resumeTracking(): Promise<void> {
  if (!session) return;
  if (session.pausedAt) {
    session.pausedMs += Date.now() - session.pausedAt;
    session.pausedAt = null;
  }
  session.state = "tracking";
  persist();
  emit();
  try {
    await safeStart();
  } catch {}
}

export async function finishTracking(): Promise<{
  coords: LatLng[];
  distanceKm: number;
  seconds: number;
}> {
  const result = session
    ? { coords: session.coords.slice(), distanceKm: session.distanceKm, seconds: elapsedSeconds() }
    : { coords: [], distanceKm: 0, seconds: 0 };
  await safeStop();
  session = null;
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  emit();
  return result;
}

export async function discardTracking(): Promise<void> {
  await safeStop();
  session = null;
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  emit();
}

/** Recover an in-progress run after the app was killed/relaunched mid-session. */
export async function restoreSession(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    session = JSON.parse(raw) as ActiveSession;
    if (session?.state === "tracking" && Platform.OS !== "web") {
      const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
        () => false
      );
      if (!running) {
        try {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, LOCATION_OPTIONS);
        } catch {}
      }
    }
    emit();
    return session !== null;
  } catch {
    return false;
  }
}
