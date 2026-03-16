import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile, useUpdateProfile } from '../../queries/members';
import { supabase } from '../../lib/supabase';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { TIER_DISPLAY_NAMES } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  InfoRow,
  Barcode,
  ProgressBar,
  Badge,
  StaggerReveal,
} from '../../components/v2';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const tierLabel = tier ? TIER_DISPLAY_NAMES[tier] || tier.toUpperCase() : 'MEMBER';

  const initials = useMemo(() => {
    if (!profile?.full_name) return 'AA';
    return profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let filled = 0;
    const fields = ['full_name', 'bio', 'company', 'industry', 'city'];
    fields.forEach((f) => {
      if (profile[f as keyof typeof profile]) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          supabase.auth.signOut();
        },
      },
    ]);
  };

  const fullName = profile?.full_name || 'AMARI Member';
  const nameParts = fullName.split(' ');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal delay={45}>
          {/* Profile Header */}
          <WhiteCard static>
            <View style={styles.profileHeader}>
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, delay: 100 }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </MotiView>
              <View>
                <Text style={styles.name}>
                  {nameParts[0]}
                  {nameParts.length > 1 && `\n${nameParts.slice(1).join(' ')}`}
                </Text>
                <Text style={styles.role}>
                  {profile?.company || 'Founder & CEO'}
                </Text>
              </View>
            </View>
          </WhiteCard>

          {/* Tier Badge */}
          <View style={styles.badgeCenter}>
            <Badge>{tierLabel}</Badge>
          </View>

          {/* Barcode */}
          <Barcode memberId={`AMARI-2026-${String(profile?.id || '4821').padStart(4, '0')}`} />

          {/* Profile completion */}
          <View style={styles.completionRow}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
              <Text style={styles.completionPercent}>{profileCompletion}%</Text>
            </View>
            <ProgressBar progress={profileCompletion} />
          </View>

          {/* Details */}
          <SectionLabel>Details</SectionLabel>
          <WhiteCard static>
            <InfoRow
              label="City Presence"
              value={profile?.city || 'Melbourne'}
              rightElement="toggle"
            />
            <InfoRow
              label="Building"
              value={profile?.company || 'Foundry Labs'}
            />
            <InfoRow
              label="Interests"
              value={profile?.industry || 'Technology & Innovation'}
            />
            <InfoRow
              label="Open To"
              value={profile?.bio || 'Connecting founders'}
              isLast
            />
          </WhiteCard>

          {/* Sign out */}
          <Pressable
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </StaggerReveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  // Header
  profileHeader: { padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.serif.medium, fontSize: 20, fontWeight: '500', color: colors.white, letterSpacing: -0.5 },
  name: { fontFamily: typography.serif.medium, fontSize: 20, fontWeight: '500', color: colors.black, lineHeight: 23, letterSpacing: -0.3 },
  role: { fontFamily: typography.body.regular, fontSize: 12, fontStyle: 'italic', color: colors.gray, marginTop: 2 },
  // Badge
  badgeCenter: { alignItems: 'center', marginVertical: 2 },
  // Completion
  completionRow: { paddingHorizontal: 4, marginTop: 12 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completionLabel: { fontFamily: typography.geo.medium, fontSize: 9, color: '#BBB', letterSpacing: 1 },
  completionPercent: { fontFamily: typography.serif.medium, fontSize: 18, fontWeight: '500', color: colors.sand },
  // Sign out
  signOutBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.rule, alignItems: 'center',
  },
  signOutText: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray },
});
