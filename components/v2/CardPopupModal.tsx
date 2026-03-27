import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '@/lib/theme';
import { ProfileMembershipCard } from './ProfileMembershipCard';

const AMARI_LOGO_DARK = require('../../assets/images/amari-logo-dark.png');

interface CardPopupModalProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  city?: string | null;
  tierLabel: string;
  displayId: string;
  memberUuid: string;
}

export function CardPopupModal({
  visible,
  onClose,
  fullName,
  city,
  tierLabel,
  displayId,
  memberUuid,
}: CardPopupModalProps) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    const timeout = setTimeout(() => setMounted(false), 420);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!mounted) {
    return null;
  }

  const qrValue = `https://amari.app/member/${memberUuid}`;
  const shareMessage = [
    `${fullName} · ${tierLabel}`,
    city || 'AMARI Member',
    displayId,
    qrValue,
  ].join('\n');

  const handleEmailPress = async () => {
    const subject = encodeURIComponent(`AMARI pass — ${fullName}`);
    const body = encodeURIComponent(`Here is my AMARI member pass.\n\n${shareMessage}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(emailUrl);
    if (!canOpen) {
      Alert.alert('Email unavailable', 'No mail app is available on this device.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(emailUrl);
  };

  const handleSharePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: `AMARI pass — ${fullName}`,
        message: shareMessage,
      });
    } catch {
      Alert.alert('Share unavailable', 'This pass could not be shared right now.');
    }
  };

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.root}>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.backdrop}
        />

        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.content} pointerEvents="box-none">
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.82 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            style={styles.cardWrap}
          >
            <ProfileMembershipCard
              fullName={fullName}
              city={city}
              tierLabel={tierLabel}
              displayId={displayId}
              size="expanded"
              showHint={false}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.92 }}
            transition={{ type: 'timing', duration: 320, delay: 180 }}
            style={styles.qrSection}
          >
            <View style={styles.qrShell}>
              <QRCode
                value={qrValue}
                size={156}
                color={colors.black}
                backgroundColor={colors.white}
                ecl="H"
              />
            </View>
            <Image source={AMARI_LOGO_DARK} style={styles.qrLogoMark} resizeMode="contain" />
            <Text style={styles.qrId}>{displayId}</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 10 }}
            transition={{ type: 'timing', duration: 260, delay: 260 }}
            style={styles.walletRow}
          >
            <Pressable
              style={({ pressed }) => [styles.walletButton, pressed && styles.walletButtonPressed]}
              onPress={() => {
                handleEmailPress();
              }}
            >
              <Text style={styles.walletButtonText}>Email pass</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.walletButton, pressed && styles.walletButtonPressed]}
              onPress={() => {
                handleSharePress();
              }}
            >
              <Text style={styles.walletButtonText}>Share to apps</Text>
            </Pressable>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: visible ? 1 : 0, translateY: visible ? 0 : 10 }}
            transition={{ type: 'timing', duration: 220, delay: 320 }}
          >
            <Text style={styles.dismissText}>Email directly or use the share sheet for Notes, Messages, and Mail.</Text>
          </MotiView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayHeavy,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  qrSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  qrShell: {
    width: 200,
    height: 200,
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrLogoMark: {
    width: 30,
    height: 30,
    marginTop: 14,
    opacity: 0.9,
  },
  qrId: {
    marginTop: 10,
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 2.5,
  },
  walletRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  walletButton: {
    flexGrow: 1,
    minWidth: 120,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  walletButtonPressed: {
    transform: [{ scale: 0.97 }],
    borderColor: 'rgba(196,162,101,0.32)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  walletButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.82)',
  },
  dismissText: {
    marginTop: 20,
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 1,
  },
});
