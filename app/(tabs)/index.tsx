import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { api, Event, Announcement } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

// Gala date - update this for the actual event
const GALA_DATE = new Date('2026-03-14T18:00:00');

function calculateTimeLeft() {
  const now = new Date();
  const diff = GALA_DATE.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

function calculateDaysAway(dateStr: string) {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const timeLeft = calculateTimeLeft();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [eventsRes, announcementsRes, connectionsRes] = await Promise.all([
        api.getEvents(),
        api.getAnnouncements(),
        api.getConnections(),
      ]);

      setEvents(eventsRes.events);
      setAnnouncements(announcementsRes.announcements);
      setConnectionsCount(connectionsRes.count);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
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

  // Get next upcoming event
  const upcomingEvents = events
    .filter(e => new Date(e.eventDate) > new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const nextEvent = upcomingEvents[0];

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
          <Text style={styles.wordmark}>AMARI</Text>
        </View>

        {/* Gala Countdown - Prominent */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownTitle}>AMARI GALA 2026</Text>
          <View style={styles.divider} />
          <View style={styles.countdownRow}>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNumber}>{timeLeft.days}</Text>
              <Text style={styles.countdownLabel}>DAYS</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNumber}>{timeLeft.hours}</Text>
              <Text style={styles.countdownLabel}>HRS</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNumber}>{timeLeft.minutes}</Text>
              <Text style={styles.countdownLabel}>MIN</Text>
            </View>
          </View>
        </View>

        {/* Next Event */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING</Text>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={COLORS.warmGray} />
            </View>
          ) : nextEvent ? (
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{nextEvent.title}</Text>
              <Text style={styles.eventDate}>
                {calculateDaysAway(nextEvent.eventDate)} DAYS
              </Text>
            </View>
          ) : (
            <View style={styles.eventCard}>
              <Text style={styles.emptyText}>No upcoming events</Text>
            </View>
          )}
        </View>

        {/* Connections Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR CONNECTIONS</Text>
          <View style={styles.connectionsCard}>
            <Text style={styles.connectionsCount}>{connectionsCount}</Text>
            <Text style={styles.connectionsLabel}>connections</Text>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANNOUNCEMENTS</Text>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={COLORS.warmGray} />
            </View>
          ) : announcements.length > 0 ? (
            <View style={styles.announcementsList}>
              {announcements.slice(0, 3).map((announcement) => (
                <View key={announcement.id} style={styles.announcementItem}>
                  <Text style={styles.announcementBullet}></Text>
                  <Text style={styles.announcementText}>{announcement.title}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.announcementsList}>
              <Text style={styles.emptyText}>No announcements</Text>
            </View>
          )}
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
    alignItems: 'center',
    marginBottom: 32,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 6,
    color: COLORS.charcoal,
  },
  countdownCard: {
    backgroundColor: COLORS.charcoal,
    padding: 32,
    marginBottom: 32,
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 4,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 24,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  countdownSeparator: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
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
  loadingCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 16,
    color: COLORS.charcoal,
  },
  eventDate: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.burgundy,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
  },
  connectionsCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  connectionsCount: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.charcoal,
    fontVariant: ['tabular-nums'],
  },
  connectionsLabel: {
    fontSize: 14,
    color: COLORS.warmGray,
  },
  announcementsList: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  announcementBullet: {
    fontSize: 14,
    color: COLORS.burgundy,
  },
  announcementText: {
    fontSize: 14,
    color: COLORS.charcoal,
    flex: 1,
  },
});
