import React from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { View, StyleSheet } from "react-native";

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

  const LIGHT_MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#f8f0f2" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9B7F87" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#fdf5f7" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0d5dc" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d8eaf4" }] },
  ];

  return (
    <MapView
      ref={mapRef}
      style={{ width: "100%", height }}
      region={defaultRegion}
      customMapStyle={LIGHT_MAP_STYLE}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
    >
      {coords.length > 1 && (
        <Polyline
          coordinates={coords}
          strokeColor={primaryColor}
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
        />
      )}
      {coords.length > 0 && (
        <Marker coordinate={coords[0]}>
          <View style={[styles.dot, { borderColor: primaryColor }]}>
            <View style={[styles.dotInner, { backgroundColor: primaryColor }]} />
          </View>
        </Marker>
      )}
    </MapView>
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
});
