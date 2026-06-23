import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function StatRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        {value}
      </Text>
    </View>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getActivityBreakdown(activities: ReturnType<typeof useApp>["activities"]) {
  const counts: Record<string, number> = {};
  for (const a of activities) {
    counts[a.type] = (counts[a.type] ?? 0) + 1;
  }
  return counts;
}

const TYPE_LABELS: Record<string, string> = {
  run: "Runs",
  walk: "Walks",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, totalKm, totalActivities, weeklyKm, monthlyKm, activities } = useApp();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const breakdown = getActivityBreakdown(activities);
  const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert("Invalid name", "Name cannot be empty.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser({ name: trimmed });
    setEditing(false);
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
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Profile
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(400)}
        style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
            {getInitials(user.name)}
          </Text>
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <Pressable style={[styles.saveNameButton, { backgroundColor: colors.primary }]} onPress={handleSaveName}>
              <Feather name="check" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            onPress={() => {
              Haptics.selectionAsync();
              setNameInput(user.name);
              setEditing(true);
            }}
          >
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user.name}
            </Text>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
        <Text style={[styles.memberLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          From Couch to Fit
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(160).duration(400)}
        style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Lifetime Stats
        </Text>
        <StatRow label="Total distance" value={`${totalKm.toFixed(1)} km`} />
        <StatRow label="Total activities" value={String(totalActivities)} />
        <StatRow label="Total time" value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} />
        <StatRow label="This week" value={`${weeklyKm.toFixed(1)} km`} />
        <StatRow label="This month" value={`${monthlyKm.toFixed(1)} km`} />
      </Animated.View>

      {Object.keys(breakdown).length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Activity Breakdown
          </Text>
          {Object.entries(breakdown).map(([type, count]) => (
            <View key={type} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {TYPE_LABELS[type] ?? type}
              </Text>
              <View style={styles.breakdownRight}>
                <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.countText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                    {count}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(320).duration(400)}
        style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          About
        </Text>
        <View style={[styles.statRow, { borderBottomColor: "transparent" }]}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            From Couch to Fit is a calm, welcoming companion for your fitness journey — no pressure, just progress.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, marginBottom: 24 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 26, color: "#FFFFFF" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  userName: { fontSize: 22 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, width: "100%" },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    textAlign: "center",
  },
  saveNameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberLabel: { fontSize: 13 },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, marginBottom: 14 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statLabel: { fontSize: 14, flex: 1, lineHeight: 20 },
  statValue: { fontSize: 14 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  breakdownRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: { fontSize: 14 },
});
