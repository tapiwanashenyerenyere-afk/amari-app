import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { AmariEmblem } from '@/components/v2/AmariEmblem';

const EXPECTATIONS = [
  'Qualified opportunities backed by real partnership supply',
  'A tighter review process before member introductions go live',
  'A clearer signal layer once the data is strong enough to trust',
];

export default function CorridorScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(width - spacing.xl * 2, 280), 460);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { width: contentWidth }]}>
          <LinearGradient
            colors={[colors.cardBase, colors.cardDark, colors.cardWarm]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <Text style={styles.eyebrow}>CORRIDOR</Text>
              <Text style={styles.statusPill}>COMING SOON</Text>
            </View>

            <Text style={styles.heroTitle}>We&apos;re keeping this room closed for now.</Text>
            <Text style={styles.heroBody}>
              We&apos;re still building the data depth and partnership quality needed for Corridor to
              be genuinely useful. Rather than open a thin marketplace, we&apos;re holding it back
              until the signal is strong enough.
            </Text>

            <View style={styles.heroWatermark}>
              <AmariEmblem size={60} variant="dark" />
            </View>
          </LinearGradient>

          <View style={styles.noteCard}>
            <Text style={styles.sectionLabel}>What happens next</Text>
            {EXPECTATIONS.map((item) => (
              <View key={item} style={styles.expectationRow}>
                <View style={styles.expectationDot} />
                <Text style={styles.expectationText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerEmblem}>
              <AmariEmblem size={42} variant="light" borderRadius={6} />
            </View>
            <Text style={styles.footerWordmark}>AMARI</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  inner: {
    alignSelf: 'center',
    paddingTop: 18,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    minHeight: 250,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    fontFamily: typography.body.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,162,101,0.28)',
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    marginTop: 26,
    maxWidth: 320,
    fontFamily: typography.serif.semiBold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroBody: {
    marginTop: 14,
    maxWidth: 360,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
  },
  heroWatermark: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    opacity: 0.05,
  },
  noteCard: {
    marginTop: 16,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  sectionLabel: {
    marginBottom: 12,
    fontFamily: typography.mono.regular,
    fontSize: 8,
    color: 'rgba(0,0,0,0.38)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  expectationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  expectationDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: colors.gold,
    opacity: 0.8,
  },
  expectationText: {
    flex: 1,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.black,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  footerEmblem: {
    opacity: 0.12,
  },
  footerWordmark: {
    marginTop: 10,
    fontFamily: typography.body.semiBold,
    fontSize: 9,
    color: 'rgba(0,0,0,0.16)',
    letterSpacing: 4,
  },
});
