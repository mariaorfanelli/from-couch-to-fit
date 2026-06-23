import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useApp();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  function switchMode(m: Mode) {
    Haptics.selectionAsync();
    setMode(m);
    setName("");
    setPassword("");
  }

  async function handleSubmit() {
    const trimEmail = email.trim().toLowerCase();
    const trimPassword = password;

    if (!trimEmail || !trimPassword) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (!trimEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (trimPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      Alert.alert("Missing info", "Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(name.trim(), trimEmail, trimPassword);
      } else {
        await signIn(trimEmail, trimPassword);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPadding + 32,
            paddingBottom: bottomPadding + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <View style={[styles.logoMark, { backgroundColor: colors.secondary }]}>
            <Feather name="heart" size={28} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.appName,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            From Couch to Fit
          </Text>
          <Text
            style={[
              styles.tagline,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {mode === "signin"
              ? "Welcome back. Let's keep moving."
              : "Every journey begins with a single step."}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
            <Pressable
              style={[
                styles.modeTab,
                mode === "signin" && {
                  backgroundColor: colors.card,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
              onPress={() => switchMode("signin")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === "signin" ? colors.primary : colors.mutedForeground,
                    fontFamily: mode === "signin" ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                mode === "signup" && {
                  backgroundColor: colors.card,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
              onPress={() => switchMode("signup")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === "signup" ? colors.primary : colors.mutedForeground,
                    fontFamily: mode === "signup" ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.form}>
          {mode === "signup" && (
            <View style={styles.field}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                ]}
              >
                Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
              ]}
            >
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
              ]}
            >
              Password
            </Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "signup" ? "At least 6 characters" : "Password"}
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPass((v) => !v)}
              >
                <Feather
                  name={showPass ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: loading ? colors.secondary : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  fontFamily: "Inter_600SemiBold",
                  color: loading ? colors.mutedForeground : "#FFFFFF",
                },
              ]}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={styles.footer}
        >
          <Text
            style={[
              styles.footerText,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {mode === "signin" ? "New here?" : "Already have an account?"}
          </Text>
          <Pressable onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}>
            <Text
              style={[
                styles.footerLink,
                { color: colors.primary, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {mode === "signin" ? " Create an account" : " Sign in"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  appName: { fontSize: 24, marginBottom: 8 },
  tagline: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: "center",
  },
  modeTabText: { fontSize: 14 },
  form: { gap: 18, marginBottom: 24 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 50 },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 4,
  },
  submitButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonText: { fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
