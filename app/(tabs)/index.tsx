import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

// Mock countdown data
const GALA_DATE = new Date('2026-03-14T18:00:00');

function calculateTimeLeft() {
  const now = new Date();
  const diff = GALA_DATE.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export default function HomeScreen() {
  const timeLeft = calculateTimeLeft();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.eventCard}>
            <Text style={styles.eventName}>Nominee Dinner</Text>
            <Text style={styles.eventDate}>12 DAYS</Text>
          </View>
        </View>

        {/* Connections Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR CONNECTIONS</Text>
          <View style={styles.connectionsCard}>
            <Text style={styles.connectionsCount}>23</Text>
            <Text style={styles.connectionsLabel}>connections</Text>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANNOUNCEMENTS</Text>
          <View style={styles.announcementsList}>
            <View style={styles.announcementItem}>
              <Text style={styles.announcementBullet}>▸</Text>
              <Text style={styles.announcementText}>2026 Nominations Open</Text>
            </View>
            <View style={styles.announcementItem}>
              <Text style={styles.announcementBullet}>▸</Text>
              <Text style={styles.announcementText}>New Partner: SecondzAU</Text>
            </View>
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
