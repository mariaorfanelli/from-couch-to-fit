import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { LIGHT_MAP_STYLE } from "@/constants/mapStyle";

type LatLng = { latitude: number; longitude: number };

interface Props {
  coords: LatLng[];
  region: any;
  mapRef: React.RefObject<any>;
  primaryColor: string;
  height: number;
}

export default function MapTracker({ coords, region, mapRef, primaryColor, height }: Props) {
  const defaultRegion = region ?? {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  const last = coords[coords.length - 1];

  function recenter() {
    if (last) {
      mapRef.current?.animateToRegion(
        { latitude: last.latitude, longitude: last.longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 },
        400
      );
    }
  }

  return (
    <View style={{ height }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={defaultRegion}
        customMapStyle={LIGHT_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {coords.length > 1 && (
          <>
            {/* White casing beneath the colored route for a clean stroked look. */}
            <Polyline coordinates={coords} strokeColor="#FFFFFF" strokeWidth={8} lineJoin="round" lineCap="round" />
            <Polyline coordinates={coords} strokeColor={primaryColor} strokeWidth={4} lineJoin="round" lineCap="round" />
          </>
        )}
        {coords.length > 0 && (
          <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { borderColor: "#7AA87A" }]}>
              <View style={[styles.dotInner, { backgroundColor: "#7AA87A" }]} />
            </View>
          </Marker>
        )}
        {last && coords.length > 1 && (
          <Marker coordinate={last} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { borderColor: primaryColor }]}>
              <View style={[styles.dotInner, { backgroundColor: primaryColor }]} />
            </View>
          </Marker>
        )}
      </MapView>

      <Pressable style={styles.recenter} onPress={recenter} hitSlop={8}>
        <Feather name="crosshair" size={18} color={primaryColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  recenter: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
