import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS } from '../lib/constants';

type TabName = 'home' | 'discover' | 'events' | 'network' | 'profile';

interface TabBarIconProps {
  name: TabName;
  active: boolean;
}

export default function TabBarIcon({ name, active }: TabBarIconProps) {
  const color = active ? COLORS.charcoal : COLORS.warmGray;
  const size = 22;

  const icons: Record<TabName, React.ReactElement> = {
    home: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* House outline */}
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(26, 26, 26, 0.1)' : 'none'}
        />
        {/* Door */}
        <Path
          d="M9 21V14H15V21"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),

    discover: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Compass outer circle */}
        <Circle
          cx={12}
          cy={12}
          r={9}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Compass needle / star shape */}
        <Path
          d="M12 7L13.5 10.5L17 12L13.5 13.5L12 17L10.5 13.5L7 12L10.5 10.5L12 7Z"
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    ),

    events: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Calendar body */}
        <Rect
          x={3}
          y={6}
          width={18}
          height={15}
          rx={2}
          stroke={color}
          strokeWidth={1.5}
          fill={active ? 'rgba(26, 26, 26, 0.1)' : 'none'}
        />
        {/* Calendar header line */}
        <Path
          d="M3 10H21"
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Calendar hooks */}
        <Path
          d="M8 3V6M16 3V6"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        {/* Event dot */}
        <Circle
          cx={12}
          cy={15}
          r={2}
          fill={active ? COLORS.burgundy : color}
        />
      </Svg>
    ),

    network: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Central person */}
        <Circle
          cx={12}
          cy={7}
          r={3}
          stroke={color}
          strokeWidth={1.5}
          fill={active ? 'rgba(26, 26, 26, 0.1)' : 'none'}
        />
        {/* Left person */}
        <Circle
          cx={5}
          cy={17}
          r={2.5}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Right person */}
        <Circle
          cx={19}
          cy={17}
          r={2.5}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Connection lines */}
        <Path
          d="M12 10V12M7 15L10 12M17 15L14 12"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    ),

    profile: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Head */}
        <Circle
          cx={12}
          cy={8}
          r={4}
          stroke={color}
          strokeWidth={1.5}
          fill={active ? 'rgba(26, 26, 26, 0.1)' : 'none'}
        />
        {/* Body arc */}
        <Path
          d="M4 21C4 16.5 7.5 13 12 13C16.5 13 20 16.5 20 21"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    ),
  };

  return icons[name] || null;
}
