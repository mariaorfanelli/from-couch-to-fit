import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CelebrationIllustration } from "@/components/Illustrations";
import { ActivityType } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TYPE_LABELS: Record<ActivityType, string> = {
  run: "Run",
  walk: "Walk",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength Training",
};

const TYPE_ICONS: Record<ActivityType, string> = {
  run: "wind",
  walk: "navigation",
  pilates: "activity",
  yoga: "heart",
  strength: "zap",
};

function getMessage(type: ActivityType, distanceKm?: number, durationMinutes?: number): string {
  if (type === "run" && distanceKm) {
    return `You just completed a ${distanceKm}km run!`;
  }
  if (type === "walk" && distanceKm) {
    return `You just logged a ${distanceKm}km walk!`;
  }
  if (durationMinutes) {
    return `You just finished ${durationMinutes} minutes of ${TYPE_LABELS[type].toLowerCase()}!`;
  }
  return "Great workout! You're doing amazing.";
}

function StatBox({
  label,
  value,
  unit,
  delay,
}: {
  label: string;
  value: string;
  unit: string;
  delay: number;
}) {
  const colors = useColors();
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
  }, [delay]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        style,
        styles.statBox,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 3,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
        {value}
        {unit ? (
          <Text style={[styles.statUnit, { color: colors.mutedForeground }]}> {unit}</Text>
        ) : null}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

export default function ActivitySummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    type: ActivityType;
    duration: string;
    distance: string;
    pace: string;
    notes: string;
  }>();

  const type = (params.type as ActivityType) ?? "run";
  const duration = params.duration ? Number(params.duration) : 0;
  const distance = params.distance ? Number(params.distance) : undefined;
  const pace = params.pace || undefined;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const message = getMessage(type, distance, duration);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPadding + 20,
          paddingBottom: bottomPadding + 24,
        },
      ]}
    >
      <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.illustrationWrap}>
        <CelebrationIllustration size={160} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.textWrap}>
        <Text style={[styles.congrats, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
          Wonderful!
        </Text>
        <Text style={[styles.message, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {message}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.summaryCard}>
        <View
          style={[
            styles.cardInner,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            },
          ]}
        >
          <View style={[styles.typeRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.typeIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={TYPE_ICONS[type] as any} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.typeName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {TYPE_LABELS[type]}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="Duration" value={String(duration)} unit="min" delay={400} />
            {distance ? (
              <StatBox label="Distance" value={distance.toFixed(1)} unit="km" delay={480} />
            ) : null}
            {pace ? (
              <StatBox label="Pace" value={pace} unit="" delay={560} />
            ) : null}
          </View>

          {params.notes ? (
            <View style={[styles.notesRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {params.notes}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.actions}>
        <Pressable
          style={[styles.homeButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/(tabs)/");
          }}
        >
          <Feather name="home" size={18} color="#FFFFFF" />
          <Text style={[styles.homeButtonText, { fontFamily: "Inter_600SemiBold" }]}>
            Back to Home
          </Text>
        </Pressable>

        <Pressable
          style={[styles.logAgainButton, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.replace("/(tabs)/log");
          }}
        >
          <Text style={[styles.logAgainText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Log another
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  illustrationWrap: { alignItems: "center", marginBottom: 24 },
  textWrap: { alignItems: "center", marginBottom: 28 },
  congrats: { fontSize: 15, letterSpacing: 0.5, marginBottom: 8 },
  message: { fontSize: 24, textAlign: "center", lineHeight: 32 },
  summaryCard: { marginBottom: 32 },
  cardInner: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeName: { fontSize: 16 },
  statsRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 22 },
  statUnit: { fontSize: 13 },
  statLabel: { fontSize: 12, marginTop: 2 },
  notesRow: {
    borderTopWidth: 1,
    padding: 16,
  },
  notesText: { fontSize: 14, lineHeight: 20 },
  actions: { gap: 12 },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  homeButtonText: { fontSize: 16, color: "#FFFFFF" },
  logAgainButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  logAgainText: { fontSize: 15 },
});
