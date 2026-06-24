/**
 * Shared theming primitives — neutral shadows (not the old pink-tinted ones),
 * radius scale, gradient tuple, and Fraunces font helpers.
 */

import type { TextStyle, ViewStyle } from "react-native";

export const radii = {
  sm: 8, // chips, tags
  md: 14, // inputs, buttons
  lg: 20, // cards, sheets
  xl: 26, // floating tab bar
  pill: 999,
};

// Neutral plum-shadow tokens. Use these instead of pink-tinted shadows.
export const shadow1: ViewStyle = {
  shadowColor: "rgba(50,40,60,0.04)",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 2,
  elevation: 1,
};

export const shadow2: ViewStyle = {
  shadowColor: "rgba(50,40,60,0.05)",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 16,
  elevation: 2,
};

export const shadow3: ViewStyle = {
  shadowColor: "rgba(50,40,60,0.08)",
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 1,
  shadowRadius: 36,
  elevation: 4,
};

// Pink-tinted shadow for the primary gradient CTA — the only shadow with hue.
export const ctaShadow: ViewStyle = {
  shadowColor: "#B85F74",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.32,
  shadowRadius: 22,
  elevation: 6,
};

export const gradient = {
  primary: ["#D98EA0", "#B85F74"] as const,
  hero: ["#FCEEF1", "#FBF9F9"] as const, // welcome / all-set scenes
  goalCard: ["#E9AEBB", "#D0859A"] as const, // active-goal hero card
};

// Typography helpers — keep font-family choices in one place.
export const font = {
  display: "Fraunces_400Regular", // hero / greeting headings
  displayLight: "Fraunces_300Light", // very large metric numerals
  bold: "Inter_700Bold",
  semibold: "Inter_600SemiBold",
  medium: "Inter_500Medium",
  regular: "Inter_400Regular",
} as const;

// Tabular numerals for live metrics (time, distance, pace).
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };
