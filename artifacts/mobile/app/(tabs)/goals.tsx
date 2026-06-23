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

import { EmptyGoalsIllustration } from "@/components/Illustrations";
import { Goal, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function GoalCard({ goal, isActive, onDelete }: { goal: Goal; isActive: boolean; onDelete: () => void }) {
  const colors = useColors();
  const days = daysUntil(goal.targetDate);
  const isPast = days < 0;
  const shadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  };

  return (
    <View
      style={[
        styles.goalCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive && !isPast ? colors.primary : colors.border,
          borderWidth: isActive && !isPast ? 1.5 : 1,
          ...shadow,
        },
      ]}
    >
      {isActive && !isPast && (
        <View style={[styles.activePill, { backgroundColor: colors.secondary }]}>
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.activePillText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            Active
          </Text>
        </View>
      )}

      <View style={styles.goalBody}>
        <View style={styles.goalLeft}>
          <Text style={[styles.goalDistance, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {goal.targetDistanceKm} km
          </Text>
          <Text style={[styles.goalEvent, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {goal.targetEvent}
          </Text>
          <Text style={[styles.goalDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {formatDate(goal.targetDate)}
          </Text>
        </View>

        <View style={styles.goalRight}>
          <View style={[styles.countdownBox, { backgroundColor: isPast ? colors.muted : colors.secondary }]}>
            <Text style={[styles.countdownNum, { color: isPast ? colors.mutedForeground : colors.accent, fontFamily: "Inter_700Bold" }]}>
              {isPast ? "Done" : String(days)}
            </Text>
            {!isPast && (
              <Text style={[styles.countdownLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                days left
              </Text>
            )}
          </View>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Delete Goal", "Remove this goal?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
          >
            <Feather name="trash-2" size={15} color={colors.mutedForeground} />
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
  const shadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  };

  function handleAdd() {
    if (!event.trim()) { Alert.alert("Missing info", "Please enter a goal name."); return; }
    if (!distanceKm || isNaN(Number(distanceKm)) || Number(distanceKm) <= 0) {
      Alert.alert("Missing info", "Please enter a valid distance."); return;
    }
    if (!targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Missing info", "Please enter a date in YYYY-MM-DD format."); return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGoal({ targetEvent: event.trim(), targetDistanceKm: Number(distanceKm), targetDate });
    onClose();
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow }]}
    >
      <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        New Goal
      </Text>

      <View style={styles.formField}>
        <Text style={[styles.formLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Goal name
        </Text>
        <TextInput
          style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          value={event}
          onChangeText={setEvent}
          placeholder="e.g. 10km fun run"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Distance (km)
          </Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="6"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.formField, { flex: 1.5 }]}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Target date
          </Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      <View style={styles.formActions}>
        <Pressable
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => { Haptics.selectionAsync(); onClose(); }}
        >
          <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
          <Text style={[styles.addBtnText, { fontFamily: "Inter_600SemiBold" }]}>Add Goal</Text>
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
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.headerRow}>
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
            style={[styles.addGoalBtn, { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowForm(true); }}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </Animated.View>

      {showForm && <AddGoalForm onClose={() => setShowForm(false)} />}

      {goals.length === 0 && !showForm && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.emptyCard, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 2,
          }]}
        >
          <EmptyGoalsIllustration size={100} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Set your first goal
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Goals give your training purpose and unlock personalized daily suggestions.
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowForm(true); }}
          >
            <Text style={[styles.emptyBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              Create Goal
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {goals.map((goal, i) => (
        <Animated.View key={goal.id} entering={FadeInRight.delay(100 + i * 60).duration(300)}>
          <GoalCard goal={goal} isActive={i === 0} onDelete={() => deleteGoal(goal.id)} />
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
  screenTitle: { fontSize: 28, marginBottom: 2 },
  screenSub: { fontSize: 14 },
  addGoalBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  goalCard: { borderRadius: 20, padding: 18, marginBottom: 14 },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activePillText: { fontSize: 11 },
  goalBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  goalLeft: { flex: 1 },
  goalDistance: { fontSize: 28, marginBottom: 2 },
  goalEvent: { fontSize: 15, marginBottom: 4 },
  goalDate: { fontSize: 13 },
  goalRight: { alignItems: "flex-end", gap: 10 },
  countdownBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 70,
  },
  countdownNum: { fontSize: 20 },
  countdownLabel: { fontSize: 11 },
  deleteBtn: { padding: 6 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 10, marginBottom: 24 },
  emptyTitle: { fontSize: 17, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { fontSize: 14, color: "#FFFFFF" },
  formCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 20 },
  formTitle: { fontSize: 17, marginBottom: 16 },
  formField: { marginBottom: 12 },
  formLabel: { fontSize: 12, marginBottom: 6, letterSpacing: 0.3 },
  formInput: { borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  formRow: { flexDirection: "row", gap: 10 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 13, paddingVertical: 13, alignItems: "center" },
  cancelBtnText: { fontSize: 14 },
  addBtn: { flex: 1, borderRadius: 13, paddingVertical: 13, alignItems: "center" },
  addBtnText: { fontSize: 14, color: "#FFFFFF" },
});
