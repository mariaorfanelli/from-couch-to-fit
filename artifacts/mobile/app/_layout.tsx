import {
  Fraunces_300Light,
  Fraunces_400Regular,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { restoreSession } from "@/lib/locationTracking";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const seg0 = segments[0] as string | undefined;
    const inWelcome = seg0 === "welcome";
    const inAuth = seg0 === "auth";
    const inOnboarding = seg0 === "onboarding";
    const inAllSet = seg0 === "all-set";
    const inSummary = seg0 === "activity-summary";

    // Activity summary is reachable while signed-in; don't bounce it.
    if (inSummary) return;

    if (!isAuthenticated) {
      // Signed-out → welcome → auth flow only.
      if (!inWelcome && !inAuth) router.replace("/welcome");
      return;
    }

    // Signed-in but hasn't finished onboarding → run them through it.
    if (!hasSeenOnboarding) {
      if (!inOnboarding && !inAllSet) router.replace("/onboarding");
      return;
    }

    // Fully ready → kick out of pre-auth screens.
    if (inWelcome || inAuth || inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, hasSeenOnboarding, segments]);

  return null;
}

function RootLayoutNav() {
  // Recover an in-progress run if the app was killed mid-session.
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="all-set" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activity-summary" />
        <Stack.Screen name="activity/[id]" />
        <Stack.Screen name="experiments/index" />
        <Stack.Screen name="experiments/new" />
        <Stack.Screen name="experiments/objective" />
        <Stack.Screen name="experiments/reflection" />
        <Stack.Screen name="experiments/wrapup" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_300Light,
    Fraunces_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
