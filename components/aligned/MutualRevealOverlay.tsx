import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, radius } from '../../lib/theme';

interface MutualRevealProps {
  name: string;
  initials: string;
  role: string;
  tier: string;
  onStartConversation: () => void;
  onClose: () => void;
}

export default function MutualRevealOverlay({
  name,
  initials,
  role,
  tier,
  onStartConversation,
  onClose,
}: MutualRevealProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Card wrapper stops tap propagation to backdrop */}
      <Pressable onPress={() => {}} style={styles.cardTouchSink}>
        <Animated.View
          entering={ZoomIn.delay(150).duration(400).springify()}
          style={styles.card}
        >
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconY}>Y</Text>
          </View>

          <Text style={styles.cardTitle}>Mutual alignment</Text>
          <Text style={styles.cardSub}>
            They expressed interest in your work too. Here&apos;s who&apos;s behind
            the project. Reach out outside the app when you are ready.
          </Text>

          {/* Identity reveal */}
          <View style={styles.revealRow}>
            <View style={styles.revealAvatar}>
              <Text style={styles.revealInitials}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.revealName}>{name}</Text>
              <Text style={styles.revealRole}>
                {role} · {tier}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={styles.ctaBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStartConversation();
            }}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.ctaBtnText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </Pressable>

      <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouchSink: {
    zIndex: 2,
  },
  card: {
    width: 280,
    backgroundColor: colors.bone,
    borderRadius: radius.xxl,
    padding: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconY: {
    fontFamily: typography.serif.bold,
    fontSize: 22,
    color: colors.sandOnDark,
  },
  cardTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 22,
    color: colors.black,
    marginBottom: 8,
  },
  cardSub: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  revealAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealInitials: {
    fontFamily: typography.geo.bold,
    fontSize: 14,
    color: colors.sandOnDark,
  },
  revealName: {
    fontFamily: typography.geo.semiBold,
    fontSize: 15,
    color: colors.black,
  },
  revealRole: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 1,
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.bone,
  },
  closeBtn: {
    marginTop: 16,
    zIndex: 2,
  },
  closeText: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});
