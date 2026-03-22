import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, TIER_DISPLAY_NAMES } from '@/lib/theme';
import { AvatarStack } from './v2/AvatarStack';

interface EventDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onRsvp: () => void;
  event: {
    id: number;
    title: string;
    description?: string;
    starts_at: string;
    venue_name?: string;
    capacity?: number;
    rsvp_count?: number;
    type?: string;
    min_tier?: string;
    attendee_initials?: string[];
  } | null;
  isRsvping?: boolean;
}

export function EventDetailSheet({
  visible,
  onClose,
  onRsvp,
  event,
  isRsvping = false,
}: EventDetailSheetProps) {
  if (!event) return null;

  const date = new Date(event.starts_at);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const seatsLeft = event.capacity && event.rsvp_count != null
    ? event.capacity - event.rsvp_count
    : event.capacity || null;

  const tierLabel = event.min_tier && event.min_tier !== 'member'
    ? `${TIER_DISPLAY_NAMES[event.min_tier]}+`
    : null;

  const handleRsvp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRsvp();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View style={styles.sheet}>
        <View style={styles.content}>
          {/* Grip bar — 32×3 per spec */}
          <View style={styles.handle} />

          {/* Type badge */}
          {event.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{event.type}</Text>
            </View>
          )}

          {/* Event ID */}
          <Text style={styles.eventId}>EVT-{String(event.id).padStart(4, '0')}</Text>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* 2×2 Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>WHEN</Text>
              <Text style={styles.infoValue}>{dateStr}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>TIME</Text>
              <Text style={styles.infoValue}>{timeStr}</Text>
            </View>
            {event.venue_name && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>WHERE</Text>
                <Text style={styles.infoValue}>{event.venue_name}</Text>
              </View>
            )}
            {event.capacity && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>SEATS</Text>
                <Text style={styles.infoValue}>
                  {event.capacity}
                  {seatsLeft != null && seatsLeft <= 15 && (
                    <Text style={styles.scarcity}> · {seatsLeft} left</Text>
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Attendee stack */}
          {event.attendee_initials && event.attendee_initials.length > 0 && (
            <View style={styles.attendeeRow}>
              <AvatarStack
                initials={event.attendee_initials.slice(0, 5)}
                extra={event.attendee_initials.length > 5 ? event.attendee_initials.length - 5 : undefined}
                size={24}
                borderColor={colors.bone}
              />
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionWrap}>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Actions — Close flex:1, RSVP flex:2 per spec */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              disabled={isRsvping}
              accessibilityRole="button"
              accessibilityLabel="Close event details"
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.rsvpBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleRsvp}
              disabled={isRsvping}
              accessibilityRole="button"
              accessibilityLabel={tierLabel ? `RSVP, requires ${tierLabel} membership` : 'RSVP to event'}
            >
              {isRsvping ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.rsvpText}>
                  RSVP{tierLabel ? ` · ${tierLabel}` : ''}
                </Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.bone,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.xxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.sandLight,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  typeText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    fontWeight: '500',
    color: colors.sand,
  },
  eventId: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: '#CCC',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 26,
    fontWeight: '500',
    color: colors.black,
    marginBottom: spacing.xl,
    letterSpacing: -0.3,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoCell: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoLabel: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    color: colors.sand,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
  },
  scarcity: {
    color: colors.sand,
    fontWeight: '500',
  },
  attendeeRow: {
    marginBottom: spacing.lg,
  },
  descriptionWrap: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(160,133,107,0.15)',
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  description: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  closeText: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray,
  },
  rsvpBtn: {
    flex: 2,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.sand,
  },
  rsvpText: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
});
