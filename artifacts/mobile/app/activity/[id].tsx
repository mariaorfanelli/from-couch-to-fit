import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  ChevronLeft,
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Route as RouteIcon,
  Timer,
  Trash2,
} from "lucide-react-native";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RouteMap from "@/components/RouteMap";
import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TYPE_LABELS: Record<ActivityType, string> = {
  run: "Run",
  walk: "Walk",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength Training",
};

const TYPE_ICONS: Record<ActivityType, any> = {
  run: RouteIcon,
  walk: Footprints,
  pilates: Flower2,
  yoga: Heart,
  strength: Dumbbell,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(min: number): string {
  if (min < 60) return `${String(min).padStart(2, "0")}:00`;
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default function ActivityDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, deleteActivity } = useApp();

  const activity = activities.find((a) => a.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardAlt, paddingTop: topPad + 60, alignItems: "center" }]}>
        <AlertCircle size={36} color={colors.mutedForeground} strokeWidth={1.5} />
        <Text style={[styles.missing, { color: colors.mutedForeground, fontFamily: font.medium }]}>
          Activity not found
        </Text>
        <GradientButton label="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const Icon = TYPE_ICONS[activity.type];
  const hasRoute = !!activity.coords && activity.coords.length > 1;

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete activity", "Remove this activity permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteActivity(activity!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
          {TYPE_LABELS[activity.type]}
        </Text>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}
          onPress={handleDelete}
          hitSlop={10}
        >
          <Trash2 size={18} color={colors.mutedForeground} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 24, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <View style={[styles.typeIcon, { backgroundColor: colors.secondary }]}>
            <Icon size={18} color={colors.primaryDeep} strokeWidth={1.5} />
          </View>
          <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            {formatDate(activity.date)}
          </Text>
        </View>

        {hasRoute && (
          <View style={[styles.mapCard, { borderColor: colors.border }]}>
            <RouteMap coords={activity.coords!} primaryColor={colors.primary} height={260} borderRadius={radii.lg} />
          </View>
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
          <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.statsLeft}>
              <Timer size={19} color={colors.plum} strokeWidth={1.5} />
              <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>Duration</Text>
            </View>
            <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
              {formatDuration(activity.durationMinutes)}
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
            <View style={styles.statsRowLast}>
              <View style={styles.statsLeft}>
                <Icon size={19} color={colors.plum} strokeWidth={1.5} />
                <Text style={[styles.statsLabel, { color: colors.secondaryText, fontFamily: font.regular }]}>Pace</Text>
              </View>
              <Text style={[styles.statsValue, { color: colors.foreground, fontFamily: font.semibold }]}>
                {activity.pace}
              </Text>
            </View>
          ) : null}
        </View>

        {activity.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <Text style={[styles.notesLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              NOTES
            </Text>
            <Text style={[styles.notesText, { color: colors.foreground, fontFamily: font.regular }]}>
              {activity.notes}
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
  headerTitle: { fontSize: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  typeIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  dateText: { fontSize: 14 },
  mapCard: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  statsCard: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 22, marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1 },
  statsRowLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  statsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statsLabel: { fontSize: 14 },
  statsValue: { fontSize: 15, fontVariant: ["tabular-nums"] },
  notesCard: { borderRadius: radii.lg, borderWidth: 1, padding: 18 },
  notesLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  notesText: { fontSize: 14, lineHeight: 22 },
  missing: { fontSize: 16, marginTop: 12, marginBottom: 20 },
});
