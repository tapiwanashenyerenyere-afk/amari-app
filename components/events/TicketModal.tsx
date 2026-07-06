import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GrainOverlay } from '@/components/ui/GrainOverlay';
import { useBarcode } from '@/hooks/useBarcode';
import {
  EVENT_TYPE_GRADIENTS,
  getEventDateParts,
  getEventTimeLabel,
  getEventTypeLabel,
} from '@/lib/events';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { Event, RsvpStatus } from '@/types/database';

interface TicketModalProps {
  event: Event | null;
  rsvpStatus: RsvpStatus | null;
  memberName: string;
  displayId: string;
  onCancel: (event: Event) => void;
  onClose: () => void;
  cancelling?: boolean;
}

export function TicketModal({
  event,
  rsvpStatus,
  memberName,
  displayId,
  onCancel,
  onClose,
  cancelling = false,
}: TicketModalProps) {
  const { data: barcode, isLoading: barcodeLoading } = useBarcode();

  if (!event) {
    return null;
  }

  const { day, month, year } = getEventDateParts(event.starts_at);
  const isWaitlisted = rsvpStatus === 'waitlisted';

  const confirmCancel = () => {
    Alert.alert(
      'Cancel this ticket?',
      'Your spot will be released. You can get a new ticket while the event has capacity.',
      [
        { text: 'Keep ticket', style: 'cancel' },
        { text: 'Cancel ticket', style: 'destructive', onPress: () => onCancel(event) },
      ],
    );
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Your ticket</Text>
          <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
            <X color="rgba(0,0,0,0.55)" size={18} strokeWidth={2.1} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.ticket}>
            <LinearGradient
              colors={EVENT_TYPE_GRADIENTS[event.type]}
              style={StyleSheet.absoluteFillObject}
            />
            <GrainOverlay opacity={0.04} />

            <View style={styles.ticketBody}>
              <View style={[styles.statusBadge, isWaitlisted ? styles.statusBadgeWaitlisted : null]}>
                <Text style={[styles.statusText, isWaitlisted ? styles.statusTextWaitlisted : null]}>
                  {isWaitlisted ? 'WAITLISTED' : 'CONFIRMED'}
                </Text>
              </View>

              <Text style={styles.type}>{getEventTypeLabel(event.type).toUpperCase()}</Text>
              <Text style={styles.title}>{event.title}</Text>

              <View style={styles.metaGrid}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaValue}>{`${day} ${month} ${year}`}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>TIME</Text>
                  <Text style={styles.metaValue}>{getEventTimeLabel(event.starts_at, event.ends_at)}</Text>
                </View>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>VENUE</Text>
                <Text style={styles.metaValue}>{event.venue_name || 'To be announced'}</Text>
                {event.venue_address ? (
                  <Text style={styles.metaSub}>{event.venue_address}</Text>
                ) : null}
              </View>

              {event.dress_code ? (
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>DRESS</Text>
                  <Text style={styles.metaValue}>{event.dress_code}</Text>
                </View>
              ) : null}

              <View style={styles.divider}>
                <View style={styles.notchLeft} />
                <View style={styles.dashLine} />
                <View style={styles.notchRight} />
              </View>

              <View style={styles.holderRow}>
                <View style={styles.holderInfo}>
                  <Text style={styles.metaLabel}>ADMIT</Text>
                  <Text style={styles.holderName}>{memberName}</Text>
                  <Text style={styles.holderId}>{displayId}</Text>
                </View>

                <View style={styles.qrPanel}>
                  {barcodeLoading || !barcode?.token ? (
                    <ActivityIndicator color={colors.black} size="small" />
                  ) : (
                    <QRCode
                      backgroundColor={colors.white}
                      color={colors.black}
                      size={104}
                      value={barcode.token}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.footnote}>
                {isWaitlisted
                  ? 'You are on the waitlist. If a spot opens, your pass admits you at the door.'
                  : 'Present this pass at the door. It refreshes daily, so screenshots expire.'}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={cancelling}
            onPress={confirmCancel}
            style={({ pressed }) => [styles.cancelButton, pressed ? styles.cancelPressed : null]}
          >
            {cancelling ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.cancelText}>Cancel ticket</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontFamily: typography.body.bold,
    fontSize: 22,
    color: colors.black,
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  ticket: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  ticketBody: {
    padding: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginBottom: 18,
  },
  statusBadgeWaitlisted: {
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  statusText: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.success,
    letterSpacing: 1.6,
  },
  statusTextWaitlisted: {
    color: colors.warning,
  },
  type: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 24,
    lineHeight: 29,
    color: colors.white,
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  metaBlock: {
    marginBottom: 14,
  },
  metaLabel: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  metaSub: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -24,
  },
  notchLeft: {
    width: 14,
    height: 28,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: colors.bone,
  },
  notchRight: {
    width: 14,
    height: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: colors.bone,
  },
  dashLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  holderInfo: {
    flex: 1,
  },
  holderName: {
    fontFamily: typography.body.bold,
    fontSize: 17,
    color: colors.white,
    letterSpacing: -0.2,
  },
  holderId: {
    marginTop: 3,
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  qrPanel: {
    width: 128,
    height: 128,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    marginTop: 18,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  cancelButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    opacity: 0.7,
  },
  cancelText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.error,
  },
});
