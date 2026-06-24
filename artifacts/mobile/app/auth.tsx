import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react-native";
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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import GradientButton from "@/components/ui/GradientButton";
import { font, radii, shadow1 } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Mode = "signin" | "signup";

function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <Path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <Path fill="#FBBC05" d="M11.69 28.18A13.95 13.95 0 0 1 10.96 24c0-1.46.25-2.87.69-4.18v-5.7H4.34A22 22 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <Path fill="#EA4335" d="M24 9.75c3.24 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.18 29.93 1 24 1 15.4 1 7.96 5.93 4.34 14.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z" />
    </Svg>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure,
  onToggleSecure,
  showSecure,
  ...rest
}: any) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: colors.secondaryText, fontFamily: font.medium }]}>{label}</Text>
      <View
        style={[
          styles.fieldShell,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.inputFocus : colors.border,
            borderWidth: focused ? 1.5 : 1,
          },
          focused && { shadowColor: "rgba(233,174,187,0.18)", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4, elevation: 0 },
        ]}
      >
        {icon}
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B6AFBA"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !showSecure}
          style={[styles.input, { color: colors.foreground, fontFamily: font.regular }]}
        />
        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={10}>
            {showSecure ? <EyeOff size={18} color="#A39EAA" strokeWidth={1.5} /> : <Eye size={18} color="#A39EAA" strokeWidth={1.5} />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle } = useApp();
  const params = useLocalSearchParams<{ mode?: Mode }>();

  const [mode, setMode] = useState<Mode>(params.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSubmit() {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (!trimEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") await signUp(trimEmail, password);
      else await signIn(trimEmail, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Auth gate in _layout.tsx will route to onboarding or tabs.
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Google sign-in", err?.message ?? "Could not finish Google sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.cardAlt }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              if (router.canGoBack()) router.back();
              else router.replace("/welcome");
            }}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }, shadow1]}
            hitSlop={10}
          >
            <ChevronLeft size={22} color="#5A535F" strokeWidth={1.5} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.intro}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: font.display }]}>
            {mode === "signin" ? "Welcome back" : "Create your space"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            {mode === "signin" ? "Pick up right where you left off." : "A gentle, pressure-free home for your movement."}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Field
            label="Email"
            icon={<Mail size={18} color="#A39EAA" strokeWidth={1.5} />}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Field
            label="Password"
            icon={<Lock size={18} color={password ? "#D98EA0" : "#A39EAA"} strokeWidth={1.5} />}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            secure
            showSecure={showPass}
            onToggleSecure={() => setShowPass((v) => !v)}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {mode === "signin" && (
            <Pressable style={{ alignSelf: "flex-end", marginTop: -8, marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: colors.primaryDeep, fontFamily: font.semibold }}>Forgot password?</Text>
            </Pressable>
          )}

          <View style={{ height: mode === "signin" ? 0 : 14 }} />

          <GradientButton
            label={mode === "signin" ? "Log in" : "Create account"}
            loading={loading}
            onPress={handleSubmit}
          />

          {/* divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.mutedForeground, fontFamily: font.medium }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={handleGoogle}
            disabled={googleLoading}
            style={[
              styles.googleBtn,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: googleLoading ? 0.6 : 1 },
              shadow1,
            ]}
          >
            <GoogleGlyph size={19} />
            <Text style={[styles.googleText, { color: colors.foreground, fontFamily: font.semibold }]}>
              {googleLoading ? "Opening Google…" : "Continue with Google"}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: font.regular }]}>
            {mode === "signin" ? "New here? " : "Already have an account? "}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            <Text style={[styles.footerLink, { color: colors.primaryDeep, fontFamily: font.semibold }]}>
              {mode === "signin" ? "Create an account" : "Log in"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 28 },
  headerRow: { marginBottom: 28 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { marginBottom: 32 },
  title: { fontSize: 32, letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 15, lineHeight: 22 },

  label: { fontSize: 13, marginBottom: 8 },
  fieldShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },

  divider: { flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 12 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  googleText: { fontSize: 15 },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28, flexWrap: "wrap" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
