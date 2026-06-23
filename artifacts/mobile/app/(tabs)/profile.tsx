import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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

const TYPE_LABELS: Record<string, string> = {
  run: "Runs",
  walk: "Walks",
  pilates: "Pilates",
  yoga: "Yoga",
  strength: "Strength",
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatItem({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statItemLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.statItemValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, totalKm, totalActivities, weeklyKm, monthlyKm, activities } = useApp();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalMinutes = activities.reduce((s, a) => s + a.durationMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const breakdown: Record<string, number> = {};
  for (const a of activities) {
    breakdown[a.type] = (breakdown[a.type] ?? 0) + 1;
  }

  const shadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  };

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          signOut();
          router.replace("/auth");
        },
      },
    ]);
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
        entering={FadeInDown.delay(60).duration(400)}
        style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {getInitials(user?.name ?? "F")}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => setEditing(false)}
            />
            <Pressable
              style={[styles.saveNameBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setEditing(false);
              }}
            >
              <Feather name="check" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            onPress={() => { Haptics.selectionAsync(); setNameInput(user?.name ?? ""); setEditing(true); }}
          >
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user?.name}
            </Text>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}

        <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {user?.email}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(400)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Lifetime Stats
        </Text>
        <StatItem label="Total distance" value={`${totalKm.toFixed(1)} km`} />
        <StatItem label="Total activities" value={String(totalActivities)} />
        <StatItem label="Total time" value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} />
        <StatItem label="This week" value={`${weeklyKm.toFixed(1)} km`} />
        <StatItem label="This month" value={`${monthlyKm.toFixed(1)} km`} />
      </Animated.View>

      {Object.keys(breakdown).length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            By Activity
          </Text>
          {Object.entries(breakdown).map(([type, count]) => (
            <View key={type} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statItemLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {TYPE_LABELS[type] ?? type}
              </Text>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.countPillText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {count}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(240).duration(400)}>
        <Pressable
          style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
          <Text style={[styles.signOutText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Sign Out
          </Text>
        </Pressable>
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
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 26 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  userName: { fontSize: 22 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, width: "100%" },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 18,
    textAlign: "center",
  },
  saveNameBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userEmail: { fontSize: 13 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, marginBottom: 12 },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statItemLabel: { fontSize: 14 },
  statItemValue: { fontSize: 14 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  countPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  countPillText: { fontSize: 13 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 8,
  },
  signOutText: { fontSize: 15 },
});
