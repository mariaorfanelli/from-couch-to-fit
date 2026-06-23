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
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Activity, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getActivityLabel(type: Activity["type"]): string {
  const labels: Record<Activity["type"], string> = {
    run: "Run",
    walk: "Walk",
    pilates: "Pilates",
    yoga: "Yoga",
    strength: "Strength",
  };
  return labels[type];
}

function getActivityIcon(type: Activity["type"]): string {
  const icons: Record<Activity["type"], string> = {
    run: "wind",
    walk: "navigation",
    pilates: "activity",
    yoga: "heart",
    strength: "zap",
  };
  return icons[type] as any;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRecommendation(goal: { targetDistanceKm: number; targetDate: string } | null, weeklyKm: number): string {
  if (!goal) return "Log your first activity to get personalized suggestions.";
  const days = daysUntil(goal.targetDate);
  const target = goal.targetDistanceKm;
  if (days <= 0) return "Your goal date has passed. Set a new goal to keep progressing!";
  const weeklyTarget = target * 0.4;
  const todaySuggestion = Math.min(weeklyTarget * 0.4, target * 0.6);
  const km = Math.round(todaySuggestion * 10) / 10;
  if (km < 0.5) return `Easy ${Math.round(goal.targetDistanceKm * 0.3 * 10) / 10}km walk — stay active and loose.`;
  return `${km}km easy-pace run — you have ${days} day${days !== 1 ? "s" : ""} until your ${target}km goal.`;
}

function StatPill({ label, value, unit }: { label: string; value: string; unit: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {value}
        <Text style={[styles.statUnit, { color: colors.mutedForeground }]}> {unit}</Text>
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const colors = useColors();
  return (
    <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.activityIcon, { backgroundColor: colors.muted }]}>
        <Feather name={getActivityIcon(activity.type) as any} size={16} color={colors.accent} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={[styles.activityType, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {getActivityLabel(activity.type)}
        </Text>
        <Text style={[styles.activityMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {formatDate(activity.date)}
          {activity.distanceKm ? ` · ${activity.distanceKm}km` : ""}
          {` · ${activity.durationMinutes}min`}
        </Text>
      </View>
      {activity.distanceKm ? (
        <Text style={[styles.activityKm, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          {activity.distanceKm}km
        </Text>
      ) : (
        <Text style={[styles.activityKm, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {activity.durationMinutes}m
        </Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, activeGoal, activities, weeklyKm, weeklyActivities, weeklyMinutes } = useApp();

  const recentActivities = useMemo(() => activities.slice(0, 5), [activities]);
  const recommendation = useMemo(
    () => getRecommendation(activeGoal, weeklyKm),
    [activeGoal, weeklyKm]
  );

  const goalProgress = useMemo(() => {
    if (!activeGoal) return 0;
    const progress = Math.min(weeklyKm / (activeGoal.targetDistanceKm * 0.4), 1);
    return progress;
  }, [activeGoal, weeklyKm]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {getGreeting()},
        </Text>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {user.name}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsRow}>
        <StatPill label="This week" value={weeklyKm.toFixed(1)} unit="km" />
        <StatPill label="Activities" value={String(weeklyActivities)} unit="" />
        <StatPill label="Minutes" value={String(weeklyMinutes)} unit="min" />
      </Animated.View>

      {activeGoal && (
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.goalHeader}>
            <View>
              <Text style={[styles.goalTitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Current Goal
              </Text>
              <Text style={[styles.goalEvent, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {activeGoal.targetEvent}
              </Text>
            </View>
            <View style={[styles.goalBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.goalDays, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                {Math.max(0, daysUntil(activeGoal.targetDate))}
              </Text>
              <Text style={[styles.goalDaysLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                days
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Weekly progress
              </Text>
              <Text style={[styles.progressText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {Math.round(goalProgress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(goalProgress * 100)}%` as any,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(240).duration(400)}
        style={[styles.suggestionCard, { backgroundColor: colors.accent }]}
      >
        <View style={styles.suggestionHeader}>
          <Feather name="zap" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={[styles.suggestionLabel, { fontFamily: "Inter_500Medium" }]}>
            Next Recommended Workout
          </Text>
        </View>
        <Text style={[styles.suggestionText, { fontFamily: "Inter_400Regular" }]}>
          {recommendation}
        </Text>
        <Pressable
          style={styles.logButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/log");
          }}
        >
          <Text style={[styles.logButtonText, { fontFamily: "Inter_600SemiBold" }]}>
            Log activity
          </Text>
          <Feather name="arrow-right" size={14} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {recentActivities.length > 0 && (
        <Animated.View entering={FadeInDown.delay(320).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Recent Activities
            </Text>
            <Pressable onPress={() => {}}>
              <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                See all
              </Text>
            </Pressable>
          </View>
          <View style={[styles.activitiesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recentActivities.map((a, i) => (
              <Animated.View key={a.id} entering={FadeInRight.delay(360 + i * 50).duration(300)}>
                <ActivityRow activity={a} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}

      {recentActivities.length === 0 && (
        <Animated.View
          entering={FadeInDown.delay(320).duration(400)}
          style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="activity" size={32} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            No activities yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Start logging your workouts to track your progress
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  greeting: { fontSize: 15, marginBottom: 2 },
  name: { fontSize: 28, marginBottom: 24 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 20 },
  statUnit: { fontSize: 13 },
  statLabel: { fontSize: 11, marginTop: 2 },
  goalCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  goalTitle: { fontSize: 12, marginBottom: 4 },
  goalEvent: { fontSize: 17 },
  goalBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  goalDays: { fontSize: 22 },
  goalDaysLabel: { fontSize: 11 },
  progressSection: {},
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  suggestionCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  suggestionLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  suggestionText: { fontSize: 15, color: "#FFFFFF", lineHeight: 22, marginBottom: 14 },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logButtonText: { fontSize: 13, color: "#7A4E8C" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17 },
  seeAll: { fontSize: 14 },
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
    borderBottomWidth: 1,
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
  activityKm: { fontSize: 15 },
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
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: { fontSize: 14, color: "#FFFFFF" },
});
