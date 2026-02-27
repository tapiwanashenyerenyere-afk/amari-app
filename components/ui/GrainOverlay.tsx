import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Grain overlay — subtle cream tint on dark surfaces.
 * react-native-svg does NOT support SVG filters (feTurbulence),
 * so we use a simple translucent view for a soft texture effect.
 * For a more authentic film-grain look, swap this for a pre-generated noise PNG.
 */
export function GrainOverlay({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: `rgba(248,246,243,${opacity})` },
      ]}
      pointerEvents="none"
    />
  );
}
