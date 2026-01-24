import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { COLORS, TIER_DISPLAY_NAMES, TIER_COLORS, TierType } from '../../lib/constants';

// Mock user data - NO GENDER FIELD
const MOCK_USER = {
  name: 'Tapiwa Matsinde',
  tier: 'laureate' as TierType, // null for new members
  memberId: 'AM-2024-0001',
  building: 'Creating a platform that connects African diaspora professionals globally',
  interests: ['Fintech', 'Impact', 'Design'],
  openTo: ['Collaborations', 'Mentoring'],
  visibility: {
    building: 'connections',
    interests: 'all',
    openTo: 'hidden',
  },
};

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
  options = ['Hidden', 'Connections', 'All']
}: {
  label: string;
  value: string;
  options?: string[];
}) {
  const getDisplayValue = (val: string) => {
    if (val === 'hidden') return 'Hidden';
    if (val === 'connections') return 'Connections';
    if (val === 'all') return 'All';
    return val;
  };

  return (
    <View style={styles.visibilityRow}>
      <Text style={styles.visibilityLabel}>
        Visible to {getDisplayValue(value)} {value !== 'hidden' ? '✓' : '✗'}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [user] = useState(MOCK_USER);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.memberId}>{user.memberId}</Text>
        </View>

        {/* Tier Badge */}
        <View style={styles.tierSection}>
          <TierBadge tier={user.tier} />
        </View>

        {/* What I'm Building */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT I'M BUILDING</Text>
          <View style={styles.contentCard}>
            <Text style={styles.buildingText}>"{user.building}"</Text>
            <VisibilityToggle
              label="building"
              value={user.visibility.building}
            />
          </View>
        </View>

        {/* Interested In */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTED IN</Text>
          <View style={styles.contentCard}>
            <View style={styles.tagsRow}>
              {user.interests.map((interest) => (
                <View key={interest} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
            <VisibilityToggle
              label="interests"
              value={user.visibility.interests}
            />
          </View>
        </View>

        {/* Open To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPEN TO</Text>
          <View style={styles.contentCard}>
            <View style={styles.tagsRow}>
              {user.openTo.map((item) => (
                <View key={item} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
            <VisibilityToggle
              label="openTo"
              value={user.visibility.openTo}
            />
          </View>
        </View>

        {/* Membership Card Link */}
        <View style={styles.section}>
          <Pressable
            style={styles.membershipCardButton}
            accessibilityLabel="View your membership card"
          >
            <Text style={styles.membershipCardText}>View Membership Card</Text>
            <Text style={styles.membershipCardArrow}>→</Text>
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
  visibilityRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  visibilityLabel: {
    fontSize: 12,
    color: COLORS.warmGray,
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
  membershipCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    letterSpacing: 1,
  },
  membershipCardArrow: {
    fontSize: 18,
    color: COLORS.white,
  },
});
