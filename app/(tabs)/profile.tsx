import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ChevronRight, Eye, EyeOff, CreditCard, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, TIER_DISPLAY_NAMES, TIER_COLORS, TierType } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';

function TierBadge({ tier }: { tier: TierType }) {
  if (!tier) {
    return (
      <View style={styles.noTierBadge}>
        <Text style={styles.noTierText}>Member</Text>
      </View>
    );
  }

  const colors = TIER_COLORS[tier];
  const isCouncil = tier === 'council';

  if (isCouncil) {
    return (
      <View style={styles.councilSeal}>
        <View style={styles.councilOuter}>
          <View style={styles.councilInner}>
            <Text style={styles.councilText}>COUNCIL</Text>
            <View style={styles.councilDivider} />
            <Text style={styles.councilYear}>EST. 2024</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tierBadge, { backgroundColor: colors?.bg }]}>
      <Text style={[styles.tierBadgeText, { color: colors?.text }]}>
        {TIER_DISPLAY_NAMES[tier]}
      </Text>
    </View>
  );
}

function VisibilityToggle({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const getDisplayValue = (val: string) => {
    if (val === 'hidden') return 'Hidden';
    if (val === 'connections') return 'Connections';
    if (val === 'all') return 'All';
    return val;
  };

  const isVisible = value !== 'hidden';

  return (
    <View style={styles.visibilityRow}>
      {isVisible ? (
        <Eye size={14} color={COLORS.olive} strokeWidth={1.5} />
      ) : (
        <EyeOff size={14} color={COLORS.warmGray} strokeWidth={1.5} />
      )}
      <Text style={[styles.visibilityLabel, isVisible && styles.visibilityLabelActive]}>
        Visible to {getDisplayValue(value)}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const logout = useAuthStore((state) => state.logout);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Default visibility values
  const visibility = member?.visibility || {
    building: 'connections',
    interests: 'all',
    openTo: 'hidden',
  };

  // Generate member ID from id
  const memberId = member?.id ? `AM-${member.id.toString().padStart(4, '0')}` : 'AM-0000';

  if (!member) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.memberId}>{memberId}</Text>
        </View>

        {/* Tier Badge */}
        <View style={styles.tierSection}>
          <TierBadge tier={member.tier as TierType} />
        </View>

        {/* What I'm Building */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT I'M BUILDING</Text>
          <View style={styles.contentCard}>
            <Text style={styles.buildingText}>
              {member.building ? `"${member.building}"` : 'Not set yet'}
            </Text>
            <VisibilityToggle
              label="building"
              value={visibility.building || 'connections'}
            />
          </View>
        </View>

        {/* Interested In */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTED IN</Text>
          <View style={styles.contentCard}>
            {member.interests && member.interests.length > 0 ? (
              <View style={styles.tagsRow}>
                {member.interests.map((interest: string) => (
                  <View key={interest} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No interests set</Text>
            )}
            <VisibilityToggle
              label="interests"
              value={visibility.interests || 'all'}
            />
          </View>
        </View>

        {/* Open To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPEN TO</Text>
          <View style={styles.contentCard}>
            {member.openTo && member.openTo.length > 0 ? (
              <View style={styles.tagsRow}>
                {member.openTo.map((item: string) => (
                  <View key={item} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Not set</Text>
            )}
            <VisibilityToggle
              label="openTo"
              value={visibility.openTo || 'hidden'}
            />
          </View>
        </View>

        {/* Membership Card Link */}
        <View style={styles.section}>
          <Pressable
            style={styles.membershipCardButton}
            accessibilityLabel="View your membership card"
          >
            <View style={styles.membershipCardContent}>
              <CreditCard size={18} color={COLORS.white} strokeWidth={1.5} />
              <Text style={styles.membershipCardText}>View Membership Card</Text>
            </View>
            <ChevronRight size={20} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityLabel="Sign out"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={COLORS.burgundy} />
            ) : (
              <>
                <LogOut size={18} color={COLORS.burgundy} strokeWidth={1.5} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </>
            )}
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
  },
  name: {
    fontSize: 24,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  memberId: {
    fontSize: 12,
    color: COLORS.warmGray,
    letterSpacing: 1,
  },
  tierSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  noTierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.creamDark,
  },
  noTierText: {
    fontSize: 12,
    color: COLORS.warmGray,
    letterSpacing: 1,
  },
  tierBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  councilSeal: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: 'rgba(26, 26, 26, 0.3)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  councilOuter: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  councilInner: {
    alignItems: 'center',
  },
  councilText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    color: COLORS.charcoal,
  },
  councilDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    marginVertical: 6,
  },
  councilYear: {
    fontSize: 8,
    letterSpacing: 1,
    color: COLORS.warmGray,
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
  contentCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  buildingText: {
    fontSize: 15,
    color: COLORS.charcoal,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  visibilityLabel: {
    fontSize: 12,
    color: COLORS.warmGray,
  },
  visibilityLabelActive: {
    color: COLORS.olive,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.charcoal,
  },
  membershipCardButton: {
    backgroundColor: COLORS.charcoal,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  membershipCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.burgundy,
  },
});
