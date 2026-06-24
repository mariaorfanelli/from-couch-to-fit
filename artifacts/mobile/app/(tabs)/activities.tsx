import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ChevronRight,
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Route as RouteIcon,
} from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyActivitiesIllustration } from "@/components/Illustrations";
import { font, radii, shadow1 } from "@/constants/theme";
import { Activity, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const LABELS: Record<Activity["type"], string> = {
  run: "Run",
  walk: "Walk",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength",
};

const ICONS: Record<Activity["type"], any> = {
  run: RouteIcon,
  walk: Footprints,
  pilates: Flower2,
  yoga: Heart,
  strength: Dumbbell,
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByMonth(activities: Activity[]) {
  const groups = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = new Date(a.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const arr = groups.get(key) ?? [];
    arr.push(a);
    groups.set(key, arr);
  }
  return Array.from(groups.entries());
}

export default function ActivitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const groups = groupByMonth(activities);

  function open(id: string) {
    Haptics.selectionAsync();
    router.push({ pathname: "/activity/[id]", params: { id } });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
          Activities
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
          Every soft step, in order.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <EmptyActivitiesIllustration size={110} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              Your recorded walks, runs and flows will appear here.
            </Text>
          </View>
        ) : (
          groups.map(([month, items]) => (
            <View key={month} style={{ marginBottom: 24 }}>
              <Text style={[styles.monthLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
                {month.toUpperCase()}
              </Text>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
                {items.map((a, i) => {
                  const Icon = ICONS[a.type];
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => open(a.id)}
                      style={[
                        styles.row,
                        { borderBottomColor: colors.border, borderBottomWidth: i < items.length - 1 ? 1 : 0 },
                      ]}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                        <Icon size={16} color={colors.primaryDeep} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowType, { color: colors.foreground, fontFamily: font.semibold }]}>
                          {LABELS[a.type]}
                        </Text>
                        <Text style={[styles.rowMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                          {fmtDate(a.date)}
                          {a.distanceKm ? ` · ${a.distanceKm}km` : ""}
                          {` · ${a.durationMinutes}min`}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 18 },
  title: { fontSize: 32, letterSpacing: -0.4, marginBottom: 4 },
  sub: { fontSize: 14 },
  monthLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowType: { fontSize: 14, marginBottom: 2 },
  rowMeta: { fontSize: 12 },
  empty: { borderRadius: radii.lg, borderWidth: 1, padding: 32, alignItems: "center", gap: 10, marginTop: 12 },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
