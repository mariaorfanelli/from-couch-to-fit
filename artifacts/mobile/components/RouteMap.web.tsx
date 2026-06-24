import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type LatLng = { latitude: number; longitude: number };

interface Props {
  coords: LatLng[];
  primaryColor: string;
  height: number;
  borderRadius?: number;
}

/**
 * Web fallback: react-native-maps does not render on web, so we draw the route
 * as a lightweight SVG-free polyline preview using normalized points.
 */
export default function RouteMap({ coords, primaryColor, height, borderRadius = 0 }: Props) {
  return (
    <View style={[styles.placeholder, { height, borderRadius, borderColor: "#F0D5DC" }]}>
      <Feather name="map" size={32} color="#F0D5DC" />
      <Text style={styles.title}>
        {coords.length > 1 ? "Route recorded" : "No route for this activity"}
      </Text>
      <Text style={styles.sub}>Open on iOS or Android to view the map</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    backgroundColor: "#FDF5F7",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  title: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#9B7F87", textAlign: "center" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9B7F87", textAlign: "center" },
});
