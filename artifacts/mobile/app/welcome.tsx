import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Footprints } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/components/ui/GradientButton";
import { ctaShadow, font, gradient, radii } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient colors={gradient.hero} style={styles.container} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <View style={[styles.body, { paddingTop: topPad + 40, paddingBottom: bottomPad + 28 }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <View style={[styles.logoMark, ctaShadow]}>
            <LinearGradient colors={[colors.rose300, colors.primary]} style={styles.logoFill}>
              <Footprints size={36} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            From Couch{"\n"}to Fit
          </Text>
          <Text style={[styles.tagline, { color: colors.secondaryText, fontFamily: font.regular }]}>
            Movement, gently. Track your walks, runs and flows — at your own soft pace.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actions}>
          <GradientButton
            label="Get started"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/auth", params: { mode: "signup" } });
            }}
          />
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push({ pathname: "/auth", params: { mode: "signin" } });
            }}
            style={styles.loginRow}
          >
            <Text style={[styles.loginText, { color: colors.secondaryText, fontFamily: font.regular }]}>
              Already moving with us?{" "}
            </Text>
            <Text style={[styles.loginLink, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
              Log in
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    marginBottom: 30,
  },
  logoFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  actions: { gap: 14, paddingBottom: 12 },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14 },
});
