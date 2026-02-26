import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { X, ChevronRight, Sparkles, Users, Calendar, Instagram } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';
import { api, DiscoverContent } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import InstagramFeed from '../../components/InstagramFeed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DiscoverScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [content, setContent] = useState<DiscoverContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<DiscoverContent | null>(null);

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
        {/* Animated Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Curated by AMARI</Text>
        </MotiView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.charcoal} />
          </View>
        ) : (
          <>
            {/* Quick Stats Row - Animated */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
              style={styles.statsRow}
            >
              <View style={styles.statCard}>
                <Users size={20} color={COLORS.burgundy} strokeWidth={1.5} />
                <Text style={styles.statNumber}>250+</Text>
                <Text style={styles.statLabel}>MEMBERS</Text>
              </View>
              <View style={styles.statCard}>
                <Calendar size={20} color={COLORS.olive} strokeWidth={1.5} />
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>EVENTS</Text>
              </View>
              <View style={styles.statCard}>
                <Sparkles size={20} color="#D4AF37" strokeWidth={1.5} />
                <Text style={styles.statNumber}>47</Text>
                <Text style={styles.statLabel}>DAYS</Text>
              </View>
            </MotiView>

            {/* Laureate Spotlight - Animated Card */}
            {featuredSpotlight && (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 200 }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.spotlightCard,
                    pressed && styles.spotlightCardPressed,
                  ]}
                  onPress={() => setSelectedContent(featuredSpotlight)}
                  accessibilityLabel={`View spotlight: ${featuredSpotlight.title}`}
                >
                  {/* Animated gradient accent */}
                  <MotiView
                    from={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      loop: true,
                      type: 'timing',
                      duration: 2000,
                      repeatReverse: true,
                    }}
                    style={styles.spotlightAccent}
                  />
                  <Text style={styles.spotlightLabel}>LAUREATE SPOTLIGHT</Text>
                  <View style={styles.spotlightContent}>
                    <MotiView
                      from={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 400 }}
                      style={styles.spotlightAvatar}
                    >
                      <Text style={styles.avatarPlaceholder}>
                        {featuredSpotlight.featuredMember?.name?.charAt(0) || 'A'}
                      </Text>
                    </MotiView>
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
                    <Text style={styles.spotlightQuote} numberOfLines={3}>
                      "{featuredSpotlight.body}"
                    </Text>
                  )}
                  <Text style={styles.tapToRead}>Tap to read more</Text>
                </Pressable>
              </MotiView>
            )}

            {/* Instagram Feed Section */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Instagram size={18} color={COLORS.warmGray} strokeWidth={1.5} />
                <Text style={styles.sectionTitle}>AMARI ON INSTAGRAM</Text>
              </View>
              <InstagramFeed height={420} />
            </MotiView>

            {/* AMARI News - Animated List */}
            {news.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 400 }}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>AMARI NEWS</Text>
                <View style={styles.newsList}>
                  {news.map((item, index) => (
                    <MotiView
                      key={item.id}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'timing', duration: 300, delay: 450 + index * 100 }}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.newsItem,
                          pressed && styles.newsItemPressed,
                        ]}
                        onPress={() => setSelectedContent(item)}
                      >
                        <Text style={styles.newsBullet}></Text>
                        <Text style={styles.newsText}>{item.title}</Text>
                        <ChevronRight size={16} color={COLORS.warmGray} strokeWidth={1.5} />
                      </Pressable>
                    </MotiView>
                  ))}
                </View>
              </MotiView>
            )}

            {/* Partner Spotlight - Animated */}
            {partners.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 500 }}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>PARTNER SPOTLIGHT</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.partnerCard,
                    pressed && styles.partnerCardPressed,
                  ]}
                  onPress={() => setSelectedContent(partners[0])}
                >
                  <View style={styles.partnerCardContent}>
                    <Text style={styles.partnerName}>{partners[0].title}</Text>
                    {partners[0].body && (
                      <Text style={styles.partnerTagline}>{partners[0].body}</Text>
                    )}
                  </View>
                  <ChevronRight size={18} color={COLORS.warmGray} strokeWidth={1.5} />
                </Pressable>
              </MotiView>
            )}

            {/* Community Achievements - Animated */}
            {achievements.length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 600 }}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>COMMUNITY ACHIEVEMENTS</Text>
                <View style={styles.achievementsList}>
                  {achievements.map((item, index) => (
                    <MotiView
                      key={item.id}
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'timing', duration: 300, delay: 650 + index * 80 }}
                      style={styles.achievementItem}
                    >
                      <Text style={styles.achievementBullet}></Text>
                      <Text style={styles.achievementText}>{item.title}</Text>
                    </MotiView>
                  ))}
                </View>
              </MotiView>
            )}

            {/* Partners Directory - Animated Row */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 700 }}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>OUR PARTNERS</Text>
              <View style={styles.partnersRow}>
                {['Platinum', 'Gold', 'Silver'].map((tier, index) => (
                  <MotiView
                    key={tier}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 750 + index * 100 }}
                    style={styles.partnerBadge}
                  >
                    <Text style={styles.partnerBadgeText}>{tier}</Text>
                  </MotiView>
                ))}
              </View>
            </MotiView>

            {/* Empty State */}
            {content.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No content available</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Content Detail Modal with Animation */}
      <Modal
        visible={selectedContent !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedContent(null)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ translateY: 100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.modalContent}
          >
            <Pressable
              style={styles.modalClose}
              onPress={() => setSelectedContent(null)}
              accessibilityLabel="Close"
            >
              <X size={20} color={COLORS.charcoal} strokeWidth={1.5} />
            </Pressable>
            {selectedContent && (
              <>
                <Text style={styles.modalType}>
                  {selectedContent.type.toUpperCase()}
                </Text>
                <Text style={styles.modalTitle}>{selectedContent.title}</Text>
                {selectedContent.featuredMember && (
                  <View style={styles.modalMember}>
                    <View style={styles.modalMemberAvatar}>
                      <Text style={styles.modalMemberAvatarText}>
                        {selectedContent.featuredMember.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalMemberName}>
                        {selectedContent.featuredMember.name}
                      </Text>
                      {selectedContent.featuredMember.tier && (
                        <Text style={styles.modalMemberTier}>
                          {selectedContent.featuredMember.tier.charAt(0).toUpperCase()}
                          {selectedContent.featuredMember.tier.slice(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {selectedContent.body && (
                  <ScrollView style={styles.modalBody}>
                    <Text style={styles.modalBodyText}>"{selectedContent.body}"</Text>
                  </ScrollView>
                )}
                <Text style={styles.modalDate}>
                  Published {new Date(selectedContent.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </>
            )}
          </MotiView>
        </View>
      </Modal>
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
    fontFamily: 'Syne-SemiBold',
    fontSize: 32,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: COLORS.warmGray,
    letterSpacing: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontFamily: 'Syne-Bold',
    fontSize: 24,
    color: COLORS.charcoal,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.warmGray,
    marginTop: 2,
  },
  spotlightCard: {
    backgroundColor: COLORS.charcoal,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#D4AF37',
    opacity: 0.1,
    borderBottomLeftRadius: 100,
  },
  spotlightLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
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
    fontFamily: 'Syne-SemiBold',
    fontSize: 24,
    color: COLORS.white,
  },
  spotlightInfo: {
    flex: 1,
  },
  spotlightName: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 2,
  },
  spotlightYear: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 1,
  },
  spotlightQuote: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
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
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: COLORS.charcoal,
    flex: 1,
  },
  partnerCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  partnerTagline: {
    fontFamily: 'DMSans-Regular',
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
    fontFamily: 'DMSans-Regular',
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
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: COLORS.charcoal,
    letterSpacing: 1,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
  },
  spotlightCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  tapToRead: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },
  newsItemPressed: {
    backgroundColor: COLORS.creamDark,
  },
  partnerCardPressed: {
    backgroundColor: COLORS.creamDark,
  },
  partnerCardContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalType: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.warmGray,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 24,
    color: COLORS.charcoal,
    marginBottom: 20,
    marginRight: 32,
  },
  modalMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMemberAvatarText: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 20,
    color: COLORS.white,
  },
  modalMemberName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: COLORS.charcoal,
  },
  modalMemberTier: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 1,
  },
  modalBody: {
    maxHeight: 200,
    marginBottom: 20,
  },
  modalBodyText: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 18,
    color: COLORS.charcoal,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  modalDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: COLORS.warmGray,
  },
});
