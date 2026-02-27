import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface LiquidGlassCardProps {
  variant?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  noPadding?: boolean;
}

export function LiquidGlassCard({
  children,
  variant = 'dark',
  style,
  intensity,
  noPadding,
}: PropsWithChildren<LiquidGlassCardProps>) {
  const isDark = variant === 'dark';
  const blurIntensity = intensity ?? (isDark ? 40 : 30);

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        style,
      ]}
    >
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular highlight — top half */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.12)', 'transparent']
            : ['rgba(255,255,255,0.3)', 'transparent']
        }
        style={styles.specular}
      />
      <View style={[styles.content, noPadding && { padding: 0 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    // Layered shadows (Josh Comeau style)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  containerLight: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 1,
  },
  content: {
    padding: 20,
    zIndex: 2,
  },
});
