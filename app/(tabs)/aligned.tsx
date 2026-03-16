import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useCurrentMatch } from '../../queries/aligned';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  Tag,
  StaggerReveal,
} from '../../components/v2';

export default function AlignedScreen() {
  const insets = useSafeAreaInsets();
  const { data: match } = useCurrentMatch();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal>
          {/* Header */}
          <View>
            <Text style={styles.title}>Aligned</Text>
          </View>
          <Text style={styles.subtitle}>
            Where two trajectories find their point of intersection. Mutual consent required.
          </Text>

          {/* Match Card */}
          <WhiteCard static>
            <View style={styles.matchCard}>
              {/* Avatar + Info */}
              <View style={styles.matchHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {match ? match.name?.split(' ').map((n: string) => n[0]).join('') : 'AK'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{match?.name || 'Dr. Amara Kofi'}</Text>
                  <Text style={styles.matchRole}>
                    {match?.role || 'Health-Tech Founder · Laureate'}
                  </Text>
                  <View style={styles.tags}>
                    <Tag variant="sand">{match?.tags?.[0] || 'AI in Healthcare'}</Tag>
                    <Tag variant="ghost">{match?.tags?.[1] || 'Melbourne'}</Tag>
                  </View>
                </View>
              </View>

              {/* Quote */}
              <View style={styles.quote}>
                <Text style={styles.quoteText}>
                  {match?.quote ||
                    '"Looking to connect with founders exploring AI ethics in the Australian regulatory landscape."'}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={styles.btnOutlined}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Text style={styles.btnOutlinedText}>Not Now</Text>
                </Pressable>
                <Pressable
                  style={styles.btnDark}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <Text style={styles.btnDarkText}>Express Interest</Text>
                </Pressable>
              </View>
            </View>
          </WhiteCard>

          {/* Why this match */}
          <SectionLabel>Why this match</SectionLabel>
          <WhiteCard static>
            <View style={styles.whyCard}>
              <Text style={styles.whyText}>
                You both listed{' '}
                <Text style={styles.whyBold}>Technology & Innovation</Text> and share
                connections through{' '}
                <Text style={styles.whyBold}>Incubate Foundation</Text>.
              </Text>
            </View>
          </WhiteCard>

          {/* Recent connections */}
          <SectionLabel>Recent connections</SectionLabel>
          <WhiteCard static>
            <View style={styles.connectionRow}>
              <View style={styles.connAvatar}>
                <Text style={styles.connAvatarText}>NK</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connName}>Nadia Kwame</Text>
                <Text style={styles.connDate}>Connected 3 days ago</Text>
              </View>
              <Tag variant="sand">Active</Tag>
            </View>
          </WhiteCard>
          <WhiteCard static>
            <View style={styles.connectionRow}>
              <View style={styles.connAvatar}>
                <Text style={styles.connAvatarText}>JM</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connName}>James Mensah</Text>
                <Text style={styles.connDate}>Connected 2 weeks ago</Text>
              </View>
            </View>
          </WhiteCard>
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
  // Match card
  matchCard: { padding: 18, paddingHorizontal: 16 },
  matchHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.serif.medium, fontSize: 16, color: colors.white },
  matchName: { fontFamily: typography.serif.medium, fontSize: 17, fontWeight: '500', color: colors.black, letterSpacing: -0.2 },
  matchRole: { fontFamily: typography.body.regular, fontSize: 11, color: colors.gray, marginTop: 2 },
  tags: { flexDirection: 'row', marginTop: 6 },
  quote: { borderLeftWidth: 2, borderLeftColor: 'rgba(160,133,107,0.2)', paddingLeft: 12, marginBottom: 14 },
  quoteText: { fontFamily: typography.body.regular, fontSize: 12, fontStyle: 'italic', color: colors.gray, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8 },
  btnOutlined: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.rule, alignItems: 'center' },
  btnOutlinedText: { fontFamily: typography.body.medium, fontSize: 12, color: colors.gray },
  btnDark: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.black, alignItems: 'center' },
  btnDarkText: { fontFamily: typography.body.medium, fontSize: 12, color: colors.white },
  // Why
  whyCard: { padding: 13, paddingHorizontal: 16 },
  whyText: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray, lineHeight: 19 },
  whyBold: { fontWeight: '500', color: colors.black },
  // Connections
  connectionRow: { padding: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  connAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
  connAvatarText: { fontFamily: typography.serif.medium, fontSize: 13, fontWeight: '500', color: colors.black },
  connName: { fontFamily: typography.body.medium, fontSize: 13, fontWeight: '500', color: colors.black },
  connDate: { fontFamily: typography.body.regular, fontSize: 10, color: '#bbb' },
});
