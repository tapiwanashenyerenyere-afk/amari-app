import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
}

export function PulseIcon({ color, size = 20 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M12 2v4m0 12v4m-7.07-2.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-2.93 7.07l-2.83-2.83M6.76 6.76L3.93 3.93" />
    </Svg>
  );
}

export function EventsIcon({ color, size = 20 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

export function AlignedIcon({ color, size = 20 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <Path d="M4 4l8 8m0 0l8-8" />
      <Path d="M12 12v8" />
      <Circle cx={12} cy={12} r={2} />
    </Svg>
  );
}

export function CorridorIcon({ color, size = 20 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <Rect x={5} y={2} width={14} height={20} rx={7} />
      <Circle cx={12} cy={10} r={2.5} />
      <Path d="M12 12.5V17" />
    </Svg>
  );
}

export function ProfileIcon({ color, size = 20 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
    </Svg>
  );
}

export function ChevronRight({ color = '#DDDDDD', size = 16 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function KeyholeSmall({ color = '#A0856B', size = 12 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x={5} y={2} width={14} height={20} rx={7} />
      <Circle cx={12} cy={10} r={2} />
      <Path d="M12 12v4" strokeLinecap="round" />
    </Svg>
  );
}

export function MicIcon({ color = '#999', size = 12 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <Path d="M12 2v10m-4-6v2a4 4 0 008 0V6" />
      <Path d="M5 11a7 7 0 0014 0" />
      <Path d="M12 18v4m-3 0h6" />
    </Svg>
  );
}

export function MentorIcon({ color = '#999', size = 12 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <Circle cx={8} cy={7} r={3} />
      <Circle cx={16} cy={7} r={3} />
      <Path d="M2 21c0-3.31 2.69-6 6-6m8 6c0-3.31 2.69-6 6-6" />
    </Svg>
  );
}

export function VennIcon({ color = '#999', size = 12 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx={9} cy={12} r={6} />
      <Circle cx={15} cy={12} r={6} />
    </Svg>
  );
}
