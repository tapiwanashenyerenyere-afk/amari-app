import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TIER_DISPLAY_NAMES } from '../../lib/constants';

// Mock data
const MY_TICKETS = [
  {
    id: '1',
    eventName: 'AMARI GALA 2026',
    table: 'Table 7',
    seat: 'Seat 3',
    hasQR: true,
  },
];

const UPCOMING_EVENTS = [
  { id: '1', title: 'Nominee Dinner', minTier: 'platinum', daysAway: 12 },
  { id: '2', title: 'Networking Brunch', minTier: null, daysAway: 25 },
];

const INVITE_ONLY_EVENTS = [
  { id: '1', title: 'Council Strategy Session', isInvited: true },
];

const PAST_EVENTS = [
  { id: '1', title: 'AMARI Gala 2025', date: 'March 2025' },
  { id: '2', title: 'Launch Party 2024', date: 'October 2024' },
];

export default function EventsScreen() {
  // Mock: assume user has platinum tier and is invited to council event
  const userTier = 'platinum';
  const hasInvites = true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
        </View>

        {/* Your Tickets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR TICKETS</Text>
          {MY_TICKETS.map((ticket) => (
            <Pressable key={ticket.id} style={styles.ticketCard}>
              <Text style={styles.ticketEventName}>{ticket.eventName}</Text>
              <Text style={styles.ticketDetails}>
                {ticket.table} • {ticket.seat}
              </Text>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>[QR CODE]</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Upcoming Events - filtered by tier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
          <View style={styles.eventsList}>
            {UPCOMING_EVENTS.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.title}</Text>
                  {event.minTier && (
                    <Text style={styles.tierBadge}>
                      {TIER_DISPLAY_NAMES[event.minTier]}+
                    </Text>
                  )}
                </View>
                <Text style={styles.eventDays}>{event.daysAway} days</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Invite Only - only shows if user has invites */}
        {hasInvites && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INVITE ONLY</Text>
            <View style={styles.eventsList}>
              {INVITE_ONLY_EVENTS.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.title}</Text>
                    <View style={styles.invitedBadge}>
                      <Text style={styles.invitedText}>INVITED</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Past Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAST EVENTS</Text>
          <View style={styles.eventsList}>
            {PAST_EVENTS.map((event) => (
              <View key={event.id} style={styles.pastEventItem}>
                <Text style={styles.pastEventName}>{event.title}</Text>
                <Text style={styles.pastEventDate}>{event.date}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.charcoal,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.warmGray,
    marginBottom: 12,
  },
  ticketCard: {
    backgroundColor: COLORS.charcoal,
    padding: 24,
  },
  ticketEventName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: 4,
  },
  ticketDetails: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  qrPlaceholder: {
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 100,
    height: 100,
  },
  qrText: {
    fontSize: 10,
    color: COLORS.warmGray,
  },
  eventsList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventName: {
    fontSize: 15,
    color: COLORS.charcoal,
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.warmGray,
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 1,
  },
  eventDays: {
    fontSize: 12,
    color: COLORS.warmGray,
    fontVariant: ['tabular-nums'],
  },
  invitedBadge: {
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  invitedText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 1,
  },
  pastEventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pastEventName: {
    fontSize: 15,
    color: COLORS.warmGray,
  },
  pastEventDate: {
    fontSize: 12,
    color: COLORS.warmGray,
  },
});
