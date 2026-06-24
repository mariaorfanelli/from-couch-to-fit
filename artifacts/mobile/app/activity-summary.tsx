import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import {
  Activity as ActivityIcon,
  Dumbbell,
  Flame,
  Flower2,
  Footprints,
  Heart,
  Route as RouteIcon,
  Share2,
  Sparkle,
  Timer,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RouteMap from "@/components/RouteMap";
import GradientButton from "@/components/ui/GradientButton";
import { font, gradient, radii, shadow1, shadow2 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TYPE_LABELS: Record<ActivityType, string> = {
  run: "Run",
  walk: "Walk",
  pilates: "Gentle Pilates",
  yoga: "Restorative Yoga",
  strength: "Strength",
};

const TYPE_ICONS: Record<ActivityType, any> = {
  run: RouteIcon,
  walk: Footprints,
  pilates: Flower2,
  yoga: Heart,
  strength: Dumbbell,
};

function formatDuration(min: number): string {
  if (min < 60) return `${String(min).padStart(2, "0")}:00`;
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default function ActivitySummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, currentStreakDays, weeklyActivities, user } = useApp();

  const activity = activities.find((a) => a.id === id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardAlt, paddingTop: topPad + 80, alignItems: "center" }]}>
        <Text style={[styles.missing, { color: colors.mutedForeground, fontFamily: font.medium }]}>
          Activity not found
        </Text>
        <GradientButton label="Back to home" onPress={() => router.replace("/(tabs)")} />
      </View>
    );
  }

  const Icon = TYPE_ICONS[activity.type];
  const hasRoute = !!activity.coords && activity.coords.length > 1;
  const firstName = (user?.name ?? "Friend").split(" ")[0];
  const message =
    activity.distanceKm
      ? `A calm ${activity.durationMinutes}-minute ${TYPE_LABELS[activity.type].toLowerCase()} — ${activity.distanceKm.toFixed(1)} km, your body says thank you.`
      : `A calm ${activity.durationMinutes}-minute ${TYPE_LABELS[activity.type].toLowerCase()} — your body says thank you.`;

  async function handleShare() {
    if (!activity) return;
    Haptics.selectionAsync();
    try {
      const dist = activity.distanceKm ? ` · ${activity.distanceKm.toFixed(1)}km` : "";
      await Share.share({
        message: `I just finished ${activity.durationMinutes} min of ${TYPE_LABELS[activity.type].toLowerCase()}${dist} on From Couch to Fit 🌸`,
      });
    } catch {}
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardAlt,
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 24,
        },
      ]}
    >
      <View style={styles.body}>
        {/* Celebratory hero */}
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          <LinearGradient colors={gradient.hero} style={[styles.heroCard, shadow1]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}>
            <View style={[styles.sparkA]}>
              <Sparkle size={18} color={colors.inputFocus} strokeWidth={1.5} />
            </View>
            <View style={[styles.sparkB]}>
              <Sparkle size={13} color={colors.rose300} strokeWidth={1.5} />
            </View>
            <View style={[styles.sparkC]}>
              <Sparkle size={13} color={colors.rose300} strokeWidth={1.5} />
            </View>
            <View style={[styles.medallion, { backgroundColor: colors.card, borderColor: colors.blush200 }]}>
              <Flower2 size={44} color={colors.primaryDeep} strokeWidth={1.5} />
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ alignItems: "center", marginTop: 18, marginBottom: 22 }}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            Beautifully done, {firstName}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            {message}
          </Text>
        </Animated.View>

        {/* Optional route map */}
        {hasRoute && (
          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={[styles.mapCard, { borderColor: colors.border }]}>
            <RouteMap coords={activity.coords!} primaryColor={colors.primary} height={160} borderRadius={radii.lg} />
          </Animated.View>
        )}

        {/* Stats breakdown card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
        >
          <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.statsLeft}>
              <Timer size={19} color={colors.plum} strokeWidth={1.5} />
              <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>
                Duration
              </Text>
            </View>
            <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
              {formatDuration(activity.durationMinutes)}
            </Text>
          </View>

          <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.statsLeft}>
              <Icon size={19} color={colors.plum} strokeWidth={1.5} />
              <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>
                Activity type
              </Text>
            </View>
            <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
              {TYPE_LABELS[activity.type]}
            </Text>
          </View>

          {activity.distanceKm ? (
            <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
              <View style={styles.statsLeft}>
                <RouteIcon size={19} color={colors.plum} strokeWidth={1.5} />
                <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>Distance</Text>
              </View>
              <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
                {activity.distanceKm.toFixed(2)} km
              </Text>
            </View>
          ) : null}

          {activity.pace ? (
            <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
              <View style={styles.statsLeft}>
                <ActivityIcon size={19} color={colors.plum} strokeWidth={1.5} />
                <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>Pace</Text>
              </View>
              <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
                {activity.pace}
              </Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <Flame size={19} color={colors.primaryDeep} strokeWidth={1.5} />
              <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>
                This week
              </Text>
            </View>
            <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
              {weeklyActivities} {weeklyActivities === 1 ? "activity" : "activities"}
              {currentStreakDays > 1 ? ` · ${currentStreakDays}-day streak` : ""}
            </Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actions}>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
            onPress={handleShare}
            hitSlop={6}
          >
            <Share2 size={20} color={colors.primaryDeep} strokeWidth={1.5} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <GradientButton
              label="Back to home"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace("/(tabs)");
              }}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1 },
  heroCard: {
    height: 200,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  sparkA: { position: "absolute", top: 22, left: 32 },
  sparkB: { position: "absolute", top: 44, right: 38 },
  sparkC: { position: "absolute", bottom: 28, left: 46 },
  medallion: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  title: { fontSize: 28, lineHeight: 32, letterSpacing: -0.2, textAlign: "center", marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 12 },
  mapCard: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden", marginBottom: 18 },
  statsCard: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 22 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1 },
  statsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statsLabel: { fontSize: 14 },
  statsValue: { fontSize: 15, fontVariant: ["tabular-nums"] },
  actions: { flexDirection: "row", gap: 12, marginTop: 22 },
  shareBtn: { width: 56, height: 54, borderRadius: radii.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  missing: { fontSize: 16, marginBottom: 20 },
});
