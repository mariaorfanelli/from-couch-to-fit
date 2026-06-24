import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import { MOODS, Mood, isExperimentComplete, isExperimentReflected } from "@/lib/experiments";
import { useColors } from "@/hooks/useColors";

export default function ReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ experimentId: string; dayIndex: string; activityId: string }>();
  const { experiments, activities, recordExperimentSession, completeExperiment } = useApp();

  const experimentId = params.experimentId;
  const dayIndex = Number(params.dayIndex ?? 0);
  const activityId = params.activityId;

  const exp = experiments.find((e) => e.id === experimentId);
  const activity = activities.find((a) => a.id === activityId);

  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [noteFocused, setNoteFocused] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function save() {
    if (mood == null) {
      // mood is optional — but encourage at least one tap. If they really skip, allow it.
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordExperimentSession(experimentId, dayIndex, {
      activityId,
      mood: mood ?? undefined,
      note: note.trim() || undefined,
    });

    // If this was the final day's reflection, complete the experiment + go to wrap-up.
    if (exp) {
      const wouldBeReflected = (() => {
        // Simulate the post-update state to decide routing.
        const sessions = exp.sessions.map((s) =>
          s.dayIndex === dayIndex ? { ...s, activityId, mood: mood ?? s.mood, note: (note.trim() || s.note) } : s
        );
        if (!sessions.some((s) => s.dayIndex === dayIndex)) {
          sessions.push({ dayIndex, activityId, mood: mood ?? undefined, note: note.trim() || undefined });
        }
        const next = { ...exp, sessions };
        return isExperimentComplete(next) && isExperimentReflected(next);
      })();

      if (wouldBeReflected) {
        completeExperiment(experimentId);
        router.replace({ pathname: "/experiments/wrapup", params: { id: experimentId } });
        return;
      }
    }

    router.replace("/experiments");
  }

  if (!exp || !activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardAlt, paddingTop: topPad + 60, alignItems: "center" }]}>
        <Text style={[styles.missing, { color: colors.mutedForeground, fontFamily: font.medium }]}>
          Could not find this session.
        </Text>
        <GradientButton label="Back" onPress={() => router.replace("/(tabs)")} />
      </View>
    );
  }

  const distLine = activity.distanceKm ? `${activity.distanceKm.toFixed(2)} km` : null;
  const paceLine = activity.pace ? activity.pace : null;
  const summary = [distLine, paceLine, "part of your experiment"].filter(Boolean).join(" · ");

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.delay(80).duration(400)} style={styles.heroBlock}>
          <View style={[styles.checkMedal, { backgroundColor: "#EDF1EB" }]}>
            <Check size={30} color="#8AA083" strokeWidth={2.2} />
          </View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            Day {dayIndex + 1} complete
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            {summary}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
            HOW ARE YOU FEELING?
          </Text>
          <View style={styles.moodRow}>
            {MOODS.map((m, i) => {
              const on = mood === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMood(i as Mood);
                  }}
                  style={[
                    styles.moodCard,
                    {
                      backgroundColor: on ? colors.blushTint : colors.card,
                      borderColor: on ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color: on ? colors.primaryDeep : colors.secondaryText,
                        fontFamily: font.semibold,
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={{ marginTop: 18 }}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
            A NOTE TO YOURSELF
          </Text>
          <View
            style={[
              styles.noteShell,
              {
                backgroundColor: colors.card,
                borderColor: noteFocused ? colors.inputFocus : colors.border,
                borderWidth: noteFocused ? 1.5 : 1,
              },
            ]}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              placeholder="How did it feel? What did you notice?"
              placeholderTextColor="#B6AFBA"
              multiline
              textAlignVertical="top"
              style={[styles.noteInput, { color: colors.foreground, fontFamily: font.regular }]}
            />
          </View>
        </Animated.View>

        <View style={{ marginTop: 26 }}>
          <GradientButton label="Save reflection" onPress={save} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 26 },

  heroBlock: { alignItems: "center", marginBottom: 22 },
  checkMedal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, lineHeight: 30, letterSpacing: -0.2, marginBottom: 6, textAlign: "center" },
  sub: { fontSize: 14, lineHeight: 22, textAlign: "center" },

  label: { fontSize: 12, letterSpacing: 1.2, marginBottom: 12 },
  moodRow: { flexDirection: "row", gap: 8 },
  moodCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11 },

  noteShell: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14, minHeight: 130 },
  noteInput: { fontSize: 15, lineHeight: 22, padding: 0, minHeight: 100 },

  missing: { fontSize: 16, marginBottom: 20 },
});
