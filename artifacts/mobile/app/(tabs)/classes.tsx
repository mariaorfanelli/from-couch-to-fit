import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Moon,
  Play,
  Route as RouteIcon,
  Sparkles,
  Timer,
} from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { font, radii, shadow1 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface ClassItem {
  id: string;
  title: string;
  duration: string;
  tag: string;
  Icon: any;
  activityType: ActivityType;
}

const CLASSES: ClassItem[] = [
  { id: "pilates-gentle", title: "Gentle Pilates flow", duration: "20 min", tag: "restorative · no pressure", Icon: Flower2, activityType: "pilates" },
  { id: "yoga-restorative", title: "Restorative yoga", duration: "30 min", tag: "calming · slow breath", Icon: Heart, activityType: "yoga" },
  { id: "walk-mindful", title: "Mindful evening walk", duration: "25 min", tag: "outdoors · soft pace", Icon: Footprints, activityType: "walk" },
  { id: "stretch-morning", title: "Morning stretch", duration: "10 min", tag: "wake-up · breathe slow", Icon: Sparkles, activityType: "yoga" },
  { id: "strength-mobility", title: "Mobility & strength", duration: "20 min", tag: "no weights · gentle reps", Icon: Dumbbell, activityType: "strength" },
  { id: "run-easy", title: "Easy-pace short run", duration: "15 min", tag: "warm-up · low effort", Icon: RouteIcon, activityType: "run" },
  { id: "wind-down", title: "Wind-down body scan", duration: "12 min", tag: "evening · for sleep", Icon: Moon, activityType: "yoga" },
];

const FILTERS: { id: ActivityType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pilates", label: "Pilates" },
  { id: "yoga", label: "Yoga" },
  { id: "walk", label: "Walking" },
  { id: "run", label: "Running" },
  { id: "strength", label: "Strength" },
];

export default function ClassesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferredActivities } = useApp();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = filter === "all" ? CLASSES : CLASSES.filter((c) => c.activityType === filter);
  const recommended = filtered.filter((c) => preferredActivities.includes(c.activityType));
  const others = filtered.filter((c) => !preferredActivities.includes(c.activityType));

  function openClass(c: ClassItem) {
    Haptics.selectionAsync();
    router.push({ pathname: "/(tabs)/log", params: { preset: c.activityType } });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>Classes</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
          Gentle, guided sessions — pick one that meets you where you are.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 18 }}
        >
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.id);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: on ? colors.primary : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: on ? "#FFFFFF" : colors.secondaryText, fontFamily: on ? font.semibold : font.medium }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {recommended.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              JUST FOR YOU
            </Text>
            <View style={{ gap: 12, marginBottom: 24 }}>
              {recommended.map((c, i) => (
                <ClassCard key={c.id} item={c} index={i} onPress={() => openClass(c)} highlight />
              ))}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
          {recommended.length > 0 ? "MORE GENTLE OPTIONS" : "BROWSE ALL"}
        </Text>
        <View style={{ gap: 12 }}>
          {others.map((c, i) => (
            <ClassCard key={c.id} item={c} index={i} onPress={() => openClass(c)} />
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              No classes in this category yet — try another filter.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ClassCard({ item, index, onPress, highlight }: { item: ClassItem; index: number; onPress: () => void; highlight?: boolean }) {
  const colors = useColors();
  const { Icon } = item;
  return (
    <Animated.View entering={FadeInDown.delay(40 * index).duration(300)}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: highlight ? colors.primary : colors.border,
            borderWidth: highlight ? 1.5 : 1,
            ...shadow1,
          },
        ]}
      >
        <View style={[styles.cardIcon, { backgroundColor: highlight ? colors.secondary : colors.cardAlt }]}>
          <Icon size={24} color={highlight ? colors.primaryDeep : colors.plum} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: font.semibold }]}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Timer size={13} color={colors.mutedForeground} strokeWidth={1.5} />
            <Text style={[styles.cardMeta, { color: colors.mutedForeground, fontFamily: font.regular }]}>
              {item.duration} · {item.tag}
            </Text>
          </View>
        </View>
        <View style={[styles.playBubble, { backgroundColor: colors.blushTint }]}>
          <Play size={16} color={colors.primaryDeep} strokeWidth={2} fill={colors.primaryDeep} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 18 },
  title: { fontSize: 32, letterSpacing: -0.4, marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 22 },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13 },

  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: radii.lg,
    padding: 14,
  },
  cardIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardMeta: { fontSize: 12 },
  playBubble: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  empty: { borderRadius: radii.lg, borderWidth: 1, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
