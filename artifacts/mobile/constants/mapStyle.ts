/**
 * Soft blush Google Maps style shared by the live tracker and the read-only
 * route map, so recorded routes look identical to the one drawn live.
 */
export const LIGHT_MAP_STYLE = [
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
