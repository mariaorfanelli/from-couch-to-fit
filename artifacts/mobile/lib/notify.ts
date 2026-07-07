import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { PHASE_META, type FlatPhase } from "@/lib/intervals";

/**
 * Local notifications for interval workouts — a buzz + banner at every phase
 * change so cues land even with the screen off / phone in a pocket.
 */

let configured = false;

async function ensureConfigured() {
  if (configured || Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("intervals", {
      name: "Interval cues",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 120, 250],
      sound: "default",
    });
  }
  configured = true;
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  await ensureConfigured();
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/** Schedule a cue for the start of each upcoming phase (seconds from now). */
export async function scheduleIntervalCues(boundaries: { atSec: number; phase: FlatPhase }[]): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureConfigured();
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  for (const b of boundaries) {
    if (b.atSec <= 0) continue;
    const meta = PHASE_META[b.phase.type];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${meta.emoji} ${meta.verb}`,
        body: b.phase.label + (b.phase.repTotal ? ` · ${b.phase.repIndex}/${b.phase.repTotal}` : ""),
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(b.atSec),
        channelId: "intervals",
      },
    }).catch(() => {});
  }
}

export async function cancelIntervalCues(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/** Notify that the whole interval workout is complete. */
export async function notifyIntervalDone(): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureConfigured();
  await Notifications.scheduleNotificationAsync({
    content: { title: "🌸 Beautifully done", body: "Your interval session is complete.", sound: "default" },
    trigger: null,
  }).catch(() => {});
}
