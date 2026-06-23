import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Polyline,
  Rect,
} from "react-native-svg";

export function OnboardingIllustration1({ size = 220 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s * 0.85} viewBox="0 0 220 187">
      <Circle cx="110" cy="93" r="80" fill="#FCE8EE" />
      <Rect x="55" y="110" width="110" height="38" rx="14" fill="#D4708A" opacity="0.18" />
      <Rect x="55" y="108" width="110" height="28" rx="12" fill="#D4708A" opacity="0.35" />
      <Rect x="65" y="96" width="90" height="20" rx="10" fill="#D4708A" opacity="0.6" />
      <Rect x="60" y="136" width="18" height="10" rx="4" fill="#C24B6E" opacity="0.5" />
      <Rect x="142" y="136" width="18" height="10" rx="4" fill="#C24B6E" opacity="0.5" />
      <Circle cx="110" cy="74" r="18" fill="#FFFFFF" stroke="#D4708A" strokeWidth="2.5" />
      <Circle cx="110" cy="68" r="7" fill="#D4708A" opacity="0.5" />
      <Line x1="110" y1="92" x2="110" y2="108" stroke="#D4708A" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="110" y1="97" x2="98" y2="106" stroke="#D4708A" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="110" y1="97" x2="122" y2="106" stroke="#D4708A" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M 148 90 Q 158 85 162 92 Q 166 99 158 103" stroke="#FCB8C8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="162" cy="103" r="3" fill="#FCB8C8" />
      <Path d="M 60 75 Q 52 68 56 60 Q 60 52 68 56" stroke="#FCB8C8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="60" cy="75" r="3" fill="#FCB8C8" />
    </Svg>
  );
}

export function OnboardingIllustration2({ size = 220 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s * 0.85} viewBox="0 0 220 187">
      <Circle cx="110" cy="93" r="80" fill="#FCE8EE" />
      <Path
        d="M 50 140 Q 70 100 90 115 Q 110 130 130 90 Q 150 50 170 70"
        stroke="#D4708A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="50" cy="140" r="5" fill="#D4708A" />
      <Circle cx="90" cy="115" r="5" fill="#D4708A" opacity="0.6" />
      <Circle cx="130" cy="90" r="5" fill="#D4708A" opacity="0.8" />
      <Circle cx="170" cy="70" r="7" fill="#C24B6E" />
      <Line x1="170" y1="70" x2="170" y2="50" stroke="#C24B6E" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M 170 50 L 182 54 L 170 58 Z" fill="#C24B6E" />
      <Path d="M 68 120 Q 80 105 88 112" stroke="#FCB8C8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M 108 108 Q 120 90 128 97" stroke="#FCB8C8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="56" cy="60" r="14" fill="none" stroke="#D4708A" strokeWidth="2" opacity="0.4" />
      <Line x1="49" y1="60" x2="63" y2="60" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <Line x1="56" y1="53" x2="56" y2="67" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </Svg>
  );
}

export function OnboardingIllustration3({ size = 220 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s * 0.85} viewBox="0 0 220 187">
      <Circle cx="110" cy="93" r="80" fill="#FCE8EE" />
      <Path
        d="M 110 150 L 78 120 L 92 88 L 110 100 L 128 88 L 142 120 Z"
        fill="#D4708A"
        opacity="0.2"
      />
      <Path
        d="M 110 150 L 78 120 L 92 88 L 110 100 L 128 88 L 142 120 Z"
        stroke="#D4708A"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx="110" cy="75" r="16" fill="#D4708A" opacity="0.15" stroke="#D4708A" strokeWidth="2" />
      <Path d="M 103 75 L 108 80 L 118 68" stroke="#D4708A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="155" cy="100" r="8" fill="none" stroke="#FCB8C8" strokeWidth="2" />
      <Circle cx="65" cy="105" r="6" fill="none" stroke="#FCB8C8" strokeWidth="2" />
      <Circle cx="145" cy="65" r="4" fill="#FCB8C8" />
      <Circle cx="72" cy="75" r="3" fill="#FCB8C8" />
    </Svg>
  );
}

export function EmptyActivitiesIllustration({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 120 84">
      <Path
        d="M 20 60 Q 22 48 34 46 Q 38 38 50 38 Q 54 28 66 30 Q 78 28 82 40 Q 96 40 98 54 Q 100 62 92 64 L 28 64 Q 18 64 20 60 Z"
        fill="#F0D5DC"
        stroke="#D4708A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Ellipse cx="60" cy="72" rx="36" ry="5" fill="#FCE8EE" />
      <Circle cx="42" cy="38" r="4" fill="#D4708A" opacity="0.3" />
      <Circle cx="80" cy="32" r="3" fill="#D4708A" opacity="0.2" />
    </Svg>
  );
}

export function EmptyGoalsIllustration({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="40" fill="#FCE8EE" />
      <Circle cx="60" cy="60" r="28" fill="none" stroke="#D4708A" strokeWidth="2" opacity="0.4" />
      <Circle cx="60" cy="60" r="16" fill="none" stroke="#D4708A" strokeWidth="2" opacity="0.7" />
      <Circle cx="60" cy="60" r="6" fill="#D4708A" />
      <Line x1="60" y1="18" x2="60" y2="24" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" />
      <Line x1="60" y1="96" x2="60" y2="102" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="60" x2="24" y2="60" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" />
      <Line x1="96" y1="60" x2="102" y2="60" stroke="#D4708A" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CelebrationIllustration({ size = 160 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Circle cx="80" cy="80" r="60" fill="#FCE8EE" />
      <Circle cx="80" cy="80" r="40" fill="#FFFFFF" stroke="#F0D5DC" strokeWidth="1.5" />
      <Path
        d="M 80 50 L 85 70 L 106 70 L 90 82 L 96 102 L 80 90 L 64 102 L 70 82 L 54 70 L 75 70 Z"
        fill="#D4708A"
        opacity="0.9"
      />
      <Circle cx="36" cy="40" r="6" fill="#FCB8C8" opacity="0.6" />
      <Circle cx="124" cy="36" r="5" fill="#FCB8C8" opacity="0.5" />
      <Circle cx="130" cy="120" r="7" fill="#F0D5DC" opacity="0.7" />
      <Circle cx="30" cy="115" r="5" fill="#F0D5DC" opacity="0.6" />
      <Line x1="42" y1="30" x2="30" y2="44" stroke="#FCB8C8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <Line x1="118" y1="28" x2="126" y2="42" stroke="#FCB8C8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <Line x1="136" y1="114" x2="126" y2="126" stroke="#F0D5DC" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
}
