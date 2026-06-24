import { Tabs } from "expo-router";
import {
  CirclePlus,
  Flower2,
  House,
  Route as RouteIcon,
  UserRound,
} from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radii, shadow3 } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type TabName = "index" | "activities" | "log" | "classes" | "profile";

const ICONS: Record<TabName, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  index: House,
  activities: RouteIcon,
  log: CirclePlus,
  classes: Flower2,
  profile: UserRound,
};

const LABELS: Record<TabName, string> = {
  index: "Home",
  activities: "Activities",
  log: "Track",
  classes: "Classes",
  profile: "You",
};

/**
 * Custom floating tab bar from the brand mockup: pure-white pill, soft shadow,
 * active = blush-tint background + deep-pink icon, otherwise muted plum.
 */
function FloatingTabBar({ state, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 18 : Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={[styles.shell, { paddingBottom: bottomPad }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...shadow3,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const name = route.name as TabName;
          const Icon = ICONS[name];
          const label = LABELS[name];

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[
                styles.item,
                focused && { backgroundColor: colors.blushTint },
              ]}
            >
              <Icon
                size={22}
                color={focused ? colors.primaryDeep : "#9A95A0"}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: focused ? colors.primaryDeep : "#9A95A0",
                    fontFamily: focused ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activities" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="classes" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderRadius: 14,
  },
  label: { fontSize: 11 },
});
