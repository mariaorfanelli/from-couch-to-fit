import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Rect } from "react-native-svg";

import { font } from "@/constants/theme";

interface BarProps {
  data: number[];
  labels?: string[];
  color: string;
  highlightLast?: boolean;
  height?: number;
  unit?: string;
}

/** Rounded bar chart — used for weekly distance / frequency. */
export function BarChart({ data, labels, color, highlightLast = true, height = 96, unit }: BarProps) {
  const max = Math.max(1, ...data);
  const n = data.length;
  const gap = 8;
  const W = 300;
  const barW = (W - gap * (n - 1)) / n;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
        {data.map((v, i) => {
          const h = Math.max(3, (v / max) * (height - 22));
          const x = i * (barW + gap);
          const y = height - 18 - h;
          const isLast = i === n - 1;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={5}
              fill={highlightLast && isLast ? color : color + "55"}
            />
          );
        })}
      </Svg>
      {labels && (
        <View style={styles.labelRow}>
          {labels.map((l, i) => (
            <Text key={i} style={[styles.label, { fontFamily: font.regular }]} numberOfLines={1}>
              {l}
            </Text>
          ))}
        </View>
      )}
      {unit && <Text style={[styles.unit, { fontFamily: font.regular }]}>{unit}</Text>}
    </View>
  );
}

interface LineProps {
  data: number[];
  color: string;
  height?: number;
  /** true if lower is better (pace) — flips the fill accent only. */
  invert?: boolean;
}

/** Sparkline — used for the pace trend. */
export function LineChart({ data, color, height = 80 }: LineProps) {
  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={[styles.empty, { fontFamily: font.regular }]}>Not enough data yet</Text>
      </View>
    );
  }
  const W = 300;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 10;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return { x, y };
  });
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
      <Line x1={pad} y1={height - pad} x2={W - pad} y2={height - pad} stroke="#EDE8EA" strokeWidth={1} />
      <Polyline points={poly} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={color} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  label: { fontSize: 10, color: "#A39EAA", flex: 1, textAlign: "center" },
  unit: { fontSize: 11, color: "#A39EAA", marginTop: 4 },
  empty: { fontSize: 13, color: "#A39EAA" },
});
