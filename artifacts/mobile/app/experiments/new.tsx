import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ChevronLeft,
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Route as RouteIcon,
} from "lucide-react-native";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ACTIVITY_CHOICES: { id: ActivityType; label: string; Icon: any }[] = [
  { id: "walk", label: "Walking", Icon: Footprints },
  { id: "run", label: "Running", Icon: RouteIcon },
  { id: "pilates", label: "Pilates", Icon: Flower2 },
  { id: "yoga", label: "Yoga", Icon: Heart },
  { id: "strength", label: "Strength", Icon: Dumbbell },
];

const DURATIONS = [3, 5, 7, 14];

export default function NewExperimentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createExperiment } = useApp();

  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("walk");
  const [durationDays, setDurationDays] = useState(5);
  const [perDayKm, setPerDayKm] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [hypoFocused, setHypoFocused] = useState(false);
  const [kmFocused, setKmFocused] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const wantsDistance = activityType === "run" || activityType === "walk";

  function handleCreate() {
    if (!title.trim()) {
      Alert.alert("Wait", "Give your experiment a name first.");
      return;
    }
    const km = perDayKm.trim() ? Number(perDayKm) : undefined;
    if (wantsDistance && km !== undefined && (isNaN(km) || km <= 0)) {
      Alert.alert("Wait", "Per-day distance should be a number above 0, or left blank.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = createExperiment({
      title: title.trim(),
      hypothesis: hypothesis.trim() || undefined,
      activityType,
      durationDays,
      targetPerDayKm: wantsDistance ? km : undefined,
    });
    router.replace({ pathname: "/experiments", params: { id } });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          hitSlop={10}
        >
          <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          New experiment
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottomPad + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(380)}>
          <Text style={[styles.h2, { color: colors.foreground, fontFamily: font.display }]}>
            A small, time-boxed promise
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            Pick something tiny and try it for a few days. No pass or fail — only noticing.
          </Text>
        </Animated.View>

        <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium }]}>
          What's the promise?
        </Text>
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.card,
              borderColor: titleFocused ? colors.inputFocus : colors.border,
              borderWidth: titleFocused ? 1.5 : 1,
            },
          ]}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="e.g. Run 1 km a day for 5 days"
            placeholderTextColor="#B6AFBA"
            style={[styles.input, { color: colors.foreground, fontFamily: font.regular }]}
          />
        </View>

        <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>
          Hypothesis (optional)
        </Text>
        <View
          style={[
            styles.field,
            styles.fieldMultiline,
            {
              backgroundColor: colors.card,
              borderColor: hypoFocused ? colors.inputFocus : colors.border,
              borderWidth: hypoFocused ? 1.5 : 1,
            },
          ]}
        >
          <TextInput
            value={hypothesis}
            onChangeText={setHypothesis}
            onFocus={() => setHypoFocused(true)}
            onBlur={() => setHypoFocused(false)}
            placeholder="What are you curious about?"
            placeholderTextColor="#B6AFBA"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.inputMultiline, { color: colors.foreground, fontFamily: font.regular }]}
          />
        </View>

        <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>
          What kind of movement?
        </Text>
        <View style={styles.chipGrid}>
          {ACTIVITY_CHOICES.map(({ id, label, Icon }) => {
            const on = activityType === id;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActivityType(id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.blushTint : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <Icon size={18} color={on ? colors.primaryDeep : colors.plum} strokeWidth={1.5} />
                <Text
                  style={[
                    styles.chipText,
                    { color: on ? colors.primaryDeep : "#5A535F", fontFamily: font.semibold },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>
          For how many days?
        </Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => {
            const on = durationDays === d;
            return (
              <Pressable
                key={d}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDurationDays(d);
                }}
                style={[
                  styles.durChip,
                  {
                    backgroundColor: on ? colors.primary : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.durText,
                    { color: on ? "#FFFFFF" : colors.foreground, fontFamily: on ? font.semibold : font.medium },
                  ]}
                >
                  {d} days
                </Text>
              </Pressable>
            );
          })}
        </View>

        {wantsDistance && (
          <>
            <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium, marginTop: 18 }]}>
              Distance per day (km, optional)
            </Text>
            <View
              style={[
                styles.field,
                {
                  backgroundColor: colors.card,
                  borderColor: kmFocused ? colors.inputFocus : colors.border,
                  borderWidth: kmFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                value={perDayKm}
                onChangeText={setPerDayKm}
                onFocus={() => setKmFocused(true)}
                onBlur={() => setKmFocused(false)}
                placeholder="e.g. 1"
                placeholderTextColor="#B6AFBA"
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground, fontFamily: font.regular }]}
              />
            </View>
          </>
        )}

        <View style={{ marginTop: 28 }}>
          <GradientButton label="Start this experiment" onPress={handleCreate} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18 },

  h2: { fontSize: 26, lineHeight: 32, letterSpacing: -0.2, marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 22 },

  label: { fontSize: 13, marginBottom: 8 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  fieldMultiline: { paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  inputMultiline: { minHeight: 64 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14 },

  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  durChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  durText: { fontSize: 14 },
});
