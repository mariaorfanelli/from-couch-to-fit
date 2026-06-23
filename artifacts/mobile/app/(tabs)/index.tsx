import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyActivitiesIllustration } from "@/components/Illustrations";
import { Activity, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACTIVITY_LABELS: Record<Activity["type"], string> = {
  run: "Run",
  walk: "Walk",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength",
};

const ACTIVITY_ICONS: Record<Activity["type"], string> = {
  run: "wind",
  walk: "navigation",
  pilates: "activity",
  yoga: "heart",
  strength: "zap",
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRecommendation(goal: { targetDistanceKm: number; targetDate: string } | null): string {
  if (!goal) return "Set a goal to get personalized daily workout suggestions.";
  const days = daysUntil(goal.targetDate);
  if (days <= 0) return "Your goal date has passed. Set a new one to keep building momentum!";
  const km = Math.round(goal.targetDistanceKm * 0.35 * 10) / 10;
  return `${km}km easy-pace run — you have ${days} day${days !== 1 ? "s" : ""} to reach your ${goal.targetDistanceKm}km goal.`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, activeGoal, activities, weeklyKm, weeklyActivities, weeklyMinutes } = useApp();

  const recentActivities = useMemo(() => activities.slice(0, 4), [activities]);
  const recommendation = useMemo(() => getRecommendation(activeGoal), [activeGoal]);

  const goalProgress = useMemo(() => {
    if (!activeGoal || activeGoal.targetDistanceKm === 0) return 0;
    return Math.min(weeklyKm / (activeGoal.targetDistanceKm * 0.4), 1);
  }, [activeGoal, weeklyKm]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const shadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {user?.name ?? "Friend"}
          </Text>
        </View>
        <Pressable
          style={[styles.avatarButton, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={[styles.avatarInitial, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {(user?.name ?? "F")[0].toUpperCase()}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.statsRow}>
        {[
          { label: "This week", value: weeklyKm.toFixed(1), unit: "km" },
          { label: "Activities", value: String(weeklyActivities), unit: "" },
          { label: "Minutes", value: String(weeklyMinutes), unit: "min" },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
          >
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {stat.value}
              {stat.unit ? (
                <Text style={[styles.statUnit, { color: colors.mutedForeground }]}> {stat.unit}</Text>
              ) : null}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </Animated.View>

      {activeGoal && (
        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
        >
          <View style={styles.goalTop}>
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Current Goal
              </Text>
              <Text style={[styles.goalEvent, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {activeGoal.targetEvent}
              </Text>
            </View>
            <View style={[styles.daysBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.daysCount, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                {Math.max(0, daysUntil(activeGoal.targetDate))}
              </Text>
              <Text style={[styles.daysWord, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                days
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Weekly progress
            </Text>
            <Text style={[styles.progressPct, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              {Math.round(goalProgress * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${Math.round(goalProgress * 100)}%` as any },
              ]}
            />
          </View>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(180).duration(400)}
        style={[
          styles.suggestionCard,
          { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, ...shadow },
        ]}
      >
        <View style={styles.suggestionHeader}>
          <View style={[styles.suggestionDot, { backgroundColor: colors.secondary }]}>
            <Feather name="zap" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.suggestionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Next Recommended Workout
          </Text>
        </View>
        <Text style={[styles.suggestionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {recommendation}
        </Text>
        <Pressable
          style={[styles.logButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/log");
          }}
        >
          <Text style={[styles.logButtonText, { fontFamily: "Inter_600SemiBold" }]}>
            Log activity
          </Text>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Recent Activities
          </Text>
        </View>

        {recentActivities.length > 0 ? (
          <View
            style={[
              styles.activitiesCard,
              { backgroundColor: colors.card, borderColor: colors.border, ...shadow },
            ]}
          >
            {recentActivities.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInRight.delay(280 + i * 50).duration(300)}
                style={[
                  styles.activityRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < recentActivities.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={ACTIVITY_ICONS[a.type] as any} size={16} color={colors.primary} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityType, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {ACTIVITY_LABELS[a.type]}
                  </Text>
                  <Text style={[styles.activityMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {formatDate(a.date)}
                    {a.distanceKm ? ` · ${a.distanceKm}km` : ""}
                    {` · ${a.durationMinutes}min`}
                  </Text>
                </View>
                <Text style={[styles.activityStat, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  {a.distanceKm ? `${a.distanceKm}km` : `${a.durationMinutes}m`}
                </Text>
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(280).duration(400)}
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
          >
            <EmptyActivitiesIllustration size={110} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Log your first workout to start seeing your progress here
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/log");
              }}
            >
              <Text style={[styles.emptyButtonText, { fontFamily: "Inter_600SemiBold" }]}>
                Log first activity
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 26 },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 17 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 19 },
  statUnit: { fontSize: 12 },
  statLabel: { fontSize: 11, marginTop: 3 },
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  goalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 12, marginBottom: 4 },
  goalEvent: { fontSize: 17 },
  daysBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  daysCount: { fontSize: 20 },
  daysWord: { fontSize: 11 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13 },
  progressPct: { fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  suggestionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 18,
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  suggestionDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: { fontSize: 15 },
  suggestionText: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  logButtonText: { fontSize: 13, color: "#FFFFFF" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17 },
  activitiesCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 14, marginBottom: 2 },
  activityMeta: { fontSize: 12 },
  activityStat: { fontSize: 15 },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: { fontSize: 14, color: "#FFFFFF" },
});
