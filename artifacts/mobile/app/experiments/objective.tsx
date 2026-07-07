import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronLeft, Gauge, Repeat, Route as RouteIcon, Sparkles, Target } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { GeneratedPlan, generatePlan } from "@/lib/aiPlan";
import { PlanTarget } from "@/lib/experiments";
import { summarize } from "@/lib/intervals";
import { bestPaceSec } from "@/lib/stats";
import { useColors } from "@/hooks/useColors";

type GoalKind = "distance" | "pace";

function parsePace(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export default function ObjectiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createPlan, activities, weeklyKm } = useApp();

  const [kind, setKind] = useState<GoalKind>("distance");
  const [distance, setDistance] = useState("6");
  const [pace, setPace] = useState("7:10");
  const [weeks, setWeeks] = useState(6);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [target, setTarget] = useState<PlanTarget | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function build() {
    let t: PlanTarget;
    if (kind === "distance") {
      const km = parseFloat(distance.replace(",", "."));
      if (!km || km <= 0) {
        Alert.alert("Wait", "Enter a distance in km, e.g. 6.");
        return;
      }
      t = { kind: "distance", value: km };
    } else {
      const sec = parsePace(pace);
      if (!sec) {
        Alert.alert("Wait", "Enter a pace as m:ss, e.g. 7:10.");
        return;
      }
      t = { kind: "pace", value: sec };
    }
    setTarget(t);
    setLoading(true);
    Haptics.selectionAsync();
    try {
      const typicalRunKm =
        activities.filter((a) => a.type === "run" && a.distanceKm).reduce((s, a) => s + (a.distanceKm ?? 0), 0) /
          Math.max(1, activities.filter((a) => a.type === "run" && a.distanceKm).length) || 0;
      const result = await generatePlan({
        objective: note,
        target: t,
        weeks,
        stats: { weeklyKm, bestPaceSec: bestPaceSec(activities), typicalRunKm: Math.round(typicalRunKm * 10) / 10 },
      });
      setPlan(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Hmm", "Could not build a plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!plan || !target) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPlan({
      title: plan.title,
      objective: note || plan.title,
      target,
      activityType: "run",
      durationDays: plan.durationDays,
      days: plan.days,
    });
    router.replace("/experiments");
  }

  // Group plan days by week for the preview.
  const weeksData = plan
    ? Array.from({ length: plan.durationDays / 7 }, (_, w) => ({
        week: w + 1,
        days: plan.days.filter((d) => Math.floor(d.dayIndex / 7) === w),
      })).filter((x) => x.days.length > 0)
    : [];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => (plan ? setPlan(null) : router.back())}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          hitSlop={10}
        >
          <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.headerCap, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
          {plan ? "YOUR PLAN" : "SET AN OBJECTIVE"}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      {!plan ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPad + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            What are you working toward?
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            Tell us the goal — a coach will build a gentle, trackable plan for you.
          </Text>

          {/* Goal type */}
          <View style={styles.toggle}>
            {(["distance", "pace"] as const).map((k) => {
              const on = kind === k;
              const Icon = k === "distance" ? RouteIcon : Gauge;
              return (
                <Pressable
                  key={k}
                  onPress={() => { Haptics.selectionAsync(); setKind(k); }}
                  style={[
                    styles.toggleTab,
                    { backgroundColor: on ? colors.card : "transparent", ...(on ? shadow1 : {}) },
                  ]}
                >
                  <Icon size={16} color={on ? colors.primaryDeep : colors.mutedForeground} strokeWidth={1.5} />
                  <Text style={[styles.toggleText, { color: on ? colors.primaryDeep : colors.mutedForeground, fontFamily: on ? font.semibold : font.regular }]}>
                    {k === "distance" ? "Distance" : "Pace"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {kind === "distance" ? (
            <>
              <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium }]}>Target distance (km)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: font.regular }]}
                value={distance}
                onChangeText={setDistance}
                keyboardType="decimal-pad"
                placeholder="6"
                placeholderTextColor="#B6AFBA"
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium }]}>Target pace (min:sec per km)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: font.regular }]}
                value={pace}
                onChangeText={setPace}
                placeholder="7:10"
                placeholderTextColor="#B6AFBA"
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>Over how long?</Text>
          <View style={styles.weeksRow}>
            {[4, 6, 8, 12].map((w) => {
              const on = weeks === w;
              return (
                <Pressable
                  key={w}
                  onPress={() => { Haptics.selectionAsync(); setWeeks(w); }}
                  style={[styles.weekChip, { backgroundColor: on ? colors.primary : colors.card, borderColor: on ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.weekChipText, { color: on ? "#FFFFFF" : colors.foreground, fontFamily: on ? font.semibold : font.regular }]}>
                    {w} wks
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>Anything to add? (optional)</Text>
          <TextInput
            style={[styles.input, styles.notes, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: font.regular }]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. I get out of breath after 2 minutes of running"
            placeholderTextColor="#B6AFBA"
            multiline
            textAlignVertical="top"
          />

          <View style={{ marginTop: 26 }}>
            <GradientButton
              label={loading ? "Building your plan…" : "Build my plan"}
              loading={loading}
              onPress={build}
              leadingIcon={<Sparkles size={18} color="#FFFFFF" strokeWidth={2} />}
            />
          </View>
        </ScrollView>
      ) : (
        <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPad + 100 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.planHead, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
              <View style={[styles.planIcon, { backgroundColor: colors.secondary }]}>
                <Target size={22} color={colors.primaryDeep} strokeWidth={1.5} />
              </View>
              <Text style={[styles.planTitle, { color: colors.foreground, fontFamily: font.display }]}>{plan.title}</Text>
              <Text style={[styles.planSummary, { color: colors.mutedForeground, fontFamily: font.regular }]}>{plan.summary}</Text>
              <View style={[styles.sourceBadge, { backgroundColor: plan.source === "ai" ? colors.secondary : colors.cardAlt }]}>
                <Sparkles size={12} color={colors.primaryDeep} strokeWidth={2} />
                <Text style={[styles.sourceText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
                  {plan.source === "ai" ? "Built by DeepSeek" : "Smart plan"}
                </Text>
              </View>
            </View>

            {weeksData.map(({ week, days }) => (
              <View key={week} style={{ marginTop: 20 }}>
                <Text style={[styles.weekLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>WEEK {week}</Text>
                <View style={{ gap: 10 }}>
                  {days.map((d) => (
                    <View key={d.dayIndex} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
                      <View style={styles.dayTop}>
                        <Text style={[styles.dayLabel, { color: colors.foreground, fontFamily: font.semibold }]}>{d.label}</Text>
                        {d.interval ? (
                          <View style={styles.intervalTag}>
                            <Repeat size={12} color={colors.primaryDeep} strokeWidth={2} />
                            <Text style={[styles.intervalTagText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>Intervals</Text>
                          </View>
                        ) : d.targetKm ? (
                          <Text style={[styles.dayKm, { color: colors.primaryDeep, fontFamily: font.semibold }]}>{d.targetKm} km</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.dayPrescription, { color: colors.secondaryText, fontFamily: font.regular }]}>{d.prescription}</Text>
                      {d.interval && (
                        <Text style={[styles.dayInterval, { color: colors.mutedForeground, fontFamily: font.regular }]}>{summarize(d.interval)}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: bottomPad + 20, backgroundColor: colors.cardAlt, borderTopColor: colors.border }]}>
            <GradientButton label="Start this plan" onPress={save} />
            <Pressable onPress={() => { Haptics.selectionAsync(); setPlan(null); }} style={{ alignItems: "center", paddingTop: 12 }}>
              <Text style={[styles.redo, { color: colors.mutedForeground, fontFamily: font.medium }]}>Adjust the goal</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerCap: { fontSize: 12, letterSpacing: 1 },
  title: { fontSize: 28, letterSpacing: -0.3, marginBottom: 8, marginTop: 8 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  toggle: { flexDirection: "row", backgroundColor: "#F9E9ED", borderRadius: 14, padding: 4, marginBottom: 22 },
  toggleTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  toggleText: { fontSize: 14 },
  label: { fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  notes: { height: 84, paddingTop: 14 },
  weeksRow: { flexDirection: "row", gap: 10 },
  weekChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  weekChipText: { fontSize: 14 },

  planHead: { borderRadius: radii.lg, borderWidth: 1, padding: 22, alignItems: "center" },
  planIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  planTitle: { fontSize: 24, letterSpacing: -0.3, textAlign: "center", marginBottom: 4 },
  planSummary: { fontSize: 14, textAlign: "center", marginBottom: 12 },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sourceText: { fontSize: 12 },
  weekLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  dayCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  dayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dayLabel: { fontSize: 14, flex: 1 },
  dayKm: { fontSize: 14 },
  intervalTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F9E9ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  intervalTagText: { fontSize: 11 },
  dayPrescription: { fontSize: 13, lineHeight: 19 },
  dayInterval: { fontSize: 12, marginTop: 6 },

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 14, borderTopWidth: 1 },
  redo: { fontSize: 14 },
});
