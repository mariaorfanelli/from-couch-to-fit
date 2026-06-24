import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, ChevronLeft, FlaskConical, Play, Plus } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, gradient, radii, shadow1, shadow2 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import {
  Experiment,
  MOODS,
  completedDaysCount,
  dayDate,
  isExperimentReflected,
  todayDayIndex,
} from "@/lib/experiments";
import { useColors } from "@/hooks/useColors";

function dayWeekday(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function findSession(exp: Experiment, dayIndex: number) {
  return exp.sessions.find((s) => s.dayIndex === dayIndex);
}

export default function ExperimentsHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeExperiment, experiments, activities } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const exp = activeExperiment;
  const reflected = exp ? isExperimentReflected(exp) : false;

  // If the active experiment is fully done + reflected, send the user to wrap-up.
  useEffect(() => {
    if (exp && reflected) {
      router.replace({ pathname: "/experiments/wrapup", params: { id: exp.id } });
    }
  }, [exp?.id, reflected]);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          hitSlop={10}
        >
          <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.headerCap, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
          YOUR EXPERIMENT
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {exp ? <ActiveExperimentBody exp={exp} /> : <EmptyExperimentBody />}

        {experiments.filter((e) => e.id !== exp?.id).length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              PAST EXPERIMENTS
            </Text>
            <View style={{ gap: 10 }}>
              {experiments
                .filter((e) => e.id !== exp?.id)
                .map((e) => {
                  const done = completedDaysCount(e);
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => router.push({ pathname: "/experiments/wrapup", params: { id: e.id } })}
                      style={[
                        styles.pastRow,
                        { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 },
                      ]}
                    >
                      <View style={[styles.pastBadge, { backgroundColor: colors.secondary }]}>
                        <FlaskConical size={16} color={colors.primaryDeep} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pastTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
                          {e.title}
                        </Text>
                        <Text style={[styles.pastSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                          {done}/{e.durationDays} days · {e.status === "completed" ? "complete" : "archived"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActiveExperimentBody({ exp }: { exp: Experiment }) {
  const colors = useColors();
  const { activities } = useApp();
  const today = todayDayIndex(exp);
  const completed = completedDaysCount(exp);

  return (
    <>
      {/* Hero gradient card */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <LinearGradient
          colors={["#E9AEBB", "#D0859A"]}
          style={[styles.heroCard, shadow2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroOrnament} pointerEvents="none" />
          <View style={styles.heroTopRow}>
            <FlaskConical size={18} color="#FFFFFF" strokeWidth={1.8} />
            <Text style={[styles.heroCapt, { fontFamily: font.semibold }]}>
              EXPERIMENT · DAY {Math.min(completed + 1, exp.durationDays)} OF {exp.durationDays}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: font.semibold }]}>{exp.title}</Text>
          {exp.hypothesis ? (
            <Text style={[styles.heroHypothesis, { fontFamily: font.regular }]}>"{exp.hypothesis}"</Text>
          ) : null}
          <View style={styles.heroProgress}>
            {Array.from({ length: exp.durationDays }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.heroSeg,
                  { backgroundColor: i < completed ? "#FFFFFF" : "rgba(255,255,255,0.32)" },
                ]}
              />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Day list */}
      <View style={{ marginTop: 24, gap: 10 }}>
        {Array.from({ length: exp.durationDays }).map((_, dayIndex) => {
          const session = findSession(exp, dayIndex);
          const date = dayDate(exp, dayIndex);
          const isToday = dayIndex === today;
          const isPast = today != null && dayIndex < today;
          const done = !!session?.activityId;

          if (done) {
            const activity = activities.find((a) => a.id === session!.activityId);
            return (
              <View
                key={dayIndex}
                style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.doneRow}>
                  <View style={[styles.doneCheck, { backgroundColor: "#EDF1EB" }]}>
                    <Check size={18} color="#8AA083" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
                      Day {dayIndex + 1}
                      {activity?.distanceKm ? ` · ${activity.distanceKm.toFixed(2)} km` : ""}
                    </Text>
                    <Text style={[styles.dayMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                      {dayWeekday(date)}
                      {activity?.pace ? ` · ${activity.pace}` : ""}
                    </Text>
                  </View>
                  {typeof session?.mood === "number" ? (
                    <Text style={styles.moodEmoji}>{MOODS[session!.mood!].emoji}</Text>
                  ) : null}
                </View>
                {session?.note ? (
                  <Text
                    style={[
                      styles.noteBubble,
                      { backgroundColor: colors.cardAlt, color: colors.secondaryText, fontFamily: font.regular },
                    ]}
                  >
                    "{session.note}"
                  </Text>
                ) : null}
              </View>
            );
          }

          if (isToday) {
            return (
              <Pressable
                key={dayIndex}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/(tabs)/log",
                    params: {
                      preset: exp.activityType,
                      experimentId: exp.id,
                      dayIndex: String(dayIndex),
                    },
                  });
                }}
                style={[styles.todayCard, { backgroundColor: colors.blushTint, borderColor: colors.inputFocus }]}
              >
                <View style={[styles.todayBadge, { backgroundColor: colors.card, borderColor: colors.blush200 }]}>
                  <Text style={[styles.todayBadgeText, { color: colors.primaryDeep, fontFamily: font.bold }]}>
                    {dayIndex + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayTitle, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
                    Today's session
                  </Text>
                  <Text style={[styles.todaySub, { color: "#C58A98", fontFamily: font.regular }]}>
                    {exp.targetPerDayKm ? `${exp.targetPerDayKm} km` : "A small step"} · then jot how it felt
                  </Text>
                </View>
                <View style={[styles.startPill, { backgroundColor: colors.primary }]}>
                  <Play size={14} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />
                  <Text style={[styles.startPillText, { fontFamily: font.semibold }]}>Start</Text>
                </View>
              </Pressable>
            );
          }

          // Past missed OR upcoming
          return (
            <View key={dayIndex} style={[styles.upcomingRow, { opacity: isPast ? 0.5 : 0.55 }]}>
              <View style={[styles.upcomingBadge, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.upcomingBadgeText, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
                  {dayIndex + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dayTitle, { color: colors.secondaryText, fontFamily: font.semibold }]}>
                  {dayIndex === exp.durationDays - 1 ? `Day ${dayIndex + 1} · final` : `Day ${dayIndex + 1}`}
                </Text>
                <Text style={[styles.dayMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                  {dayWeekday(date)} · {isPast ? "missed" : "upcoming"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function EmptyExperimentBody() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.emptyCard,
        { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 },
      ]}
    >
      <View style={[styles.emptyIcon, { borderColor: colors.blush200 }]}>
        <FlaskConical size={38} color={colors.primaryDeep} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: font.display }]}>
        A tiny experiment
      </Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
        A small, time-boxed promise to yourself — five days of something gentle. No pass or fail, only
        noticing.
      </Text>
      <View style={{ alignSelf: "stretch", paddingHorizontal: 8, marginTop: 8 }}>
        <GradientButton
          label="Start an experiment"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/experiments/new");
          }}
          leadingIcon={<Plus size={18} color="#FFFFFF" strokeWidth={2} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCap: { fontSize: 12, letterSpacing: 1.2 },

  heroCard: { borderRadius: 24, padding: 22, overflow: "hidden", position: "relative" },
  heroOrnament: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  heroCapt: { fontSize: 12, letterSpacing: 0.8, color: "rgba(255,255,255,0.95)" },
  heroTitle: { fontSize: 22, color: "#FFFFFF", lineHeight: 28, marginBottom: 8 },
  heroHypothesis: { fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 19 },
  heroProgress: { flexDirection: "row", gap: 6, marginTop: 18 },
  heroSeg: { flex: 1, height: 6, borderRadius: 999 },

  doneCard: { borderRadius: 18, borderWidth: 1, padding: 15 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  doneCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitle: { fontSize: 15, marginBottom: 2 },
  dayMeta: { fontSize: 12 },
  moodEmoji: { fontSize: 22 },
  noteBubble: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  todayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBadgeText: { fontSize: 14 },
  todaySub: { fontSize: 12, marginTop: 2 },
  startPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  startPillText: { fontSize: 13, color: "#FFFFFF" },

  upcomingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  upcomingBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  upcomingBadgeText: { fontSize: 14 },

  emptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: { fontSize: 22, letterSpacing: -0.2 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, paddingHorizontal: 6 },

  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  pastRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radii.lg, borderWidth: 1, padding: 14 },
  pastBadge: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  pastTitle: { fontSize: 14, marginBottom: 2 },
  pastSub: { fontSize: 12 },
});
