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
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Goal, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function GoalCard({ goal, isActive, onDelete }: { goal: Goal; isActive: boolean; onDelete: () => void }) {
  const colors = useColors();
  const days = daysUntil(goal.targetDate);
  const isPast = days < 0;

  return (
    <View
      style={[
        styles.goalCard,
        {
          backgroundColor: isActive && !isPast ? colors.card : colors.muted,
          borderColor: isActive && !isPast ? colors.primary : colors.border,
          borderWidth: isActive && !isPast ? 1.5 : 1,
        },
      ]}
    >
      {isActive && !isPast && (
        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.activeBadgeText, { fontFamily: "Inter_600SemiBold" }]}>Active</Text>
        </View>
      )}
      <View style={styles.goalRow}>
        <View style={styles.goalLeft}>
          <Text style={[styles.goalEvent, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {goal.targetEvent}
          </Text>
          <Text style={[styles.goalDistance, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {goal.targetDistanceKm} km
          </Text>
          <Text style={[styles.goalDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {formatDate(goal.targetDate)}
          </Text>
        </View>
        <View style={styles.goalRight}>
          {isPast ? (
            <View style={[styles.daysBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.daysNum, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                Done
              </Text>
            </View>
          ) : (
            <View style={[styles.daysBadge, { backgroundColor: isActive ? colors.secondary : colors.muted }]}>
              <Text style={[styles.daysNum, { color: isActive ? colors.accent : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                {days}
              </Text>
              <Text style={[styles.daysLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                days left
              </Text>
            </View>
          )}
          <Pressable
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Delete Goal", "Remove this goal?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
          >
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const { addGoal } = useApp();
  const [event, setEvent] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function handleAdd() {
    if (!event.trim()) {
      Alert.alert("Missing info", "Please enter a goal name.");
      return;
    }
    if (!distanceKm || isNaN(Number(distanceKm)) || Number(distanceKm) <= 0) {
      Alert.alert("Missing info", "Please enter a valid distance.");
      return;
    }
    if (!targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Missing info", "Please enter a date in YYYY-MM-DD format.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGoal({
      targetEvent: event.trim(),
      targetDistanceKm: Number(distanceKm),
      targetDate,
    });
    onClose();
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        New Goal
      </Text>
      <View style={styles.formGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Event / Goal name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          value={event}
          onChangeText={setEvent}
          placeholder="e.g. 10km fun run"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Distance (km)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="6"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1.4 }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Target date
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>
      <View style={styles.formButtons}>
        <Pressable
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            onClose();
          }}
        >
          <Text style={[styles.cancelButtonText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
        >
          <Text style={[styles.addButtonText, { fontFamily: "Inter_600SemiBold" }]}>
            Add Goal
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, deleteGoal } = useApp();
  const [showForm, setShowForm] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
      <Animated.View
        entering={FadeInDown.delay(0).duration(400)}
        style={styles.headerRow}
      >
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Goals
          </Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Train with intention
          </Text>
        </View>
        {!showForm && (
          <Pressable
            style={[styles.addGoalButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowForm(true);
            }}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </Animated.View>

      {showForm && (
        <AddGoalForm onClose={() => setShowForm(false)} />
      )}

      {goals.length === 0 && !showForm && (
        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="flag" size={36} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Set your first goal
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Goals give your training purpose. Set a target event or distance to work toward.
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowForm(true);
            }}
          >
            <Text style={[styles.emptyButtonText, { fontFamily: "Inter_600SemiBold" }]}>
              Create Goal
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {goals.map((goal, i) => (
        <Animated.View key={goal.id} entering={FadeInRight.delay(120 + i * 60).duration(300)}>
          <GoalCard
            goal={goal}
            isActive={i === 0}
            onDelete={() => deleteGoal(goal.id)}
          />
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  screenTitle: { fontSize: 28, marginBottom: 4 },
  screenSub: { fontSize: 15 },
  addGoalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  goalCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    overflow: "hidden",
  },
  activeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  activeBadgeText: { fontSize: 11, color: "#FFFFFF" },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  goalLeft: { flex: 1 },
  goalEvent: { fontSize: 17, marginBottom: 4 },
  goalDistance: { fontSize: 28, marginBottom: 4 },
  goalDate: { fontSize: 13 },
  goalRight: { alignItems: "flex-end", gap: 10 },
  daysBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },
  daysNum: { fontSize: 20 },
  daysLabel: { fontSize: 11 },
  deleteButton: { padding: 4 },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: { fontSize: 14, color: "#FFFFFF" },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  formTitle: { fontSize: 17, marginBottom: 16 },
  formGroup: { marginBottom: 12 },
  formRow: { flexDirection: "row", gap: 10 },
  fieldLabel: { fontSize: 12, marginBottom: 6, letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  formButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14 },
  addButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  addButtonText: { fontSize: 14, color: "#FFFFFF" },
});
