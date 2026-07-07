import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, ChevronRight, FlaskConical, LogOut, Minus, Pencil, TrendingDown, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { font, radii, shadow1 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { formatPaceSec, paceTrend, weekOverWeek } from "@/lib/stats";
import { useColors } from "@/hooks/useColors";

const TYPE_LABELS: Record<string, string> = {
  run: "Runs",
  walk: "Walks",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength",
};

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.semibold }]}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, totalKm, totalActivities, weeklyKm, monthlyKm, activities, updateName, currentStreakDays, experiments } = useApp();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalMinutes = activities.reduce((s, a) => s + a.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const breakdown: Record<string, number> = {};
  for (const a of activities) {
    breakdown[a.type] = (breakdown[a.type] ?? 0) + 1;
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
        },
      },
    ]);
  }

  async function saveName() {
    await updateName(nameInput);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 14, paddingBottom: Platform.OS === "web" ? 130 : 130 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: font.display }]}>
          You
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(60).duration(400)}
        style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
            {initials(user?.name ?? "F")}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: colors.cardAlt, borderColor: colors.inputFocus, color: colors.foreground, fontFamily: font.semibold }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Pressable style={[styles.saveNameBtn, { backgroundColor: colors.primary }]} onPress={saveName}>
              <Check size={17} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            onPress={() => {
              Haptics.selectionAsync();
              setNameInput(user?.name ?? "");
              setEditing(true);
            }}
          >
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: font.display }]}>
              {user?.name}
            </Text>
            <Pencil size={14} color={colors.mutedForeground} strokeWidth={1.5} />
          </Pressable>
        )}

        <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: font.regular }]}>
          {user?.email}
        </Text>

        {currentStreakDays > 1 && (
          <View style={[styles.streakPill, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.streakText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
              🌸 {currentStreakDays}-day streak
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(400)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          Lifetime
        </Text>
        <StatRow label="Total distance" value={`${totalKm.toFixed(1)} km`} />
        <StatRow label="Total activities" value={String(totalActivities)} />
        <StatRow label="Total time" value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} />
        <StatRow label="This week" value={`${weeklyKm.toFixed(1)} km`} />
        <StatRow label="This month" value={`${monthlyKm.toFixed(1)} km`} />
      </Animated.View>

      {activities.length >= 2 && <ProgressCard />}

      {Object.keys(breakdown).length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
            By activity
          </Text>
          {Object.entries(breakdown).map(([type, count]) => (
            <View key={type} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>
                {TYPE_LABELS[type] ?? type}
              </Text>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.countPillText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
                  {count}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        <Pressable
          style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          onPress={() => router.push("/experiments")}
        >
          <View style={[styles.linkIcon, { backgroundColor: colors.secondary }]}>
            <FlaskConical size={18} color={colors.primaryDeep} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
              Experiments
            </Text>
            <Text style={[styles.linkSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              {experiments.length > 0
                ? `${experiments.length} experiment${experiments.length === 1 ? "" : "s"}`
                : "Try a small, time-boxed promise"}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={1.5} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Pressable
          style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          onPress={handleSignOut}
        >
          <LogOut size={18} color={colors.mutedForeground} strokeWidth={1.5} />
          <Text style={[styles.signOutText, { color: colors.mutedForeground, fontFamily: font.medium }]}>
            Sign out
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function ProgressCard() {
  const colors = useColors();
  const { activities } = useApp();
  const km = weekOverWeek(activities, (b) => b.km);
  const acts = weekOverWeek(activities, (b) => b.count);
  const pace = paceTrend(activities, "run");

  const rows: { label: string; dir: "up" | "down" | "flat"; text: string }[] = [
    {
      label: "Distance",
      dir: km.diff > 0.05 ? "up" : km.diff < -0.05 ? "down" : "flat",
      text:
        km.diff > 0.05 ? `+${km.diff.toFixed(1)} km this week` :
        km.diff < -0.05 ? `${km.diff.toFixed(1)} km this week` : "same as last week",
    },
    {
      label: "Sessions",
      dir: acts.diff > 0 ? "up" : acts.diff < 0 ? "down" : "flat",
      text:
        acts.diff > 0 ? `+${acts.diff} vs last week` :
        acts.diff < 0 ? `${acts.diff} vs last week` : "same as last week",
    },
    {
      label: "Running pace",
      dir: pace.dir === "improving" ? "up" : pace.dir === "easing" ? "down" : "flat",
      text:
        pace.dir === "improving" ? `${Math.abs(Math.round(pace.deltaSec))} s/km faster · ${formatPaceSec(pace.recentSec)}` :
        pace.dir === "easing" ? `${Math.abs(Math.round(pace.deltaSec))} s/km slower · ${formatPaceSec(pace.recentSec)}` :
        pace.recentSec ? `steady · ${formatPaceSec(pace.recentSec)}` : "log a few runs",
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(400)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
    >
      <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: font.semibold }]}>Are you improving?</Text>
      {rows.map((r, i) => {
        const color = r.dir === "up" ? "#8AA083" : r.dir === "down" ? "#C16E82" : "#9B8AA6";
        const Icon = r.dir === "up" ? TrendingUp : r.dir === "down" ? TrendingDown : Minus;
        return (
          <View key={r.label} style={[styles.progRow, { borderBottomColor: colors.border, borderBottomWidth: i < rows.length - 1 ? 1 : 0 }]}>
            <Text style={[styles.statLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>{r.label}</Text>
            <View style={styles.progRight}>
              <Icon size={14} color={color} strokeWidth={2} />
              <Text style={[styles.progText, { color, fontFamily: font.medium }]}>{r.text}</Text>
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 22 },
  screenTitle: { fontSize: 32, letterSpacing: -0.4, marginBottom: 18 },
  progRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  progRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  progText: { fontSize: 13 },

  profileCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 26 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  userName: { fontSize: 22 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, width: "100%" },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 18,
    textAlign: "center",
  },
  saveNameBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  userEmail: { fontSize: 13 },
  streakPill: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  streakText: { fontSize: 13 },

  card: { borderRadius: radii.lg, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 15, marginBottom: 8 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14 },

  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  countPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  countPillText: { fontSize: 13 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  linkIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  linkTitle: { fontSize: 15, marginBottom: 2 },
  linkSub: { fontSize: 13 },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 8,
  },
  signOutText: { fontSize: 15 },
});
