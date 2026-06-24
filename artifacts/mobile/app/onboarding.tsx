import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Dumbbell,
  FlaskConical,
  Flower2,
  Footprints,
  Heart,
  Mountain,
  Route as RouteIcon,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { EXPERIMENT_TEMPLATES } from "@/lib/experiments";
import { useColors } from "@/hooks/useColors";

type Step = 0 | 1 | 2;

const ACTIVITY_OPTIONS: { id: ActivityType | "hiking" | "cycling" | "stretching"; label: string; Icon: any }[] = [
  { id: "walk", label: "Walking", Icon: Footprints },
  { id: "run", label: "Running", Icon: RouteIcon },
  { id: "pilates", label: "Pilates", Icon: Flower2 },
  { id: "yoga", label: "Yoga", Icon: Heart },
  { id: "hiking", label: "Hiking", Icon: Mountain },
  { id: "cycling", label: "Cycling", Icon: Bike },
  { id: "stretching", label: "Stretching", Icon: Sparkles },
  { id: "strength", label: "Strength", Icon: Dumbbell },
];

const TEMPLATE_ICONS: Record<ActivityType, any> = {
  walk: Footprints,
  run: RouteIcon,
  pilates: Flower2,
  yoga: Heart,
  strength: Dumbbell,
};

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markOnboardingSeen, updateName, setPreferredActivities, createExperiment, user } = useApp();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState(user?.name && user.name !== "Friend" ? user.name : "");
  const [selected, setSelected] = useState<string[]>(["walk", "pilates"]);
  const [templateId, setTemplateId] = useState<string>(EXPERIMENT_TEMPLATES[0].id);
  const [nameFocused, setNameFocused] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function next() {
    Haptics.selectionAsync();
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert("Wait", "Tell us your name so we can greet you properly.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (selected.length === 0) {
        Alert.alert("Wait", "Pick at least one form of movement that feels good.");
        return;
      }
      setStep(2);
    } else {
      finish();
    }
  }

  function back() {
    Haptics.selectionAsync();
    if (step === 0) router.back();
    else setStep((step - 1) as Step);
  }

  async function finish() {
    await updateName(name.trim());
    const types = selected.filter((s): s is ActivityType =>
      ["run", "walk", "pilates", "yoga", "strength"].includes(s)
    );
    setPreferredActivities(types);
    const tmpl = EXPERIMENT_TEMPLATES.find((g) => g.id === templateId) ?? EXPERIMENT_TEMPLATES[0];
    createExperiment({
      title: tmpl.title,
      hypothesis: tmpl.hypothesis,
      activityType: tmpl.activityType,
      durationDays: tmpl.durationDays,
      targetPerDayKm: tmpl.targetPerDayKm,
    });
    markOnboardingSeen();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/all-set");
  }

  const progressFill = useMemo(() => [step >= 0, step >= 1, step >= 2], [step]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.headerRow, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={back} hitSlop={10} style={styles.back}>
          <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
        </Pressable>
        <View style={styles.progressRow}>
          {progressFill.map((on, i) => (
            <View
              key={i}
              style={[styles.progressSeg, { backgroundColor: on ? colors.primary : colors.border }]}
            />
          ))}
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: font.semibold }]}>
          {step + 1}/3
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(280)}>
            <Text style={[styles.h2, { color: colors.foreground, fontFamily: font.display }]}>
              First — what should we call you?
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              No pressure, no judgment. Just you and your pace.
            </Text>

            <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium }]}>Your name</Text>
            <View
              style={[
                styles.nameField,
                {
                  backgroundColor: colors.card,
                  borderColor: nameFocused ? colors.inputFocus : colors.border,
                  borderWidth: nameFocused ? 1.5 : 1,
                },
              ]}
            >
              <UserRound size={18} color={nameFocused ? colors.primary : "#A39EAA"} strokeWidth={1.5} />
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Sofia"
                placeholderTextColor="#B6AFBA"
                autoFocus
                style={[styles.nameInput, { color: colors.foreground, fontFamily: font.regular }]}
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeIn.duration(280)}>
            <Text style={[styles.h2, { color: colors.foreground, fontFamily: font.display }]}>
              What movement feels good?
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              Choose all that bring you joy — pick as many as you like.
            </Text>

            <View style={styles.chipGrid}>
              {ACTIVITY_OPTIONS.map(({ id, label, Icon }) => {
                const on = selected.includes(id);
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: on ? colors.blushTint : colors.card,
                        borderColor: on ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Icon size={19} color={on ? colors.primaryDeep : colors.plum} strokeWidth={1.5} />
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: on ? colors.primaryDeep : "#5A535F",
                          fontFamily: font.semibold,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.selectedCount, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              {selected.length} selected
            </Text>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn.duration(280)}>
            <Text style={[styles.h2, { color: colors.foreground, fontFamily: font.display }]}>
              Try a tiny experiment
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              A small, time-boxed promise to yourself. No pass or fail — only noticing.
            </Text>

            <View style={{ gap: 12 }}>
              {EXPERIMENT_TEMPLATES.map((tmpl) => {
                const on = templateId === tmpl.id;
                const Icon = TEMPLATE_ICONS[tmpl.activityType] ?? FlaskConical;
                return (
                  <Pressable
                    key={tmpl.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTemplateId(tmpl.id);
                    }}
                    style={[
                      styles.goalRow,
                      {
                        backgroundColor: on ? colors.blushTint : colors.card,
                        borderColor: on ? colors.primary : colors.border,
                      },
                      shadow1,
                    ]}
                  >
                    <View style={[styles.goalIconWrap, { backgroundColor: on ? colors.secondary : colors.cardAlt }]}>
                      <Icon size={21} color={on ? colors.primaryDeep : colors.plum} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
                        {tmpl.title}
                      </Text>
                      <Text style={[styles.goalSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                        {tmpl.hypothesis}
                      </Text>
                    </View>
                    {on ? (
                      <CheckCircle2 size={22} color={colors.primary} strokeWidth={2} />
                    ) : (
                      <Circle size={22} color="#D8D1D6" strokeWidth={2} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.footer, { paddingBottom: bottomPad + 28 }]}
      >
        <GradientButton
          label={step === 2 ? "Start this experiment" : "Continue"}
          onPress={next}
          trailingIcon={step < 2 ? <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} /> : undefined}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 28, paddingBottom: 10 },
  back: { padding: 4 },
  progressRow: { flex: 1, flexDirection: "row", gap: 6 },
  progressSeg: { flex: 1, height: 5, borderRadius: 999 },
  progressLabel: { fontSize: 13 },

  body: { paddingHorizontal: 28, paddingTop: 32 },
  h2: { fontSize: 30, lineHeight: 36, letterSpacing: -0.3, marginBottom: 10 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 34 },
  label: { fontSize: 13, marginBottom: 8 },

  nameField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nameInput: { flex: 1, fontSize: 16, padding: 0 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
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
  selectedCount: { fontSize: 13, textAlign: "center", marginTop: 14 },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: { fontSize: 15, marginBottom: 2 },
  goalSub: { fontSize: 13 },

  footer: { paddingHorizontal: 28, paddingTop: 12 },
});
