import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { LIGHT_MAP_STYLE } from "@/constants/mapStyle";

type LatLng = { latitude: number; longitude: number };

interface Props {
  coords: LatLng[];
  primaryColor: string;
  height: number;
  borderRadius?: number;
}

function regionFor(coords: LatLng[]) {
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.004),
    longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.004),
  };
}

/**
 * Read-only map that frames a completed route end-to-end with start/finish
 * markers and a cased polyline. Used by the activity detail and summary screens.
 */
export default function RouteMap({ coords, primaryColor, height, borderRadius = 0 }: Props) {
  const mapRef = useRef<MapView>(null);

  const fit = () => {
    if (coords.length > 1) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: false,
      });
    }
  };

  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <View style={{ height, borderRadius, overflow: "hidden" }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={coords.length ? regionFor(coords) : undefined}
        customMapStyle={LIGHT_MAP_STYLE}
        onMapReady={fit}
        onLayout={fit}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {coords.length > 1 && (
          <>
            {/* White casing under the colored line for a clean stroked look. */}
            <Polyline coordinates={coords} strokeColor="#FFFFFF" strokeWidth={8} lineJoin="round" lineCap="round" />
            <Polyline coordinates={coords} strokeColor={primaryColor} strokeWidth={4} lineJoin="round" lineCap="round" />
          </>
        )}
        {start && (
          <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.pin, { borderColor: "#7AA87A" }]}>
              <View style={[styles.pinInner, { backgroundColor: "#7AA87A" }]} />
            </View>
          </Marker>
        )}
        {end && coords.length > 1 && (
          <Marker coordinate={end} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.pin, { borderColor: primaryColor }]}>
              <View style={[styles.pinInner, { backgroundColor: primaryColor }]} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: { width: 8, height: 8, borderRadius: 4 },
});
