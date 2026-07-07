import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Check,
  ChevronLeft,
  FlaskConical,
  Play,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1, shadow2 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import {
  Experiment,
  MOODS,
  PlanDay,
  completedDaysCount,
  dayDate,
  isExpired,
  isExperimentReflected,
  isPlan,
  planTargetLabel,
  todayDayIndex,
} from "@/lib/experiments";
import { summarize } from "@/lib/intervals";
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
  const { activeExperiment, experiments, deleteExperiment } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const exp = activeExperiment;
  const reflected = exp ? isExperimentReflected(exp) : false;
  const expired = exp ? isExpired(exp) : false;

  // If the active experiment is fully done + reflected, send the user to wrap-up.
  useEffect(() => {
    if (exp && reflected) {
      router.replace({ pathname: "/experiments/wrapup", params: { id: exp.id } });
    }
  }, [exp?.id, reflected]);

  function confirmDelete(id: string, title: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete", `Remove "${title}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExperiment(id) },
    ]);
  }

  const past = experiments.filter((e) => e.id !== exp?.id);

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
          {exp ? (isPlan(exp) ? "YOUR PLAN" : "YOUR EXPERIMENT") : "EXPERIMENTS & PLANS"}
        </Text>
        {exp ? (
          <Pressable
            onPress={() => confirmDelete(exp.id, exp.title)}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
            hitSlop={10}
          >
            <Trash2 size={18} color={colors.mutedForeground} strokeWidth={1.5} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {expired && exp && <ExpiredBanner exp={exp} onDelete={() => confirmDelete(exp.id, exp.title)} />}

        {exp ? (
          isPlan(exp) ? <ActivePlanBody exp={exp} /> : <ActiveExperimentBody exp={exp} />
        ) : (
          <EmptyBody />
        )}

        {past.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              PAST
            </Text>
            <View style={{ gap: 10 }}>
              {past.map((e) => {
                const done = completedDaysCount(e);
                return (
                  <View
                    key={e.id}
                    style={[styles.pastRow, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
                  >
                    <Pressable
                      style={styles.pastMain}
                      onPress={() => router.push({ pathname: "/experiments/wrapup", params: { id: e.id } })}
                    >
                      <View style={[styles.pastBadge, { backgroundColor: colors.secondary }]}>
                        {isPlan(e) ? (
                          <Target size={16} color={colors.primaryDeep} strokeWidth={1.5} />
                        ) : (
                          <FlaskConical size={16} color={colors.primaryDeep} strokeWidth={1.5} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pastTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
                          {e.title}
                        </Text>
                        <Text style={[styles.pastSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                          {done}/{e.durationDays} days · {e.status === "completed" ? "complete" : "ended"}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(e.id, e.title)} hitSlop={8} style={styles.pastDelete}>
                      <Trash2 size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ExpiredBanner({ exp, onDelete }: { exp: Experiment; onDelete: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.expired, { backgroundColor: colors.card, borderColor: colors.blush200, ...shadow1 }]}>
      <Text style={[styles.expiredTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
        This one has wrapped up 🌸
      </Text>
      <Text style={[styles.expiredSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
        Its window has passed. Reflect on how it went, or clear it to start fresh.
      </Text>
      <View style={styles.expiredActions}>
        <Pressable
          style={[styles.expiredBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/experiments/wrapup", params: { id: exp.id } })}
        >
          <Text style={[styles.expiredBtnText, { fontFamily: font.semibold }]}>Finish & reflect</Text>
        </Pressable>
        <Pressable style={[styles.expiredGhost, { borderColor: colors.border }]} onPress={onDelete}>
          <Text style={[styles.expiredGhostText, { color: colors.mutedForeground, fontFamily: font.medium }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── AI plan body ─────────────────────────────────────────────────────────────

function ActivePlanBody({ exp }: { exp: Experiment }) {
  const colors = useColors();
  const { activities } = useApp();
  const today = todayDayIndex(exp);
  const days = exp.days ?? [];
  const doneCount = exp.sessions.filter((s) => s.activityId).length;

  return (
    <>
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <LinearGradient colors={["#E9AEBB", "#D0859A"]} style={[styles.heroCard, shadow2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroOrnament} pointerEvents="none" />
          <View style={styles.heroTopRow}>
            <Target size={18} color="#FFFFFF" strokeWidth={1.8} />
            <Text style={[styles.heroCapt, { fontFamily: font.semibold }]}>
              PLAN · {exp.durationDays / 7} WEEKS
            </Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: font.semibold }]}>{exp.title}</Text>
          {exp.target ? (
            <Text style={[styles.heroHypothesis, { fontFamily: font.regular }]}>{planTargetLabel(exp.target)}</Text>
          ) : null}
          <Text style={[styles.heroHypothesis, { fontFamily: font.regular, marginTop: 6 }]}>
            {doneCount} of {days.length} sessions done
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={{ marginTop: 24, gap: 10 }}>
        {days.map((d) => {
          const session = findSession(exp, d.dayIndex);
          const done = !!session?.activityId;
          const isToday = d.dayIndex === today;
          const activity = done ? activities.find((a) => a.id === session!.activityId) : undefined;
          return (
            <PlanDayCard
              key={d.dayIndex}
              day={d}
              done={done}
              isToday={isToday}
              activityDistance={activity?.distanceKm}
              onStart={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/(tabs)/log",
                  params: {
                    preset: d.activityType,
                    experimentId: exp.id,
                    dayIndex: String(d.dayIndex),
                    mode: d.interval ? "interval" : "gps",
                    interval: d.interval ? JSON.stringify(d.interval) : undefined,
                  },
                });
              }}
            />
          );
        })}
      </View>
    </>
  );
}

function PlanDayCard({
  day,
  done,
  isToday,
  activityDistance,
  onStart,
}: {
  day: PlanDay;
  done: boolean;
  isToday: boolean;
  activityDistance?: number;
  onStart: () => void;
}) {
  const colors = useColors();

  if (done) {
    return (
      <View style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.doneRow}>
          <View style={[styles.doneCheck, { backgroundColor: "#EDF1EB" }]}>
            <Check size={18} color="#8AA083" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dayTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
              {day.label}
              {activityDistance ? ` · ${activityDistance.toFixed(2)} km` : ""}
            </Text>
            <Text style={[styles.dayMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>Done 🌸</Text>
          </View>
        </View>
      </View>
    );
  }

  if (isToday) {
    return (
      <Pressable onPress={onStart} style={[styles.todayCard, { backgroundColor: colors.blushTint, borderColor: colors.inputFocus }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.todayLabelRow}>
            <Text style={[styles.dayTitle, { color: colors.primaryDeep, fontFamily: font.semibold }]}>{day.label}</Text>
            {day.interval ? (
              <View style={styles.intervalTag}>
                <Repeat size={11} color={colors.primaryDeep} strokeWidth={2} />
                <Text style={[styles.intervalTagText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>Intervals</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.todaySub, { color: "#C58A98", fontFamily: font.regular }]}>{day.prescription}</Text>
          {day.interval ? (
            <Text style={[styles.todaySub, { color: "#C58A98", fontFamily: font.regular, marginTop: 2 }]}>
              {summarize(day.interval)}
            </Text>
          ) : null}
        </View>
        <View style={[styles.startPill, { backgroundColor: colors.primary }]}>
          <Play size={14} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />
          <Text style={[styles.startPillText, { fontFamily: font.semibold }]}>Start</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.planUpcoming, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.75 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.dayTitle, { color: colors.secondaryText, fontFamily: font.semibold }]}>{day.label}</Text>
        <Text style={[styles.dayMeta, { color: colors.mutedForeground, fontFamily: font.regular }]} numberOfLines={1}>
          {day.interval ? summarize(day.interval) : day.targetKm ? `${day.targetKm} km` : day.prescription}
        </Text>
      </View>
    </View>
  );
}

// ─── tiny-experiment body (unchanged behavior) ─────────────────────────────────

function ActiveExperimentBody({ exp }: { exp: Experiment }) {
  const colors = useColors();
  const { activities } = useApp();
  const today = todayDayIndex(exp);
  const completed = completedDaysCount(exp);

  return (
    <>
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <LinearGradient colors={["#E9AEBB", "#D0859A"]} style={[styles.heroCard, shadow2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroOrnament} pointerEvents="none" />
          <View style={styles.heroTopRow}>
            <FlaskConical size={18} color="#FFFFFF" strokeWidth={1.8} />
            <Text style={[styles.heroCapt, { fontFamily: font.semibold }]}>
              EXPERIMENT · DAY {Math.min(completed + 1, exp.durationDays)} OF {exp.durationDays}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: font.semibold }]}>{exp.title}</Text>
          {exp.hypothesis ? <Text style={[styles.heroHypothesis, { fontFamily: font.regular }]}>"{exp.hypothesis}"</Text> : null}
          <View style={styles.heroProgress}>
            {Array.from({ length: exp.durationDays }).map((_, i) => (
              <View key={i} style={[styles.heroSeg, { backgroundColor: i < completed ? "#FFFFFF" : "rgba(255,255,255,0.32)" }]} />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

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
              <View key={dayIndex} style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                  {typeof session?.mood === "number" ? <Text style={styles.moodEmoji}>{MOODS[session!.mood!].emoji}</Text> : null}
                </View>
                {session?.note ? (
                  <Text style={[styles.noteBubble, { backgroundColor: colors.cardAlt, color: colors.secondaryText, fontFamily: font.regular }]}>
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
                    params: { preset: exp.activityType, experimentId: exp.id, dayIndex: String(dayIndex) },
                  });
                }}
                style={[styles.todayCard, { backgroundColor: colors.blushTint, borderColor: colors.inputFocus }]}
              >
                <View style={[styles.todayBadge, { backgroundColor: colors.card, borderColor: colors.blush200 }]}>
                  <Text style={[styles.todayBadgeText, { color: colors.primaryDeep, fontFamily: font.bold }]}>{dayIndex + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayTitle, { color: colors.primaryDeep, fontFamily: font.semibold }]}>Today's session</Text>
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

          return (
            <View key={dayIndex} style={[styles.upcomingRow, { opacity: isPast ? 0.5 : 0.55 }]}>
              <View style={[styles.upcomingBadge, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.upcomingBadgeText, { color: colors.mutedForeground, fontFamily: font.semibold }]}>{dayIndex + 1}</Text>
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

function EmptyBody() {
  const colors = useColors();
  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
        <View style={[styles.emptyIcon, { borderColor: colors.blush200 }]}>
          <Target size={34} color={colors.primaryDeep} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: font.display }]}>Work toward a goal</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
          Tell us an objective — "run 6 km" or "reach 7:10 pace" — and a coach builds a gentle, trackable plan.
        </Text>
        <View style={{ alignSelf: "stretch", paddingHorizontal: 8, marginTop: 8 }}>
          <GradientButton
            label="Set an objective"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/experiments/objective");
            }}
            leadingIcon={<Sparkles size={18} color="#FFFFFF" strokeWidth={2} />}
          />
        </View>
      </View>

      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
        <View style={[styles.emptyIcon, { borderColor: colors.blush200 }]}>
          <FlaskConical size={34} color={colors.primaryDeep} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: font.display }]}>Or a tiny experiment</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
          A small, time-boxed promise to yourself — five days of something gentle. No pass or fail, only noticing.
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/experiments/new");
          }}
          style={[styles.ghostBtn, { borderColor: colors.border }]}
        >
          <Plus size={18} color={colors.primaryDeep} strokeWidth={2} />
          <Text style={[styles.ghostBtnText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>Start an experiment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerCap: { fontSize: 12, letterSpacing: 1.2 },

  expired: { borderRadius: radii.lg, borderWidth: 1, padding: 18, marginBottom: 18 },
  expiredTitle: { fontSize: 16, marginBottom: 4 },
  expiredSub: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  expiredActions: { flexDirection: "row", gap: 10 },
  expiredBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  expiredBtnText: { fontSize: 14, color: "#FFFFFF" },
  expiredGhost: { paddingHorizontal: 18, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, justifyContent: "center" },
  expiredGhostText: { fontSize: 14 },

  heroCard: { borderRadius: 24, padding: 22, overflow: "hidden", position: "relative" },
  heroOrnament: { position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.12)" },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  heroCapt: { fontSize: 12, letterSpacing: 0.8, color: "rgba(255,255,255,0.95)" },
  heroTitle: { fontSize: 22, color: "#FFFFFF", lineHeight: 28, marginBottom: 8 },
  heroHypothesis: { fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 19 },
  heroProgress: { flexDirection: "row", gap: 6, marginTop: 18, flexWrap: "wrap" },
  heroSeg: { flex: 1, minWidth: 8, height: 6, borderRadius: 999 },

  doneCard: { borderRadius: 18, borderWidth: 1, padding: 15 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  doneCheck: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dayTitle: { fontSize: 15, marginBottom: 2 },
  dayMeta: { fontSize: 12 },
  moodEmoji: { fontSize: 22 },
  noteBubble: { marginTop: 10, fontSize: 13, lineHeight: 20, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },

  todayCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1.5, padding: 16 },
  todayLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" },
  todayBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  todayBadgeText: { fontSize: 14 },
  todaySub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  startPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  startPillText: { fontSize: 13, color: "#FFFFFF" },
  intervalTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F9E9ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  intervalTagText: { fontSize: 11 },

  planUpcoming: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center" },

  upcomingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  upcomingBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  upcomingBadgeText: { fontSize: 14 },

  emptyCard: { borderRadius: radii.lg, borderWidth: 1, padding: 26, alignItems: "center", gap: 10 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 22, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  ghostBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: radii.md, paddingVertical: 13, alignSelf: "stretch", marginTop: 4 },
  ghostBtnText: { fontSize: 15 },

  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 12 },
  pastRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1 },
  pastMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  pastDelete: { padding: 14 },
  pastBadge: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pastTitle: { fontSize: 14, marginBottom: 2 },
  pastSub: { fontSize: 12 },
});
