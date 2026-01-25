import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { api, DiscoverContent } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

export default function DiscoverScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [content, setContent] = useState<DiscoverContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getDiscover();
      setContent(res.content);
    } catch (err) {
      console.error('Failed to fetch discover content:', err);
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

  // Group content by type
  const spotlights = content.filter(c => c.type === 'spotlight');
  const news = content.filter(c => c.type === 'news');
  const achievements = content.filter(c => c.type === 'achievement');
  const partners = content.filter(c => c.type === 'partner');

  // Get featured spotlight
  const featuredSpotlight = spotlights.find(s => s.isFeatured) || spotlights[0];

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
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Curated by AMARI</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.charcoal} />
          </View>
        ) : (
          <>
            {/* Laureate Spotlight - TOP/FIRST */}
            {featuredSpotlight && (
              <View style={styles.spotlightCard}>
                <Text style={styles.spotlightLabel}>LAUREATE SPOTLIGHT</Text>
                <View style={styles.spotlightContent}>
                  <View style={styles.spotlightAvatar}>
                    <Text style={styles.avatarPlaceholder}>
                      {featuredSpotlight.featuredMember?.name?.charAt(0) || 'A'}
                    </Text>
                  </View>
                  <View style={styles.spotlightInfo}>
                    <Text style={styles.spotlightName}>
                      {featuredSpotlight.featuredMember?.name || featuredSpotlight.title}
                    </Text>
                    <Text style={styles.spotlightYear}>
                      {featuredSpotlight.featuredMember?.tier
                        ? `${featuredSpotlight.featuredMember.tier.charAt(0).toUpperCase()}${featuredSpotlight.featuredMember.tier.slice(1)}`
                        : 'Member'}
                    </Text>
                  </View>
                </View>
                {featuredSpotlight.body && (
                  <Text style={styles.spotlightQuote}>"{featuredSpotlight.body}"</Text>
                )}
              </View>
            )}

            {/* AMARI News */}
            {news.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AMARI NEWS</Text>
                <View style={styles.newsList}>
                  {news.map((item) => (
                    <View key={item.id} style={styles.newsItem}>
                      <Text style={styles.newsBullet}></Text>
                      <Text style={styles.newsText}>{item.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Partner Spotlight */}
            {partners.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PARTNER SPOTLIGHT</Text>
                <View style={styles.partnerCard}>
                  <Text style={styles.partnerName}>{partners[0].title}</Text>
                  {partners[0].body && (
                    <Text style={styles.partnerTagline}>{partners[0].body}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Community Achievements */}
            {achievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>COMMUNITY ACHIEVEMENTS</Text>
                <View style={styles.achievementsList}>
                  {achievements.map((item) => (
                    <View key={item.id} style={styles.achievementItem}>
                      <Text style={styles.achievementBullet}></Text>
                      <Text style={styles.achievementText}>{item.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

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

            {/* Empty State */}
            {content.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No content available</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.warmGray,
    letterSpacing: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
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
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
  },
});
