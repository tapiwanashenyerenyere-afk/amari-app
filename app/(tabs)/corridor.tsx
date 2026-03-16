import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useCorridorOpportunities } from '../../queries/corridor';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  Tag,
  KeyholeSmall,
  MicIcon,
  MentorIcon,
  VennIcon,
  StaggerReveal,
} from '../../components/v2';

const MORE_OPPS = [
  { icon: 'mic', title: 'Speaking Slot — Tech Summit', meta: 'Silver+ · 12 days left' },
  { icon: 'mentor', title: 'Mentorship — First-Gen Founders', meta: 'All members · Ongoing' },
  { icon: 'venn', title: 'Co-Founder Match — EdTech', meta: 'Platinum+ · 3 days left' },
];

function OpportunityIcon({ type }: { type: string }) {
  const iconColor = '#999';
  switch (type) {
    case 'mic': return <MicIcon color={iconColor} size={12} />;
    case 'mentor': return <MentorIcon color={iconColor} size={12} />;
    case 'venn': return <VennIcon color={iconColor} size={12} />;
    default: return <KeyholeSmall color={iconColor} size={12} />;
  }
}

export default function CorridorScreen() {
  const insets = useSafeAreaInsets();
  const { data: opportunities } = useCorridorOpportunities();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal delay={50}>
          {/* Header */}
          <View>
            <Text style={styles.title}>The Corridor</Text>
          </View>
          <Text style={styles.subtitle}>
            Where opportunity is exchanged. The private room, the quiet introduction, the door that opens.
          </Text>

          {/* Featured opportunity */}
          <WhiteCard static>
            <View style={styles.featuredCard}>
              {/* Header row */}
              <View style={styles.featuredHeader}>
                <View style={styles.featuredIconBox}>
                  <KeyholeSmall color={colors.sand} size={12} />
                </View>
                <Text style={styles.featuredBadge}>FEATURED</Text>
                <Text style={styles.featuredTimer}>5d left</Text>
              </View>

              <Text style={styles.featuredTitle}>
                Board Advisor — Series A FinTech
              </Text>
              <Text style={styles.featuredDesc}>
                Seeking experienced operators for advisory board. Equity-based compensation. Melbourne HQ.
              </Text>

              <View style={styles.featuredTags}>
                <Tag variant="sand">Finance</Tag>
                <Tag variant="ghost">Advisory</Tag>
                <Tag variant="ghost">Equity</Tag>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.ctaDark,
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                ]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Text style={styles.ctaDarkText}>Express Interest</Text>
              </Pressable>
            </View>
          </WhiteCard>

          {/* More opportunities */}
          <SectionLabel>More opportunities</SectionLabel>
          {MORE_OPPS.map((opp, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: 400 + i * 80 }}
            >
              <WhiteCard static>
                <View style={styles.oppRow}>
                  <View style={styles.oppIcon}>
                    <OpportunityIcon type={opp.icon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.oppTitle}>{opp.title}</Text>
                    <Text style={styles.oppMeta}>{opp.meta}</Text>
                  </View>
                </View>
              </WhiteCard>
            </MotiView>
          ))}
        </StaggerReveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  title: { fontFamily: typography.serif.medium, fontSize: 26, fontWeight: '500', color: colors.black, letterSpacing: -0.3 },
  subtitle: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  // Featured
  featuredCard: { padding: 18, paddingHorizontal: 16 },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  featuredIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.sandLight, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: { fontFamily: typography.geo.medium, fontSize: 9, color: colors.sand, letterSpacing: 1.5 },
  featuredTimer: { marginLeft: 'auto', fontFamily: typography.mono.regular, fontSize: 9, color: '#ccc' },
  featuredTitle: { fontFamily: typography.serif.medium, fontSize: 18, fontWeight: '500', color: colors.black, marginBottom: 6, letterSpacing: -0.2 },
  featuredDesc: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray, lineHeight: 19, marginBottom: 10 },
  featuredTags: { flexDirection: 'row', marginBottom: 14 },
  ctaDark: { paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.black, alignItems: 'center' },
  ctaDarkText: { fontFamily: typography.body.medium, fontSize: 12, fontWeight: '500', color: colors.white },
  // More opportunities
  oppRow: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  oppIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.ghost, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  oppTitle: { fontFamily: typography.body.medium, fontSize: 13, fontWeight: '500', color: colors.black },
  oppMeta: { fontFamily: typography.body.regular, fontSize: 11, color: colors.gray, marginTop: 2 },
});
