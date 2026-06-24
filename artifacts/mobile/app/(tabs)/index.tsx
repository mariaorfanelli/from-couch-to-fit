import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Activity as ActivityIcon,
  ChevronRight,
  Dumbbell,
  FlaskConical,
  Flower2,
  Footprints,
  Heart,
  Play,
  Route as RouteIcon,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyActivitiesIllustration } from "@/components/Illustrations";
import { font, radii, shadow1, shadow2 } from "@/constants/theme";
import { Activity, useApp } from "@/context/AppContext";
import { completedDaysCount, todayDayIndex } from "@/lib/experiments";
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

const ACTIVITY_ICONS: Record<Activity["type"], any> = {
  run: RouteIcon,
  walk: Footprints,
  pilates: Flower2,
  yoga: Heart,
  strength: Dumbbell,
};

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function nextRecommended(preferred: Activity["type"][], hasExperiment: boolean) {
  // Match the mockup's "Gentle Pilates flow · 20 min · restorative · no pressure" vibe,
  // tailoring the suggestion to the user's preferences when available.
  const pool = [
    { type: "pilates" as const, title: "Gentle Pilates flow", duration: "20 min", tag: "restorative · no pressure", icon: Flower2 },
    { type: "walk" as const, title: "Mindful evening walk", duration: "25 min", tag: "outdoors · soft pace", icon: Footprints },
    { type: "yoga" as const, title: "Restorative yoga", duration: "30 min", tag: "calming · slow breath", icon: Heart },
    { type: "run" as const, title: "Easy-pace short run", duration: "15 min", tag: "warm-up · low effort", icon: RouteIcon },
    { type: "strength" as const, title: "Mobility & strength", duration: "20 min", tag: "gentle reps · no weights", icon: Dumbbell },
  ];
  if (preferred.length > 0) {
    const match = pool.find((p) => preferred.includes(p.type));
    if (match) return match;
  }
  if (hasExperiment) return pool[3];
  return pool[0];
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, activeExperiment, activities, weeklyKm, weeklyActivities, preferredActivities } = useApp();

  const recentActivities = useMemo(() => activities.slice(0, 3), [activities]);
  const recommendation = useMemo(
    () => nextRecommended(preferredActivities, !!activeExperiment),
    [preferredActivities, activeExperiment]
  );
  const RecIcon = recommendation.icon;

  const expDone = activeExperiment ? completedDaysCount(activeExperiment) : 0;
  const expToday = activeExperiment ? todayDayIndex(activeExperiment) : null;
  const expProgress = activeExperiment ? expDone / activeExperiment.durationDays : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const firstName = (user?.name ?? "Friend").split(" ")[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 14, paddingBottom: Platform.OS === "web" ? 120 : 130 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.headerRow}>
        <View>
          <Text style={[styles.dateLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
            {formatLongDate()}
          </Text>
          <Text style={[styles.greeting, { color: colors.foreground, fontFamily: font.display }]}>
            {getGreeting()},{"\n"}
            {firstName} 🌸
          </Text>
        </View>
        <Pressable
          style={[styles.avatar, { backgroundColor: colors.blush200, borderColor: colors.rose300 }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={[styles.avatarText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
            {firstName[0].toUpperCase()}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Section title */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          This week's movement
        </Text>
        <Pressable
          style={styles.sectionLink}
          onPress={() => router.push("/(tabs)/activities")}
        >
          <Text style={[styles.sectionLinkText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>Details</Text>
          <ChevronRight size={15} color={colors.primaryDeep} strokeWidth={1.5} />
        </Pressable>
      </Animated.View>

      {/* Weekly stat cards */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
          <RouteIcon size={20} color={colors.primaryDeep} strokeWidth={1.5} />
          <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.displayLight }]}>
            {weeklyKm.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
            km this week
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
          <ActivityIcon size={20} color={colors.plum} strokeWidth={1.5} />
          <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.displayLight }]}>
            {weeklyActivities}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
            activities
          </Text>
        </View>
      </Animated.View>

      {/* Active experiment — gradient hero card */}
      {activeExperiment ? (
        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          <Pressable onPress={() => router.push("/experiments")}>
            <LinearGradient
              colors={["#E9AEBB", "#D0859A"]}
              style={[styles.goalCard, shadow2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.goalOrnament} pointerEvents="none" />
              <View style={styles.goalTopRow}>
                <FlaskConical size={18} color="#FFFFFF" strokeWidth={1.8} />
                <Text style={[styles.goalCapt, { fontFamily: font.semibold }]}>
                  EXPERIMENT · DAY {Math.min(expDone + 1, activeExperiment.durationDays)} OF {activeExperiment.durationDays}
                </Text>
              </View>
              <Text style={[styles.goalTitle, { fontFamily: font.semibold }]}>{activeExperiment.title}</Text>
              <Text style={[styles.goalSub, { fontFamily: font.regular }]}>
                {expToday != null
                  ? "Today's tiny step is waiting — tap to begin."
                  : expDone >= activeExperiment.durationDays
                  ? "All done — open it to wrap up."
                  : "Pick it back up whenever you're ready."}
              </Text>
              <View style={styles.expProgress}>
                {Array.from({ length: activeExperiment.durationDays }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.expSeg,
                      { backgroundColor: i < expDone ? "#FFFFFF" : "rgba(255,255,255,0.32)" },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.goalPct, { fontFamily: font.medium }]}>
                {Math.round(expProgress * 100)}% complete
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          <Pressable
            style={[styles.setGoalCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
            onPress={() => router.push("/experiments/new")}
          >
            <View style={[styles.setGoalIcon, { backgroundColor: colors.secondary }]}>
              <FlaskConical size={20} color={colors.primaryDeep} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.setGoalTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
                Start a tiny experiment
              </Text>
              <Text style={[styles.setGoalSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                A small, time-boxed promise to yourself
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={1.5} />
          </Pressable>
        </Animated.View>
      )}

      {/* Recommended */}
      <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.recommendedHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          Next recommended for you
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(220).duration(400)}>
        <Pressable
          style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow2 }]}
          onPress={() => router.push("/(tabs)/log")}
        >
          <View style={[styles.recIcon, { backgroundColor: colors.cardAlt }]}>
            <RecIcon size={26} color={colors.plum} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
              {recommendation.title}
            </Text>
            <Text style={[styles.recMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              {recommendation.duration} · {recommendation.tag}
            </Text>
          </View>
          <View style={[styles.playBubble, { backgroundColor: colors.blushTint }]}>
            <Play size={17} color={colors.primaryDeep} strokeWidth={2} fill={colors.primaryDeep} />
          </View>
        </Pressable>
      </Animated.View>

      {/* Recent */}
      <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          Recent activities
        </Text>
        {activities.length > 0 && (
          <Pressable
            style={styles.sectionLink}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/activities");
            }}
          >
            <Text style={[styles.sectionLinkText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>See all</Text>
            <ChevronRight size={15} color={colors.primaryDeep} strokeWidth={1.5} />
          </Pressable>
        )}
      </Animated.View>

      {recentActivities.length > 0 ? (
        <View style={[styles.activitiesCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
          {recentActivities.map((a, i) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <Animated.View key={a.id} entering={FadeInRight.delay(300 + i * 50).duration(300)}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({ pathname: "/activity/[id]", params: { id: a.id } });
                  }}
                  style={[
                    styles.activityRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: i < recentActivities.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
                    <Icon size={16} color={colors.primaryDeep} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityType, { color: colors.foreground, fontFamily: font.semibold }]}>
                      {ACTIVITY_LABELS[a.type]}
                    </Text>
                    <Text style={[styles.activityMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                      {formatDateShort(a.date)}
                      {a.distanceKm ? ` · ${a.distanceKm}km` : ""}
                      {` · ${a.durationMinutes}min`}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
          <EmptyActivitiesIllustration size={110} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
            No activities yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            Log your first workout to start seeing your progress here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 22 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 },
  dateLabel: { fontSize: 14, marginBottom: 4 },
  greeting: { fontSize: 30, lineHeight: 34, letterSpacing: -0.3 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17 },
  sectionLink: { flexDirection: "row", alignItems: "center", gap: 3 },
  sectionLinkText: { fontSize: 13 },

  statRow: { flexDirection: "row", gap: 12, marginBottom: 26 },
  statCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  statValue: { fontSize: 34, letterSpacing: -0.5, lineHeight: 34, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12 },

  goalCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 26,
    overflow: "hidden",
    position: "relative",
  },
  goalOrnament: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  goalTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  goalCapt: { fontSize: 12, letterSpacing: 1, color: "rgba(255,255,255,0.9)" },
  goalTitle: { fontSize: 21, color: "#FFFFFF", marginBottom: 4 },
  goalSub: { fontSize: 13, color: "rgba(255,255,255,0.88)", marginBottom: 14 },
  expProgress: { flexDirection: "row", gap: 6, marginVertical: 4 },
  expSeg: { flex: 1, height: 6, borderRadius: 999 },
  goalPct: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 8 },

  setGoalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 26,
  },
  setGoalIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  setGoalTitle: { fontSize: 16 },
  setGoalSub: { fontSize: 13, marginTop: 2 },

  recommendedHeader: { marginBottom: 14 },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 26,
  },
  recIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  recTitle: { fontSize: 16, marginBottom: 3 },
  recMeta: { fontSize: 13 },
  playBubble: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },

  activitiesCard: {
    borderRadius: radii.lg,
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
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityType: { fontSize: 14, marginBottom: 2 },
  activityMeta: { fontSize: 12 },

  emptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
