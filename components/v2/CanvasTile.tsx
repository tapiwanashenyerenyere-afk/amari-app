import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, typography } from '@/lib/theme';

type CanvasVariant = 'hero' | 'left' | 'right';

interface CanvasTileProps {
  title?: string;
  description?: string | null;
  category?: string | null;
  rank?: number;
  status?: string;
  variant?: CanvasVariant;
  palette?: 'warm' | 'navy' | 'forest' | 'wine' | 'smoke';
  isAddSlot?: boolean;
  onPress?: () => void;
}

const PALETTES = {
  warm: {
    colors: ['#1A1917', '#141210', '#1C1812'],
    stroke: 'rgba(196,162,101,0.55)',
    category: colors.gold,
    pin: 'rgba(196,162,101,0.25)',
    dot: colors.gold,
  },
  navy: {
    colors: [colors.tileNavy, colors.tileNavyDark, '#171D26'],
    stroke: colors.tileNavyAccent,
    category: 'rgba(140,170,210,0.72)',
    pin: 'rgba(120,150,196,0.25)',
    dot: 'rgba(140,170,210,0.82)',
  },
  forest: {
    colors: [colors.tileForest, colors.tileForestDark, '#18231A'],
    stroke: colors.tileForestAccent,
    category: 'rgba(120,180,130,0.72)',
    pin: 'rgba(120,180,130,0.24)',
    dot: 'rgba(120,180,130,0.78)',
  },
  wine: {
    colors: [colors.tileWine, colors.tileWineDark, '#26161B'],
    stroke: colors.tileWineAccent,
    category: 'rgba(196,130,140,0.72)',
    pin: 'rgba(196,130,140,0.22)',
    dot: 'rgba(196,130,140,0.76)',
  },
  smoke: {
    colors: [colors.tileSmoke, colors.tileSmokeDark, '#1A1A1A'],
    stroke: colors.tileSmokeAccent,
    category: 'rgba(210,210,218,0.62)',
    pin: 'rgba(180,180,190,0.20)',
    dot: 'rgba(180,180,190,0.70)',
  },
} as const;

export function CanvasTile({
  title,
  description,
  category,
  rank = 1,
  status,
  variant = 'left',
  palette = 'warm',
  isAddSlot = false,
  onPress,
}: CanvasTileProps) {
  const paletteStyles = PALETTES[palette];

  if (isAddSlot) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tileWrap,
          styles.rightWrap,
          variant === 'hero' ? styles.heroWrap : null,
          pressed ? styles.addPressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add a project"
      >
        <View style={[styles.addSurface, variant === 'hero' ? styles.heroAddSurface : null]}>
          <View style={styles.addMark}>
            <Text style={styles.addMarkText}>+</Text>
          </View>
          <Text style={styles.addLabel}>Add project</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tileWrap,
        variant === 'hero' ? styles.heroWrap : null,
        variant === 'left' ? styles.leftWrap : styles.rightWrap,
        pressed ? styles.tilePressed : null,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title ? `Open ${title}` : undefined}
    >
      <View style={[styles.pin, variant === 'hero' ? styles.heroPin : null, { backgroundColor: paletteStyles.pin }]} />

      <LinearGradient
        colors={paletteStyles.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.surface, variant === 'hero' ? styles.heroSurface : styles.secondarySurface]}
      >
        <View style={styles.weaveOverlay} />
        <View style={[styles.stroke, { backgroundColor: paletteStyles.stroke }]} />
        <View style={styles.cornerCurl} />

        <Text style={[styles.rank, variant === 'hero' ? styles.heroRank : null]}>
          {`${rank}`.padStart(2, '0')}
        </Text>

        <Text style={[styles.category, { color: paletteStyles.category }]}>
          {(category || 'Project').toUpperCase()}
        </Text>

        <View style={styles.textBlock}>
          <Text style={[styles.title, variant === 'hero' ? styles.heroTitle : styles.secondaryTitle]} numberOfLines={variant === 'hero' ? 2 : 3}>
            {title}
          </Text>

          {description ? (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          ) : null}

          {status ? (
            <View style={styles.statusRow}>
              <MotiView
                from={{ opacity: 0.35, scale: 1 }}
                animate={{ opacity: 0.8, scale: 1.3 }}
                transition={{ type: 'timing', duration: 2200, loop: true }}
                style={[styles.statusDot, { backgroundColor: paletteStyles.dot }]}
              />
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tileWrap: {
    position: 'relative',
  },
  heroWrap: {
    transform: [{ rotate: '-0.5deg' }],
  },
  leftWrap: {
    transform: [{ rotate: '0.8deg' }],
  },
  rightWrap: {
    transform: [{ rotate: '-0.6deg' }],
  },
  tilePressed: {
    opacity: 0.94,
  },
  pin: {
    position: 'absolute',
    top: -3,
    left: 16,
    width: 20,
    height: 8,
    borderRadius: 1,
    zIndex: 5,
  },
  heroPin: {
    left: '50%',
    marginLeft: -14,
    width: 28,
  },
  surface: {
    overflow: 'hidden',
    borderRadius: 3,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  heroSurface: {
    minHeight: 175,
  },
  secondarySurface: {
    minHeight: 135,
  },
  weaveOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.045,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stroke: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  cornerCurl: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    transform: [{ skewX: '-20deg' }, { skewY: '-20deg' }],
  },
  rank: {
    position: 'absolute',
    top: 14,
    right: 14,
    fontFamily: typography.serif.regular,
    fontSize: 36,
    color: 'rgba(255,255,255,0.035)',
    lineHeight: 36,
  },
  heroRank: {
    fontSize: 52,
    lineHeight: 52,
  },
  category: {
    fontFamily: typography.mono.regular,
    fontSize: 8,
    letterSpacing: 2.5,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  title: {
    fontFamily: typography.serif.semiBold,
    color: colors.white,
    letterSpacing: -0.2,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  secondaryTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.50)',
  },
  statusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: typography.mono.regular,
    fontSize: 7,
    color: 'rgba(255,255,255,0.46)',
    letterSpacing: 1.5,
  },
  addSurface: {
    minHeight: 135,
    borderRadius: 3,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroAddSurface: {
    minHeight: 175,
  },
  addPressed: {
    opacity: 0.92,
  },
  addMark: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMarkText: {
    fontFamily: typography.serif.regular,
    fontSize: 20,
    color: 'rgba(0,0,0,0.30)',
  },
  addLabel: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: 'rgba(0,0,0,0.38)',
  },
});
