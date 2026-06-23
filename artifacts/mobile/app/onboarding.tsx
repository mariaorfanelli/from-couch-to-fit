import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  OnboardingIllustration1,
  OnboardingIllustration2,
  OnboardingIllustration3,
} from "@/components/Illustrations";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    Illustration: OnboardingIllustration1,
    title: "Start where you are",
    subtitle:
      "No pressure, no judgment. From Couch to Fit meets you exactly where you are — and gently takes it from there.",
  },
  {
    id: "2",
    Illustration: OnboardingIllustration2,
    title: "Every step counts",
    subtitle:
      "Track runs, walks, yoga, pilates, and more. Watch your progress grow week by week, at your own pace.",
  },
  {
    id: "3",
    Illustration: OnboardingIllustration3,
    title: "Your pace, your race",
    subtitle:
      "Set meaningful goals and get gentle daily suggestions tailored to your journey. You've got this.",
  },
];

function Dot({ active, colors }: { active: boolean; colors: ReturnType<typeof useColors> }) {
  const width = useSharedValue(active ? 20 : 8);

  React.useEffect(() => {
    width.value = withSpring(active ? 20 : 8, { damping: 15 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    height: 8,
    borderRadius: 4,
    backgroundColor: active ? colors.primary : colors.border,
    marginHorizontal: 3,
  }));

  return <Animated.View style={style} />;
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markOnboardingSeen } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  function goNext() {
    Haptics.selectionAsync();
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex((i) => i + 1);
    } else {
      markOnboardingSeen();
      router.replace("/auth");
    }
  }

  function handleMomentumEnd(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const { Illustration } = item;
          return (
            <View style={[styles.slide, { width: SCREEN_WIDTH, paddingTop: topPadding + 32 }]}>
              <View style={styles.illustrationWrap}>
                <Illustration size={220} />
              </View>
              <Text
                style={[
                  styles.title,
                  { color: colors.foreground, fontFamily: "Inter_700Bold" },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: bottomPadding + 24 },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === activeIndex} colors={colors} />
          ))}
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={goNext}
        >
          <Text
            style={[
              styles.buttonText,
              { fontFamily: "Inter_600SemiBold" },
            ]}
          >
            {isLast ? "Get Started" : "Continue"}
          </Text>
        </Pressable>

        {!isLast && (
          <Pressable
            onPress={() => {
              markOnboardingSeen();
              router.replace("/auth");
            }}
          >
            <Text
              style={[
                styles.skip,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  illustrationWrap: {
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  button: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  skip: {
    fontSize: 14,
    marginBottom: 4,
  },
});
