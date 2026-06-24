import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Flower2, Sparkle } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { font, gradient, shadow3 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AllSetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const firstName = (user?.name ?? "Friend").split(" ")[0];

  return (
    <LinearGradient colors={gradient.hero} style={styles.container}>
      <View style={[styles.body, { paddingTop: topPad + 24, paddingBottom: bottomPad + 32 }]}>
        <Animated.View entering={FadeIn.duration(450)} style={styles.hero}>
          <View style={[styles.medallion, shadow3, { borderColor: colors.blush200, backgroundColor: colors.card }]}>
            <Flower2 size={54} color={colors.primaryDeep} strokeWidth={1.5} />
            <View style={[styles.sparkA]}>
              <Sparkle size={18} color={colors.inputFocus} strokeWidth={1.5} />
            </View>
            <View style={[styles.sparkB]}>
              <Sparkle size={14} color={colors.rose300} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            You're all set, {firstName}
          </Text>
          <Text style={[styles.sub, { color: colors.secondaryText, fontFamily: font.regular }]}>
            Your plan is ready and waiting. Whenever you are — let's take that first soft step.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <GradientButton
            label="Enter From Couch to Fit"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace("/(tabs)");
            }}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  medallion: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  sparkA: { position: "absolute", top: 6, right: 14 },
  sparkB: { position: "absolute", bottom: 14, left: 6 },
  title: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 12,
  },
  sub: { fontSize: 16, lineHeight: 24, textAlign: "center", maxWidth: 280 },
});
