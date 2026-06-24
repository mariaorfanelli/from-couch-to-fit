import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ctaShadow, font, gradient, radii } from "@/constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: "lg" | "md";
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Primary CTA across the app — the dusty-pink gradient pill from the brand
 * guidelines. Always feels the same: same gradient, radius, shadow, padding.
 */
export default function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = "lg",
  leadingIcon,
  trailingIcon,
  fullWidth = true,
}: Props) {
  const verticalPad = size === "lg" ? 16 : 13;
  const fontSize = size === "lg" ? 16 : 15;
  const isMuted = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isMuted}
      style={({ pressed }) => [
        styles.shell,
        fullWidth && { alignSelf: "stretch" },
        !isMuted && ctaShadow,
        { opacity: isMuted ? 0.55 : pressed ? 0.92 : 1 },
      ]}
    >
      <LinearGradient
        colors={gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[styles.body, { paddingVertical: verticalPad }]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.row}>
            {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
            <Text style={[styles.label, { fontSize, fontFamily: font.semibold }]}>{label}</Text>
            {trailingIcon ? <View style={styles.icon}>{trailingIcon}</View> : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: radii.md, overflow: "visible" },
  body: {
    borderRadius: radii.md,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { alignItems: "center", justifyContent: "center" },
  label: { color: "#FFFFFF" },
});
