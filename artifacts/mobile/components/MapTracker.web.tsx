import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type LatLng = { latitude: number; longitude: number };

interface Props {
  coords: LatLng[];
  region: any;
  mapRef: React.RefObject<any>;
  primaryColor: string;
  height: number;
}

export default function MapTracker({ primaryColor, height }: Props) {
  return (
    <View style={[styles.placeholder, { height, borderColor: "#F0D5DC" }]}>
      <Feather name="map" size={36} color="#F0D5DC" />
      <Text style={styles.title}>Live map on iOS & Android</Text>
      <Text style={styles.sub}>
        Scan the QR code with Expo Go to track your route with GPS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    backgroundColor: "#FDF5F7",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#9B7F87",
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9B7F87",
    textAlign: "center",
    lineHeight: 20,
  },
});
