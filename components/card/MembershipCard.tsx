import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useBarcode } from '@/hooks/useBarcode';
import { radius, typography } from '@/lib/theme';
import type { MembershipTier } from '@/types/db-helpers';
import { CardEmblem } from './CardEmblem';
import { CARD_TIER_LABELS, TIER_CARD_STYLES } from './TierStyles';

export interface MembershipCardProfile {
  full_name?: string | null;
  display_id?: string | null;
  tier?: MembershipTier | null;
  title?: string | null;
  company?: string | null;
  city?: string | null;
  created_at?: string | null;
}

interface MembershipCardProps {
  profile: MembershipCardProfile;
  size: 'compact' | 'full';
  onPress?: () => void;
}

function formatExpiry(expiresAt?: string | null) {
  if (!expiresAt) {
    return 'Tap to refresh';
  }

  return new Date(expiresAt).toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
  });
}

function formatMemberSince(createdAt?: string | null) {
  if (!createdAt) {
    return new Date().getFullYear().toString();
  }

  return new Date(createdAt).getFullYear().toString();
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MembershipCard({ profile, size, onPress }: MembershipCardProps) {
  const tier = profile.tier ?? 'member';
  const palette = TIER_CARD_STYLES[tier];
  const barcode = useBarcode();
  const isFull = size === 'full';
  const sweep = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    if (palette.sweepOpacity > 0) {
      sweep.value = withRepeat(
        withTiming(1, { duration: tier === 'silver' ? 7000 : 6000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [palette.sweepOpacity, ringScale, sweep, tier]);

  const qrValue = barcode.data?.token ?? profile.display_id ?? 'AMARI';
  const displayId = profile.display_id ?? 'AMARI – 2026 – 0000';
  const fullName = profile.full_name?.trim() || 'AMARI Member';
  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const roleLine = [profile.title || profile.company, profile.city].filter(Boolean).join(' · ') || 'Tap to set your role';
  const memberSince = formatMemberSince(profile.created_at);
  const expiresLabel = formatExpiry(barcode.data?.expires_at);
  const avatarSize = isFull ? 72 : 60;
  const qrSize = isFull ? 78 : 50;
  const gradientColors = palette.gradientColors
    ? [...palette.gradientColors] as [string, string, ...string[]]
    : null;

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: palette.sweepOpacity,
    transform: [
      { translateX: interpolate(sweep.value, [0, 1], [-240, 240]) },
      { rotate: '-18deg' },
    ],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.touch}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Open membership card' : undefined}
    >
      <View
        style={[
          styles.card,
          isFull ? styles.cardFull : styles.cardCompact,
          {
            borderColor: palette.borderColor,
            shadowColor: palette.shadowColor,
            shadowOpacity: palette.shadowOpacity,
          },
        ]}
      >
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.backgroundColor }]} />
        )}

        {palette.sweepOpacity > 0 && <Animated.View style={[styles.sweep, sweepStyle]} />}

        <CardEmblem tier={tier} size={isFull ? 200 : 160} />

        {palette.showCornerMarks && (
          <>
            <View style={[styles.cornerMark, styles.cornerTopLeft, { borderColor: palette.faintText }]} />
            <View style={[styles.cornerMark, styles.cornerBottomRight, { borderColor: palette.faintText }]} />
          </>
        )}

        <View style={styles.inner}>
          <View style={styles.topRow}>
            <Text style={[styles.logo, { color: palette.textColor }]}>AMARI</Text>
            <View style={[styles.tierPill, { backgroundColor: palette.tierPillBackground }]}>
              <Text style={[styles.tierLabel, { color: palette.textColor }]}>
                {CARD_TIER_LABELS[tier]}
              </Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Animated.View
                style={[
                  styles.avatarRing,
                  ringStyle,
                  {
                    width: avatarSize + 10,
                    height: avatarSize + 10,
                    borderRadius: (avatarSize + 10) / 2,
                    borderColor: palette.avatarRing,
                  },
                ]}
              />
              <View
                style={[
                  styles.avatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: palette.avatarBackground,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: palette.avatarText }]}>{initials}</Text>
              </View>
            </View>

            <View style={styles.identityCopy}>
              <Text style={[styles.name, { color: palette.textColor }]} numberOfLines={2}>
                {fullName}
              </Text>
              <Text style={[styles.role, { color: palette.secondaryText }]} numberOfLines={2}>
                {roleLine}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.accent }]} />
          <Text style={[styles.memberId, { color: palette.faintText }]}>{displayId}</Text>

          <View style={styles.footerRow}>
            <View style={styles.metaColumn}>
              <Text style={[styles.metaLabel, { color: palette.secondaryText }]}>Member since</Text>
              <Text style={[styles.metaValue, { color: palette.textColor }]}>{memberSince}</Text>
            </View>

            <View style={styles.metaColumn}>
              <Text style={[styles.metaLabel, { color: palette.secondaryText }]}>Valid until</Text>
              <Text style={[styles.metaValue, { color: palette.textColor }]}>{expiresLabel}</Text>
            </View>

            <View style={[styles.qrShell, { backgroundColor: palette.qrBlock }]}>
              {barcode.isLoading ? (
                <View
                  style={[
                    styles.qrPlaceholder,
                    { width: qrSize, height: qrSize, backgroundColor: palette.qrColor },
                  ]}
                />
              ) : (
                <QRCode
                  value={qrValue}
                  size={qrSize}
                  color={palette.qrColor}
                  backgroundColor="transparent"
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    width: '100%',
  },
  card: {
    width: '100%',
    aspectRatio: 1.58,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 6,
  },
  cardCompact: {
    borderRadius: 20,
  },
  cardFull: {
    borderRadius: radius.xxl,
  },
  inner: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: typography.geo.bold,
    fontSize: 10,
    letterSpacing: 3,
  },
  tierPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tierLabel: {
    fontFamily: typography.body.semiBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  avatarWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.geo.bold,
    fontSize: 20,
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    fontFamily: typography.serif.medium,
    fontSize: 23,
    lineHeight: 24,
  },
  role: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  divider: {
    width: 42,
    height: 1,
    opacity: 0.45,
    marginTop: 10,
  },
  memberId: {
    fontFamily: typography.body.medium,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metaColumn: {
    gap: 4,
    maxWidth: '28%',
  },
  metaLabel: {
    fontFamily: typography.body.regular,
    fontSize: 10,
  },
  metaValue: {
    fontFamily: typography.geo.semiBold,
    fontSize: 14,
  },
  qrShell: {
    padding: 8,
    borderRadius: 16,
    minWidth: 66,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    borderRadius: 10,
    opacity: 0.18,
  },
  sweep: {
    position: 'absolute',
    top: -24,
    left: 0,
    width: 120,
    height: '160%',
    backgroundColor: '#FFFFFF',
  },
  cornerMark: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 1.5,
  },
  cornerTopLeft: {
    top: 14,
    left: 14,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomRight: {
    right: 14,
    bottom: 14,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
