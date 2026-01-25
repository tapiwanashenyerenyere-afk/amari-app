import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TIER_DISPLAY_NAMES } from '../../lib/constants';
import { api, Event, Ticket } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

function calculateDaysAway(dateStr: string) {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function EventsScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const member = useAuthStore((state) => state.member);

  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        api.getEvents(),
        api.getTickets(),
      ]);

      setEvents(eventsRes.events);
      setTickets(ticketsRes.tickets);
    } catch (err) {
      console.error('Failed to fetch events data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // Split events into upcoming and past
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.eventDate) > now && !e.isInviteOnly)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const inviteOnlyEvents = events
    .filter(e => e.isInviteOnly && e.isInvited && new Date(e.eventDate) > now);

  const pastEvents = events
    .filter(e => new Date(e.eventDate) <= now)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 5); // Show last 5 past events

  const hasInvites = inviteOnlyEvents.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.charcoal}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.charcoal} />
          </View>
        ) : (
          <>
            {/* Your Tickets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>YOUR TICKETS</Text>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <Pressable key={ticket.id} style={styles.ticketCard}>
                    <Text style={styles.ticketEventName}>{ticket.event.title}</Text>
                    <Text style={styles.ticketDetails}>
                      {ticket.tableNumber && `Table ${ticket.tableNumber}`}
                      {ticket.tableNumber && ticket.seatNumber && ' • '}
                      {ticket.seatNumber && `Seat ${ticket.seatNumber}`}
                    </Text>
                    <View style={styles.qrPlaceholder}>
                      <Text style={styles.qrText}>[QR CODE]</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No tickets yet</Text>
                </View>
              )}
            </View>

            {/* Upcoming Events */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
              {upcomingEvents.length > 0 ? (
                <View style={styles.eventsList}>
                  {upcomingEvents.map((event) => (
                    <View key={event.id} style={styles.eventItem}>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>{event.title}</Text>
                        {event.minTier && (
                          <Text style={styles.tierBadge}>
                            {TIER_DISPLAY_NAMES[event.minTier as keyof typeof TIER_DISPLAY_NAMES]}+
                          </Text>
                        )}
                      </View>
                      <Text style={styles.eventDays}>
                        {calculateDaysAway(event.eventDate)} days
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No upcoming events</Text>
                </View>
              )}
            </View>

            {/* Invite Only */}
            {hasInvites && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>INVITE ONLY</Text>
                <View style={styles.eventsList}>
                  {inviteOnlyEvents.map((event) => (
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
            {pastEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PAST EVENTS</Text>
                <View style={styles.eventsList}>
                  {pastEvents.map((event) => (
                    <View key={event.id} style={styles.pastEventItem}>
                      <Text style={styles.pastEventName}>{event.title}</Text>
                      <Text style={styles.pastEventDate}>
                        {formatDate(event.eventDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
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
    marginBottom: 12,
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
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
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
