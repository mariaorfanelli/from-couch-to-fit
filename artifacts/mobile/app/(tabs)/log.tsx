import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  Dumbbell,
  Edit3,
  Flower2,
  Footprints,
  Heart,
  MapPin,
  Pause,
  Play,
  Route as RouteIcon,
  Square,
  Wind,
} from "lucide-react-native";
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapTracker from "@/components/MapTracker";
import GradientButton from "@/components/ui/GradientButton";
import { ctaShadow, font, radii, shadow1, shadow2 } from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  finishTracking,
  getSnapshot,
  pauseTracking,
  resumeTracking,
  startTracking,
  subscribe,
} from "@/lib/locationTracking";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.32);

const GPS_TYPES: { type: ActivityType; label: string; Icon: any }[] = [
  { type: "run", label: "Run", Icon: Wind },
  { type: "walk", label: "Walk", Icon: Footprints },
];

const MANUAL_TYPES: { type: ActivityType; label: string; Icon: any }[] = [
  { type: "pilates", label: "Pilates", Icon: Flower2 },
  { type: "yoga", label: "Yoga", Icon: Heart },
  { type: "strength", label: "Strength", Icon: Dumbbell },
];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatPace(distKm: number, secs: number): string {
  if (distKm < 0.01) return "--";
  const secPerKm = secs / distKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RecordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useApp();
  const params = useLocalSearchParams<{ preset?: ActivityType; experimentId?: string; dayIndex?: string }>();
  const experimentId = params.experimentId;
  const dayIndex = params.dayIndex;

  const [selectedType, setSelectedType] = useState<ActivityType>(params.preset ?? "run");
  const [mode, setMode] = useState<"gps" | "manual">(
    params.preset && !GPS_TYPES.find((g) => g.type === params.preset) ? "manual" : "gps"
  );
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [currentRegion, setCurrentRegion] = useState<any>(null);

  // Tracking state lives in the locationTracking store; we just subscribe.
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const mapRef = useRef<any>(null);

  const [manualDuration, setManualDuration] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 130 : 130;

  const snap = getSnapshot();
  const trackingState = snap.state;
  const coords = snap.coords;
  const distanceKm = snap.distanceKm;
  const elapsedSeconds = snap.seconds;

  useEffect(() => subscribe(forceRender), []);

  useEffect(() => {
    if (trackingState !== "tracking") return;
    const id = setInterval(forceRender, 1000);
    return () => clearInterval(id);
  }, [trackingState]);

  useEffect(() => {
    if (Platform.OS !== "web" && mode === "gps") requestPermission();
  }, [mode]);

  useEffect(() => {
    if (coords.length === 0) return;
    const last = coords[coords.length - 1];
    const region = { latitude: last.latitude, longitude: last.longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 };
    setCurrentRegion(region);
    if (trackingState !== "idle") mapRef.current?.animateToRegion(region, 500);
  }, [coords.length]);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setPermissionStatus("granted");
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        });
      } catch {}
    } else {
      setPermissionStatus("denied");
    }
  }

  async function handleStart() {
    const result = await startTracking();
    if (result === "denied") {
      setPermissionStatus("denied");
      return;
    }
    setPermissionStatus("granted");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handlePause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pauseTracking();
  }

  function handleResume() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resumeTracking();
  }

  async function finishWorkout() {
    const { coords: finalCoords, distanceKm: finalDistance, seconds: finalSeconds } = await finishTracking();

    if (finalSeconds < 5) {
      Alert.alert("Too short", "Your workout was too short to save. Try again!");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalPace = formatPace(finalDistance, finalSeconds);

    const id = addActivity({
      date: todayString(),
      type: selectedType,
      durationMinutes: Math.max(1, Math.round(finalSeconds / 60)),
      distanceKm: finalDistance > 0 ? parseFloat(finalDistance.toFixed(2)) : undefined,
      pace: finalPace !== "--" ? `${finalPace} /km` : undefined,
      coords: finalCoords.length > 1 ? finalCoords : undefined,
    });

    if (experimentId && dayIndex != null) {
      router.replace({
        pathname: "/experiments/reflection",
        params: { experimentId, dayIndex, activityId: id },
      });
    } else {
      router.push({ pathname: "/activity-summary", params: { id } });
    }
  }

  function handleFinish() {
    Alert.alert("Finish your session?", "Save and end your current activity?", [
      { text: "Cancel", style: "cancel" },
      { text: "Finish", style: "default", onPress: finishWorkout },
    ]);
  }

  function handleManualSave() {
    if (!manualDuration || isNaN(Number(manualDuration)) || Number(manualDuration) <= 0) {
      Alert.alert("Missing info", "Please enter a valid duration in minutes.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = addActivity({
      date: todayString(),
      type: selectedType,
      durationMinutes: Number(manualDuration),
      notes: manualNotes.trim() || undefined,
    });
    if (experimentId && dayIndex != null) {
      router.replace({
        pathname: "/experiments/reflection",
        params: { experimentId, dayIndex, activityId: id },
      });
    } else {
      router.push({ pathname: "/activity-summary", params: { id } });
    }
    setManualDuration("");
    setManualNotes("");
  }

  const pace = formatPace(distanceKm, elapsedSeconds);

  const showPermissionDenied = Platform.OS !== "web" && mode === "gps" && permissionStatus === "denied";

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      {/* Header */}
      <View style={[styles.headerStrip, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: font.display }]}>
          Track
        </Text>
        <View style={[styles.modeToggle, { backgroundColor: colors.secondary }]}>
          {(["gps", "manual"] as const).map((m) => (
            <Pressable
              key={m}
              style={[
                styles.modeTab,
                mode === m && { backgroundColor: colors.card, ...shadow1 },
              ]}
              onPress={() => {
                if (trackingState !== "idle") return;
                Haptics.selectionAsync();
                setMode(m);
                setSelectedType(m === "gps" ? "run" : "pilates");
              }}
            >
              {m === "gps" ? (
                <MapPin size={14} color={mode === m ? colors.primaryDeep : colors.mutedForeground} strokeWidth={1.5} />
              ) : (
                <Edit3 size={14} color={mode === m ? colors.primaryDeep : colors.mutedForeground} strokeWidth={1.5} />
              )}
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === m ? colors.primaryDeep : colors.mutedForeground,
                    fontFamily: mode === m ? font.semibold : font.regular,
                  },
                ]}
              >
                {m === "gps" ? "GPS Track" : "Manual"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === "gps" ? (
        <View style={styles.gpsContainer}>
          {/* Activity type chips */}
          <View style={styles.typeRow}>
            {GPS_TYPES.map(({ type, label, Icon }) => {
              const on = selectedType === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: on ? colors.primary : colors.card,
                      borderColor: on ? colors.primary : colors.border,
                      ...shadow1,
                    },
                  ]}
                  onPress={() => {
                    if (trackingState !== "idle") return;
                    Haptics.selectionAsync();
                    setSelectedType(type);
                  }}
                >
                  <Icon size={14} color={on ? "#FFFFFF" : colors.mutedForeground} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: on ? "#FFFFFF" : colors.foreground, fontFamily: on ? font.semibold : font.regular },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Map */}
          {showPermissionDenied ? (
            <View style={[styles.mapFallback, { backgroundColor: colors.secondary, height: MAP_HEIGHT }]}>
              <AlertCircle size={36} color={colors.primaryDeep} strokeWidth={1.5} />
              <Text style={[styles.fallbackTitle, { color: colors.foreground, fontFamily: font.medium }]}>
                Location access needed
              </Text>
              <Text style={[styles.fallbackSub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
                GPS tracking uses your location to draw your route. Enable it in Settings.
              </Text>
              <Pressable style={[styles.grantBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                <Text style={[styles.grantBtnText, { fontFamily: font.semibold }]}>Grant permission</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <MapTracker
                coords={coords}
                region={currentRegion}
                mapRef={mapRef}
                primaryColor={colors.primary}
                height={MAP_HEIGHT}
              />
              {trackingState === "tracking" && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.statusPill, { backgroundColor: colors.card }, shadow1]}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.statusText, { color: colors.secondaryText, fontFamily: font.semibold }]}>
                    Recording · GPS strong
                  </Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* Metrics + controls */}
          <View style={styles.metricsArea}>
            <Text style={[styles.metricCap, { color: colors.mutedForeground, fontFamily: font.semibold }]}>TIME</Text>
            <Text style={[styles.timeBig, { color: colors.foreground, fontFamily: font.displayLight }]}>
              {formatTime(elapsedSeconds)}
            </Text>
            <View style={[styles.metricsBottomRow, { borderTopColor: colors.border }]}>
              <View style={styles.metricBlock}>
                <Text style={[styles.metricCap, { color: colors.mutedForeground, fontFamily: font.semibold }]}>DISTANCE</Text>
                <Text style={[styles.metricBig, { color: colors.foreground, fontFamily: font.displayLight }]}>
                  {distanceKm.toFixed(2)}
                  <Text style={[styles.metricUnit, { color: colors.mutedForeground, fontFamily: font.regular }]}> km</Text>
                </Text>
              </View>
              <View style={[styles.metricsDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricBlock}>
                <Text style={[styles.metricCap, { color: colors.mutedForeground, fontFamily: font.semibold }]}>PACE</Text>
                <Text style={[styles.metricBig, { color: colors.foreground, fontFamily: font.displayLight }]}>
                  {pace}
                  <Text style={[styles.metricUnit, { color: colors.mutedForeground, fontFamily: font.regular }]}> /km</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={[styles.controlsRow, { paddingBottom: bottomPad }]}>
            {trackingState === "idle" && (
              <Pressable
                style={[styles.bigCircleBtn, ctaShadow]}
                onPress={permissionStatus === "granted" || Platform.OS === "web" ? handleStart : requestPermission}
              >
                <View style={[styles.bigCircleFill, { backgroundColor: colors.primary }]}>
                  <Play size={34} color="#FFFFFF" strokeWidth={1.8} fill="#FFFFFF" />
                </View>
              </Pressable>
            )}

            {trackingState === "tracking" && (
              <View style={styles.triRow}>
                <Pressable style={[styles.sideBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]} onPress={handleFinish}>
                  <Square size={22} color={colors.primaryDeep} strokeWidth={1.5} fill={colors.primaryDeep} />
                </Pressable>
                <Pressable style={[styles.bigCircleBtn, ctaShadow]} onPress={handlePause}>
                  <View style={[styles.bigCircleFill, { backgroundColor: colors.primary }]}>
                    <Pause size={34} color="#FFFFFF" strokeWidth={1.8} fill="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={styles.sideBtnPlaceholder} />
              </View>
            )}

            {trackingState === "paused" && (
              <View style={styles.triRow}>
                <Pressable style={[styles.sideBtn, { backgroundColor: colors.card, borderColor: colors.border, ...shadow1 }]} onPress={handleFinish}>
                  <Square size={22} color={colors.primaryDeep} strokeWidth={1.5} fill={colors.primaryDeep} />
                </Pressable>
                <Pressable style={[styles.bigCircleBtn, ctaShadow]} onPress={handleResume}>
                  <View style={[styles.bigCircleFill, { backgroundColor: colors.primary }]}>
                    <Play size={34} color="#FFFFFF" strokeWidth={1.8} fill="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={styles.sideBtnPlaceholder} />
              </View>
            )}
          </View>
          {trackingState === "tracking" && (
            <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              Tap the square to finish · long-press the avatar to lock
            </Text>
          )}
        </View>
      ) : (
        /* Manual entry */
        <ScrollView
          style={styles.manualScroll}
          contentContainerStyle={[styles.manualContent, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
            ACTIVITY TYPE
          </Text>
          <View style={styles.manualTypeGrid}>
            {MANUAL_TYPES.map(({ type, label, Icon }) => {
              const on = selectedType === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.manualTypeChip,
                    {
                      backgroundColor: on ? colors.primary : colors.card,
                      borderColor: on ? colors.primary : colors.border,
                      ...shadow1,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedType(type); }}
                >
                  <Icon size={16} color={on ? "#FFFFFF" : colors.mutedForeground} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.manualTypeText,
                      { color: on ? "#FFFFFF" : colors.foreground, fontFamily: on ? font.semibold : font.regular },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: font.medium, marginTop: 24 }]}>
            DURATION (MINUTES)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: font.regular }]}
            value={manualDuration}
            onChangeText={setManualDuration}
            placeholder="e.g. 45"
            placeholderTextColor="#B6AFBA"
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: font.medium, marginTop: 20 }]}>
            NOTES (OPTIONAL)
          </Text>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: font.regular }]}
            value={manualNotes}
            onChangeText={setManualNotes}
            placeholder="How did it feel?"
            placeholderTextColor="#B6AFBA"
            multiline
            textAlignVertical="top"
          />

          <View style={{ marginTop: 24 }}>
            <GradientButton label="Save activity" onPress={handleManualSave} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerStrip: { paddingHorizontal: 22, paddingBottom: 12 },
  screenTitle: { fontSize: 30, letterSpacing: -0.3, marginBottom: 12 },
  modeToggle: { flexDirection: "row", borderRadius: 14, padding: 4 },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  modeTabText: { fontSize: 13 },

  gpsContainer: { flex: 1 },
  typeRow: { flexDirection: "row", gap: 10, paddingHorizontal: 22, paddingBottom: 12 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1 },
  typeChipText: { fontSize: 14 },

  mapFallback: { alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32, borderRadius: radii.lg, marginHorizontal: 22 },
  fallbackTitle: { fontSize: 16, textAlign: "center" },
  fallbackSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  grantBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  grantBtnText: { fontSize: 14, color: "#FFFFFF" },

  statusPill: {
    position: "absolute",
    top: 14,
    left: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12 },

  metricsArea: { flex: 1, justifyContent: "center", paddingHorizontal: 30, paddingVertical: 12 },
  metricCap: { fontSize: 11, letterSpacing: 1.5, textAlign: "center" },
  timeBig: {
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: -1.5,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    marginTop: 8,
    marginBottom: 28,
  },
  metricsBottomRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, paddingTop: 22 },
  metricBlock: { flex: 1, alignItems: "center", gap: 8 },
  metricBig: { fontSize: 34, lineHeight: 36, letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  metricUnit: { fontSize: 14 },
  metricsDivider: { width: 1, height: 50 },

  controlsRow: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 8 },
  triRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22, width: "100%" },
  bigCircleBtn: { width: 88, height: 88, borderRadius: 44 },
  bigCircleFill: { flex: 1, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  sideBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  sideBtnPlaceholder: { width: 60, height: 60 },
  hint: { textAlign: "center", fontSize: 12, marginBottom: 8 },

  manualScroll: { flex: 1 },
  manualContent: { paddingHorizontal: 22, paddingTop: 8 },
  fieldLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 10 },
  manualTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  manualTypeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, borderWidth: 1 },
  manualTypeText: { fontSize: 14 },
  input: { borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  notesInput: { height: 100, paddingTop: 15 },
});
