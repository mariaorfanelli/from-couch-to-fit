import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapTracker from "@/components/MapTracker";
import { ActivityType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.42);

type LatLng = { latitude: number; longitude: number };
type TrackingState = "idle" | "tracking" | "paused";

const GPS_TYPES: ActivityType[] = ["run", "walk"];
const MANUAL_TYPES: { type: ActivityType; label: string; icon: string }[] = [
  { type: "pilates", label: "Pilates", icon: "activity" },
  { type: "yoga", label: "Yoga", icon: "heart" },
  { type: "strength", label: "Strength", icon: "zap" },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function MetricBox({ label, value, sub, colors }: { label: string; value: string; sub?: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.metricBox}>
      <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
      {sub ? (
        <Text style={[styles.metricSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {sub}
        </Text>
      ) : null}
      <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

export default function RecordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useApp();

  const [selectedType, setSelectedType] = useState<ActivityType>("run");
  const [mode, setMode] = useState<"gps" | "manual">("gps");

  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");
  const [coords, setCoords] = useState<LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentRegion, setCurrentRegion] = useState<any>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const distanceRef = useRef(0);
  const coordsRef = useRef<LatLng[]>([]);
  const secondsRef = useRef(0);
  const mapRef = useRef<any>(null);

  const [manualDuration, setManualDuration] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (Platform.OS !== "web" && mode === "gps") {
      requestPermission();
    }
    return () => {
      stopAll();
    };
  }, [mode]);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setPermissionStatus("granted");
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      });
    } else {
      setPermissionStatus("denied");
    }
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setElapsedSeconds(secondsRef.current);
    }, 1000);
  }

  function stopAll() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  }

  async function startTracking() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTrackingState("tracking");
    startTimer();

    if (Platform.OS === "web") return;

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 5 },
      (location) => {
        const newPt: LatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const prev = coordsRef.current[coordsRef.current.length - 1];
        if (prev) {
          const delta = haversineKm(prev.latitude, prev.longitude, newPt.latitude, newPt.longitude);
          if (delta > 0.005) {
            distanceRef.current += delta;
            setDistanceKm(distanceRef.current);
          }
        }
        coordsRef.current = [...coordsRef.current, newPt];
        setCoords([...coordsRef.current]);
        const region = { latitude: newPt.latitude, longitude: newPt.longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 };
        setCurrentRegion(region);
        mapRef.current?.animateToRegion(region, 500);
      }
    );
  }

  function pauseTracking() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTrackingState("paused");
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  }

  function resumeTracking() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startTracking();
  }

  function resetState() {
    setTrackingState("idle");
    setCoords([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    coordsRef.current = [];
    distanceRef.current = 0;
    secondsRef.current = 0;
  }

  function finishWorkout() {
    stopAll();

    const finalDistance = distanceRef.current;
    const finalSeconds = secondsRef.current;
    const finalPace = formatPace(finalDistance, finalSeconds);

    if (finalSeconds < 5) {
      Alert.alert("Too short", "Your workout was too short to save. Try again!");
      resetState();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addActivity({
      date: todayString(),
      type: selectedType,
      durationMinutes: Math.max(1, Math.round(finalSeconds / 60)),
      distanceKm: finalDistance > 0 ? parseFloat(finalDistance.toFixed(2)) : undefined,
      pace: finalPace !== "--" ? `${finalPace} /km` : undefined,
    });

    router.push({
      pathname: "/activity-summary",
      params: {
        type: selectedType,
        duration: String(Math.max(1, Math.round(finalSeconds / 60))),
        distance: finalDistance > 0 ? finalDistance.toFixed(2) : "",
        pace: finalPace !== "--" ? `${finalPace} /km` : "",
        notes: "",
      },
    });

    resetState();
  }

  function handleFinish() {
    Alert.alert("Finish Workout?", "Save and end your current session?", [
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
    addActivity({
      date: todayString(),
      type: selectedType,
      durationMinutes: Number(manualDuration),
      notes: manualNotes.trim() || undefined,
    });
    router.push({
      pathname: "/activity-summary",
      params: {
        type: selectedType,
        duration: manualDuration,
        distance: "",
        pace: "",
        notes: manualNotes.trim(),
      },
    });
    setManualDuration("");
    setManualNotes("");
  }

  const pace = formatPace(distanceKm, elapsedSeconds);

  const cardShadow = {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  };

  const showPermissionDenied = Platform.OS !== "web" && mode === "gps" && permissionStatus === "denied";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerStrip, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Record
        </Text>
        <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
          {(["gps", "manual"] as const).map((m) => (
            <Pressable
              key={m}
              style={[
                styles.modeTab,
                mode === m && { backgroundColor: colors.card, ...cardShadow },
              ]}
              onPress={() => {
                if (trackingState !== "idle") return;
                Haptics.selectionAsync();
                setMode(m);
                setSelectedType(m === "gps" ? "run" : "pilates");
              }}
            >
              <Feather
                name={m === "gps" ? "map-pin" : "edit-3"}
                size={14}
                color={mode === m ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === m ? colors.primary : colors.mutedForeground,
                    fontFamily: mode === m ? "Inter_600SemiBold" : "Inter_400Regular",
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
            {GPS_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: selectedType === type ? colors.primary : colors.card,
                    borderColor: selectedType === type ? colors.primary : colors.border,
                    ...cardShadow,
                  },
                ]}
                onPress={() => {
                  if (trackingState !== "idle") return;
                  Haptics.selectionAsync();
                  setSelectedType(type);
                }}
              >
                <Feather
                  name={type === "run" ? "wind" : "navigation"}
                  size={14}
                  color={selectedType === type ? "#FFFFFF" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: selectedType === type ? "#FFFFFF" : colors.foreground,
                      fontFamily: selectedType === type ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {type === "run" ? "Run" : "Walk"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Map area */}
          {showPermissionDenied ? (
            <View style={[styles.mapFallback, { backgroundColor: colors.muted, height: MAP_HEIGHT }]}>
              <Feather name="alert-circle" size={36} color={colors.primary} />
              <Text style={[styles.fallbackTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Location access needed
              </Text>
              <Text style={[styles.fallbackSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                GPS tracking uses your location to draw your route and calculate distance. Please enable it in Settings.
              </Text>
              <Pressable style={[styles.grantBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                <Text style={[styles.grantBtnText, { fontFamily: "Inter_600SemiBold" }]}>Grant Permission</Text>
              </Pressable>
            </View>
          ) : (
            <MapTracker
              coords={coords}
              region={currentRegion}
              mapRef={mapRef}
              primaryColor={colors.primary}
              height={MAP_HEIGHT}
            />
          )}

          {/* Metrics + controls panel */}
          <View style={[styles.metricsPanel, { backgroundColor: colors.card, borderTopColor: colors.border, flex: 1 }]}>
            <View style={styles.metricsRow}>
              <MetricBox label="Time" value={formatTime(elapsedSeconds)} colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MetricBox label="Distance" value={distanceKm.toFixed(2)} sub="km" colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MetricBox label="Pace" value={pace} sub="/km" colors={colors} />
            </View>

            <View style={[styles.controlsRow, { paddingBottom: bottomPadding + 12 }]}>
              {trackingState === "idle" && (
                <Pressable
                  style={[styles.startBtn, { backgroundColor: colors.primary }]}
                  onPress={permissionStatus === "granted" || Platform.OS === "web" ? startTracking : requestPermission}
                >
                  <Feather name="play" size={22} color="#FFFFFF" />
                  <Text style={[styles.startBtnText, { fontFamily: "Inter_600SemiBold" }]}>Start</Text>
                </Pressable>
              )}

              {trackingState === "tracking" && (
                <>
                  <Pressable
                    style={[styles.halfBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, ...cardShadow }]}
                    onPress={pauseTracking}
                  >
                    <Feather name="pause" size={20} color={colors.foreground} />
                    <Text style={[styles.halfBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Pause</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.halfBtn, { backgroundColor: colors.accent }]}
                    onPress={handleFinish}
                  >
                    <Feather name="stop-circle" size={20} color="#FFFFFF" />
                    <Text style={[styles.halfBtnText, { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" }]}>Finish</Text>
                  </Pressable>
                </>
              )}

              {trackingState === "paused" && (
                <>
                  <Pressable
                    style={[styles.halfBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, ...cardShadow }]}
                    onPress={resumeTracking}
                  >
                    <Feather name="play" size={20} color={colors.primary} />
                    <Text style={[styles.halfBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Resume</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.halfBtn, { backgroundColor: colors.accent }]}
                    onPress={handleFinish}
                  >
                    <Feather name="stop-circle" size={20} color="#FFFFFF" />
                    <Text style={[styles.halfBtnText, { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" }]}>Finish</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      ) : (
        /* Manual entry */
        <ScrollView
          style={styles.manualScroll}
          contentContainerStyle={[styles.manualContent, { paddingBottom: bottomPadding + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            ACTIVITY TYPE
          </Text>
          <View style={styles.manualTypeGrid}>
            {MANUAL_TYPES.map(({ type, label, icon }) => {
              const active = selectedType === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.manualTypeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      ...cardShadow,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedType(type); }}
                >
                  <Feather name={icon as any} size={16} color={active ? "#FFFFFF" : colors.mutedForeground} />
                  <Text style={[styles.manualTypeText, { color: active ? "#FFFFFF" : colors.foreground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 24 }]}>
            DURATION (MINUTES)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular", ...cardShadow }]}
            value={manualDuration}
            onChangeText={setManualDuration}
            placeholder="e.g. 45"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 20 }]}>
            NOTES (OPTIONAL)
          </Text>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular", ...cardShadow }]}
            value={manualNotes}
            onChangeText={setManualNotes}
            placeholder="How did it feel?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
          />

          <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleManualSave}>
            <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>Save Activity</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerStrip: { paddingHorizontal: 20, paddingBottom: 12 },
  screenTitle: { fontSize: 26, marginBottom: 12 },
  modeToggle: { flexDirection: "row", borderRadius: 12, padding: 3 },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  modeTabText: { fontSize: 13 },
  gpsContainer: { flex: 1 },
  typeRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 10 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1 },
  typeChipText: { fontSize: 14 },
  mapFallback: { marginHorizontal: 0, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  fallbackTitle: { fontSize: 16, textAlign: "center" },
  fallbackSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  grantBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  grantBtnText: { fontSize: 14, color: "#FFFFFF" },
  metricsPanel: { borderTopWidth: 1 },
  metricsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 20, paddingHorizontal: 8 },
  metricBox: { flex: 1, alignItems: "center" },
  metricValue: { fontSize: 36, lineHeight: 42 },
  metricSub: { fontSize: 12, marginTop: -2, marginBottom: 2 },
  metricLabel: { fontSize: 12 },
  divider: { width: 1, height: 44 },
  controlsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 4 },
  startBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 18 },
  startBtnText: { fontSize: 18, color: "#FFFFFF" },
  halfBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  halfBtnText: { fontSize: 15 },
  manualScroll: { flex: 1 },
  manualContent: { paddingHorizontal: 20, paddingTop: 8 },
  fieldLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  manualTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  manualTypeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, borderWidth: 1 },
  manualTypeText: { fontSize: 14 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  notesInput: { height: 90, paddingTop: 15 },
  saveBtn: { marginTop: 24, paddingVertical: 17, borderRadius: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, color: "#FFFFFF" },
});
