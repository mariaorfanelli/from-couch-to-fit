import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { FlaskConical, Sparkle } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, gradient, radii, shadow1, shadow3 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import {
  MOODS,
  avgPaceSecPerKm,
  completedDaysCount,
  experimentTotalKm,
  formatPace,
} from "@/lib/experiments";
import { useColors } from "@/hooks/useColors";

export default function ExperimentWrapupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { experiments, activities, archiveExperiment } = useApp();

  const exp = experiments.find((e) => e.id === id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!exp) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardAlt, paddingTop: topPad + 60, alignItems: "center" }]}>
        <Text style={[styles.missing, { color: colors.mutedForeground, fontFamily: font.medium }]}>
          Experiment not found.
        </Text>
        <GradientButton label="Back home" onPress={() => router.replace("/(tabs)")} />
      </View>
    );
  }

  const days = completedDaysCount(exp);
  const totalKm = experimentTotalKm(exp, activities);
  const pace = formatPace(avgPaceSecPerKm(exp, activities));

  function startAnother() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/experiments/new");
  }

  function keepAsHabit() {
    if (!exp) return;
    Haptics.selectionAsync();
    archiveExperiment(exp.id);
    router.replace("/(tabs)");
  }

  return (
    <LinearGradient colors={gradient.hero} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: topPad + 18, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={styles.heroBlock}>
          <View style={[styles.medallion, shadow3, { backgroundColor: colors.card, borderColor: colors.blush200 }]}>
            <FlaskConical size={38} color={colors.primaryDeep} strokeWidth={1.5} />
            <View style={styles.sparkA}>
              <Sparkle size={16} color={colors.inputFocus} strokeWidth={1.5} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            Experiment complete 🌸
          </Text>
          <Text style={[styles.sub, { color: colors.secondaryText, fontFamily: font.regular }]}>
            {exp.durationDays} days, {days} tiny session{days === 1 ? "" : "s"}. You showed up.
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.displayLight }]}>
              {days}/{exp.durationDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              days done
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.displayLight }]}>
              {totalKm > 0 ? totalKm.toFixed(1) : "—"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              total km
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: font.displayLight }]}>
              {pace}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              avg /km
            </Text>
          </View>
        </Animated.View>

        {/* Reflections timeline */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
            HOW IT FELT, DAY BY DAY
          </Text>
          <View style={{ gap: 10 }}>
            {Array.from({ length: exp.durationDays }).map((_, i) => {
              const s = exp.sessions.find((x) => x.dayIndex === i);
              if (!s) return (
                <View key={i} style={styles.reflRow}>
                  <Text style={styles.reflEmoji}>·</Text>
                  <Text style={[styles.reflText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                    <Text style={{ color: colors.foreground, fontFamily: font.semibold }}>Day {i + 1} · </Text>
                    missed
                  </Text>
                </View>
              );
              return (
                <View key={i} style={styles.reflRow}>
                  <Text style={styles.reflEmoji}>{typeof s.mood === "number" ? MOODS[s.mood].emoji : "·"}</Text>
                  <Text style={[styles.reflText, { color: colors.secondaryText, fontFamily: font.regular }]}>
                    <Text style={{ color: colors.foreground, fontFamily: font.semibold }}>Day {i + 1} · </Text>
                    {s.note ? s.note.split(".")[0] : "no note"}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: bottomPad + 28 }]}>
        <GradientButton label="Start a new experiment" onPress={startAnother} />
        <Pressable onPress={keepAsHabit} style={styles.habitBtn}>
          <Text style={[styles.habitText, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
            Keep this as a habit
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 24 },
  heroBlock: { alignItems: "center", marginBottom: 22 },
  medallion: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    position: "relative",
  },
  sparkA: { position: "absolute", top: 2, right: 8 },
  title: { fontSize: 28, lineHeight: 32, letterSpacing: -0.2, textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 280 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 28, letterSpacing: -0.5, lineHeight: 30, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 11, marginTop: 5 },

  sectionLabel: { fontSize: 12, letterSpacing: 1.2, marginBottom: 12 },
  reflRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reflEmoji: { fontSize: 16, lineHeight: 22 },
  reflText: { fontSize: 13, lineHeight: 22, flex: 1 },

  actions: { paddingHorizontal: 24, paddingTop: 10, gap: 4 },
  habitBtn: { paddingVertical: 12, alignItems: "center" },
  habitText: { fontSize: 15 },

  missing: { fontSize: 16, marginBottom: 20 },
});
