import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, radius } from '@/lib/theme';

interface MonthlyInvitePromptModalProps {
  visible: boolean;
  fullName: string;
  remaining: number;
  onPrimary: () => void;
  onDismiss: () => void;
}

export function MonthlyInvitePromptModal({
  visible,
  fullName,
  remaining,
  onPrimary,
  onDismiss,
}: MonthlyInvitePromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onDismiss} />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MONTHLY INVITES</Text>
          <Text style={styles.title}>Dear {fullName || 'Member'}</Text>
          <Text style={styles.body}>
            You have {remaining} invite {remaining === 1 ? 'code' : 'codes'} to send this month.
          </Text>
          <Text style={styles.copy}>
            You can invite people at Member, Silver, or Platinum level. Unused invites do not roll over, and team access is not granted through this flow.
          </Text>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={styles.secondaryText}>Later</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onPrimary}>
              <Text style={styles.primaryText}>Send Invites</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bone,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  eyebrow: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 26,
    color: colors.black,
    lineHeight: 30,
    marginBottom: 8,
  },
  body: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.black,
    lineHeight: 21,
  },
  copy: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 19,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
});
