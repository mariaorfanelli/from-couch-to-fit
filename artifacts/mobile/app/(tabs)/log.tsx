import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string }[] = [
  { type: "run", label: "Run", icon: "wind" },
  { type: "walk", label: "Walk", icon: "navigation" },
  { type: "pilates", label: "Pilates", icon: "activity" },
  { type: "yoga", label: "Yoga", icon: "heart" },
  { type: "strength", label: "Strength", icon: "zap" },
];

const DISTANCE_TYPES: ActivityType[] = ["run", "walk"];

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useApp();

  const [selectedType, setSelectedType] = useState<ActivityType>("run");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayString());
  const [saved, setSaved] = useState(false);

  const showDistanceFields = DISTANCE_TYPES.includes(selectedType);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  function validate(): string | null {
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return "Please enter a valid duration in minutes.";
    }
    if (showDistanceFields && distance && isNaN(Number(distance))) {
      return "Please enter a valid distance.";
    }
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      Alert.alert("Missing info", err);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addActivity({
      date,
      type: selectedType,
      durationMinutes: Number(duration),
      distanceKm: showDistanceFields && distance ? Number(distance) : undefined,
      pace: showDistanceFields && pace ? pace : undefined,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setDuration("");
      setDistance("");
      setPace("");
      setNotes("");
      setDate(todayString());
      router.push("/(tabs)/");
    }, 1200);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 120,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Log Activity
        </Text>
        <Text style={[styles.screenSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Every step counts
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Activity Type
        </Text>
        <View style={styles.typeGrid}>
          {ACTIVITY_TYPES.map(({ type, label, icon }) => {
            const active = selectedType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedType(type);
                }}
              >
                <Feather
                  name={icon as any}
                  size={18}
                  color={active ? "#FFFFFF" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: active ? "#FFFFFF" : colors.foreground,
                      fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.section}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Date
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Duration (minutes)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 30"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
        />
      </Animated.View>

      {showDistanceFields && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Distance (km)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              value={distance}
              onChangeText={setDistance}
              placeholder="e.g. 5.0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Pace (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              value={pace}
              onChangeText={setPace}
              placeholder="e.g. 6:30 /km"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.section}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Notes (optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.notesInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did it feel?"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(340).duration(400)}>
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: saved ? colors.success : colors.primary },
          ]}
          onPress={handleSave}
          disabled={saved}
        >
          {saved ? (
            <Feather name="check" size={20} color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveButtonText, { fontFamily: "Inter_600SemiBold" }]}>
              Save Activity
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, marginBottom: 4 },
  screenSub: { fontSize: 15, marginBottom: 28 },
  section: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8, letterSpacing: 0.5 },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  typeLabel: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  notesInput: {
    height: 90,
    paddingTop: 14,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 56,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
