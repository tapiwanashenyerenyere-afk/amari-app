// Official AMARI emblem — the abstract "A" with intersecting curves and angular cut
// Used as the sole brand mark throughout the app. Nothing else.
import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface AmariEmblemProps {
  size?: number;
  fill?: string;       // Background fill
  stroke?: string;     // Lines/curves color
  variant?: 'dark' | 'light' | 'onDark';
}

export function AmariEmblem({
  size = 80,
  fill,
  stroke,
  variant = 'dark',
}: AmariEmblemProps) {
  // Variant presets
  const bg = fill || (variant === 'dark' ? '#000000' : variant === 'light' ? '#FFFFFF' : '#0A0A0A');
  const lines = stroke || (variant === 'dark' ? '#FFFFFF' : variant === 'light' ? '#111111' : '#FFFFFF');

  return (
    <Svg width={size} height={size} viewBox="0 0 600 600">
      {/* Rounded square background */}
      <Rect x="0" y="0" width="600" height="600" rx="70" fill={bg} />

      {/* Right angular cut — the white wedge/slash */}
      <Path
        d="M360 0 C380 0 400 15 415 40 L570 280 V530 C570 570 545 590 510 590 H470 L360 0 Z"
        fill={lines}
      />

      {/* Large sweeping arc — bottom-left to upper-right */}
      <Path
        d="M0 560 Q120 340 240 220 Q380 80 520 55"
        stroke={lines}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Diagonal line — crossing the arc to form the A */}
      <Path
        d="M110 590 L320 50"
        stroke={lines}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
