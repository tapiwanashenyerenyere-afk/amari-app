import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

// Mock data - AMARI curated content only (NO UGC)
const LAUREATE_SPOTLIGHT = {
  name: 'Daniel Olasoji',
  year: '2025 Laureate',
  quote: 'Building the future of African innovation...',
  imageUrl: null,
};

const AMARI_NEWS = [
  { id: '1', title: 'Partnership with Zenith Bank' },
  { id: '2', title: 'Community reaches 1000 members' },
];

const PARTNER_SPOTLIGHT = {
  name: 'SecondzAU',
  tagline: 'Styling for the modern professional',
};

const COMMUNITY_ACHIEVEMENTS = [
  { id: '1', title: 'Meron launches in 3 markets' },
];

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Curated by AMARI</Text>
        </View>

        {/* Laureate Spotlight - TOP/FIRST */}
        <View style={styles.spotlightCard}>
          <Text style={styles.spotlightLabel}>LAUREATE SPOTLIGHT</Text>
          <View style={styles.spotlightContent}>
            <View style={styles.spotlightAvatar}>
              <Text style={styles.avatarPlaceholder}>
                {LAUREATE_SPOTLIGHT.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.spotlightInfo}>
              <Text style={styles.spotlightName}>{LAUREATE_SPOTLIGHT.name}</Text>
              <Text style={styles.spotlightYear}>{LAUREATE_SPOTLIGHT.year}</Text>
            </View>
          </View>
          <Text style={styles.spotlightQuote}>"{LAUREATE_SPOTLIGHT.quote}"</Text>
        </View>

        {/* AMARI News */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AMARI NEWS</Text>
          <View style={styles.newsList}>
            {AMARI_NEWS.map((item) => (
              <View key={item.id} style={styles.newsItem}>
                <Text style={styles.newsBullet}>▸</Text>
                <Text style={styles.newsText}>{item.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partner Spotlight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTNER SPOTLIGHT</Text>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerName}>{PARTNER_SPOTLIGHT.name}</Text>
            <Text style={styles.partnerTagline}>{PARTNER_SPOTLIGHT.tagline}</Text>
          </View>
        </View>

        {/* Community Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMUNITY ACHIEVEMENTS</Text>
          <View style={styles.achievementsList}>
            {COMMUNITY_ACHIEVEMENTS.map((item) => (
              <View key={item.id} style={styles.achievementItem}>
                <Text style={styles.achievementBullet}>▸</Text>
                <Text style={styles.achievementText}>{item.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partners Directory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OUR PARTNERS</Text>
          <View style={styles.partnersRow}>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>Platinum</Text>
            </View>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>Gold</Text>
            </View>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>Silver</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.warmGray,
    letterSpacing: 1,
  },
  spotlightCard: {
    backgroundColor: COLORS.charcoal,
    padding: 24,
    marginBottom: 24,
  },
  spotlightLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  spotlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  spotlightAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.burgundy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarPlaceholder: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '300',
  },
  spotlightInfo: {
    flex: 1,
  },
  spotlightName: {
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 2,
  },
  spotlightYear: {
    fontSize: 12,
    color: '#D4AF37', // Gold for Laureate
    letterSpacing: 1,
  },
  spotlightQuote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 22,
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
  newsList: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  newsBullet: {
    fontSize: 14,
    color: COLORS.burgundy,
  },
  newsText: {
    fontSize: 14,
    color: COLORS.charcoal,
    flex: 1,
  },
  partnerCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  partnerTagline: {
    fontSize: 14,
    color: COLORS.warmGray,
  },
  achievementsList: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  achievementBullet: {
    fontSize: 14,
    color: COLORS.olive,
  },
  achievementText: {
    fontSize: 14,
    color: COLORS.charcoal,
    flex: 1,
  },
  partnersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  partnerBadge: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  partnerBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.charcoal,
    letterSpacing: 1,
  },
});
