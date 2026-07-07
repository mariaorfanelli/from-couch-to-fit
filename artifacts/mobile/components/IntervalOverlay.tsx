import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { font } from "@/constants/theme";
import { FlatPhase, PHASE_META, fmt, nextPhase, phaseAt } from "@/lib/intervals";

interface Props {
  flat: FlatPhase[];
  elapsedSec: number;
}

/**
 * Live interval banner — the current phase with a colored countdown ring,
 * a rep counter, and a peek at what's next.
 */
export default function IntervalOverlay({ flat, elapsedSec }: Props) {
  const at = phaseAt(flat, elapsedSec);
  if (!at) return null;

  const meta = PHASE_META[at.phase.type];
  const next = nextPhase(flat, at.index);
  const phaseLen = at.phase.endSec - at.phase.startSec;
  const progress = phaseLen > 0 ? Math.min(1, (elapsedSec - at.phase.startSec) / phaseLen) : 0;

  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { borderColor: meta.color }]}>
        <View style={styles.ringWrap}>
          <Svg width={84} height={84} viewBox="0 0 84 84">
            <Circle cx="42" cy="42" r={R} stroke="#EDE8EA" strokeWidth={7} fill="none" />
            <Circle
              cx="42"
              cy="42"
              r={R}
              stroke={meta.color}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * progress}
              transform="rotate(-90 42 42)"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.remaining, { color: meta.color, fontFamily: font.displayLight }]}>
              {at.done ? "0:00" : fmt(at.remainingSec)}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={[styles.phaseLabel, { color: meta.color, fontFamily: font.semibold }]}>
            {meta.emoji} {at.done ? "Complete" : meta.verb}
          </Text>
          {at.phase.repTotal ? (
            <Text style={[styles.rep, { fontFamily: font.medium }]}>
              Rep {at.phase.repIndex}/{at.phase.repTotal}
            </Text>
          ) : (
            <Text style={[styles.rep, { fontFamily: font.medium }]}>{at.phase.label}</Text>
          )}
          {next && !at.done ? (
            <Text style={[styles.next, { fontFamily: font.regular }]}>
              Next: {PHASE_META[next.type].label} {fmt(next.seconds)}
            </Text>
          ) : (
            <Text style={[styles.next, { fontFamily: font.regular }]}>Last one — finish strong 🌸</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: "rgba(50,40,60,0.18)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  ringWrap: { width: 84, height: 84, alignItems: "center", justifyContent: "center" },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  remaining: { fontSize: 20, fontVariant: ["tabular-nums"] },
  info: { flex: 1, gap: 2 },
  phaseLabel: { fontSize: 18 },
  rep: { fontSize: 13, color: "#6E6873" },
  next: { fontSize: 12, color: "#A39EAA" },
});
