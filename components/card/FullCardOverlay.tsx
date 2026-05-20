import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useBarcode } from '@/hooks/useBarcode';
import { MembershipCard, type MembershipCardProfile } from './MembershipCard';

interface FullCardOverlayProps {
  profile: MembershipCardProfile;
  visible: boolean;
  onClose: () => void;
}

function formatExpiry(expiresAt?: string | null) {
  if (!expiresAt) {
    return 'Refreshing secure pass…';
  }

  return `Secure pass refreshes ${new Date(expiresAt).toLocaleString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  })}`;
}

export function FullCardOverlay({ profile, visible, onClose }: FullCardOverlayProps) {
  const barcode = useBarcode();
  const queryClient = useQueryClient();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <MembershipCard profile={profile} size="full" />

          <Text style={styles.metaText}>{formatExpiry(barcode.data?.expires_at)}</Text>
          <Text style={styles.subText}>
            This QR uses the secure AMARI token flow and refreshes from your active membership.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => queryClient.invalidateQueries({ queryKey: ['member', 'barcode'] })}
            >
              <Text style={styles.secondaryButtonText}>Refresh Pass</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    borderRadius: radius.xxl,
    backgroundColor: colors.bone,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metaText: {
    fontFamily: typography.geo.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.sand,
    textAlign: 'center',
  },
  subText: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    backgroundColor: colors.black,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.bone,
  },
});
