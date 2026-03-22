import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile, useUpdateProfile } from '../../queries/members';
import { supabase } from '../../lib/supabase';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  InfoRow,
  ProgressBar,
  Badge,
  StaggerReveal,
} from '../../components/v2';
import { EditFieldModal } from '../../components/EditFieldModal';
import { useCorridorActivity } from '../../hooks/useCorridorInterest';
import { FullCardOverlay } from '../../components/card/FullCardOverlay';
import { MembershipCard } from '../../components/card/MembershipCard';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const { data: corridorActivity } = useCorridorActivity();

  // Query aligned tiles for current user
  const { data: myTiles } = useQuery({
    queryKey: ['my-aligned-tiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('aligned_tiles')
        .select('id, type, description, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  const [editField, setEditField] = useState<{ label: string; key: string; value: string } | null>(null);
  const [showCardOverlay, setShowCardOverlay] = useState(false);

  const handleSave = useCallback(
    (value: string) => {
      if (!editField) return;
      const parsed =
        editField.key === 'skills' || editField.key === 'interests'
          ? value.split(',').map((s) => s.trim()).filter(Boolean)
          : value;
      updateProfile.mutate(
        { [editField.key]: parsed },
        {
          onSuccess: () => {
            setEditField(null);
          },
        },
      );
    },
    [editField, updateProfile],
  );

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let filled = 0;
    const fields = ['full_name', 'bio', 'company', 'industry', 'city', 'skills', 'interests'];
    fields.forEach((f) => {
      const val = profile[f as keyof typeof profile];
      if (Array.isArray(val)) {
        if (val.length > 0) filled++;
      } else if (val) {
        filled++;
      }
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
  const cardProfile = useMemo(
    () => ({
      full_name: profile?.full_name,
      display_id: profile?.display_id,
      title: profile?.title,
      company: profile?.company,
      city: profile?.city,
      created_at: profile?.created_at,
      tier: tier ?? 'member',
    }),
    [profile, tier],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal delay={45}>
          <MembershipCard
            profile={cardProfile}
            size="compact"
            onPress={() => setShowCardOverlay(true)}
          />

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
              value={profile?.city || 'Tap to add'}
              onPress={() =>
                setEditField({ label: 'City', key: 'city', value: profile?.city || '' })
              }
            />
            <InfoRow
              label="Building"
              value={profile?.company || 'Tap to add'}
              onPress={() =>
                setEditField({ label: 'Building', key: 'company', value: profile?.company || '' })
              }
            />
            <InfoRow
              label="Interests"
              value={profile?.industry || 'Tap to add'}
              onPress={() =>
                setEditField({ label: 'Interests', key: 'industry', value: profile?.industry || '' })
              }
            />
            <InfoRow
              label="Open To"
              value={profile?.bio || 'Tap to add'}
              isLast
              onPress={() =>
                setEditField({ label: 'Open To', key: 'bio', value: profile?.bio || '' })
              }
            />
          </WhiteCard>

          {/* Skills & Interests */}
          <SectionLabel>Skills & Interests</SectionLabel>
          <WhiteCard static>
            <View style={styles.tagRow}>
              {(profile?.skills as string[] | undefined)?.length ? (
                (profile.skills as string[]).map((skill: string) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))
              ) : (
                <Pressable
                  onPress={() =>
                    setEditField({
                      label: 'Skills (comma-separated)',
                      key: 'skills',
                      value: '',
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Add your skills"
                >
                  <Text style={styles.projectText}>Tap to add your skills</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.tagRow}>
              {(profile?.interests as string[] | undefined)?.length ? (
                (profile.interests as string[]).map((interest: string) => (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest}</Text>
                  </View>
                ))
              ) : (
                <Pressable
                  onPress={() =>
                    setEditField({
                      label: 'Interests (comma-separated)',
                      key: 'interests',
                      value: '',
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Add your interests"
                >
                  <Text style={styles.projectText}>Tap to add your interests</Text>
                </Pressable>
              )}
            </View>
            {profile?.current_project ? (
              <Text style={styles.projectText}>{profile.current_project as string}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
              onPress={() =>
                setEditField({
                  label: 'Skills (comma-separated)',
                  key: 'skills',
                  value: Array.isArray(profile?.skills) ? (profile.skills as string[]).join(', ') : '',
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Edit skills and interests"
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </WhiteCard>

          {/* My Tiles */}
          <SectionLabel>My Tiles</SectionLabel>
          <WhiteCard static>
            {myTiles && myTiles.length > 0 ? (
              <>
                <Text style={[styles.completionLabel, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }]}>
                  {myTiles.filter((t) => t.is_active).length} ACTIVE TILES
                </Text>
                {myTiles.map((tile) => (
                  <View key={tile.id} style={styles.tileRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tileType}>{tile.type || 'PROJECT'}</Text>
                      <Text style={styles.tileDesc} numberOfLines={1}>
                        {tile.description || 'Untitled tile'}
                      </Text>
                    </View>
                    <Badge>{tile.is_active ? 'ACTIVE' : 'PAUSED'}</Badge>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.projectText, { paddingTop: 14 }]}>
                Create your first tile on the Aligned tab
              </Text>
            )}
          </WhiteCard>

          {/* Corridor Activity */}
          <SectionLabel>Corridor Activity</SectionLabel>
          <WhiteCard static>
            {corridorActivity && corridorActivity.length > 0 ? (
              corridorActivity.map((item: Record<string, unknown>) => {
                const opp = item.opportunity as { id: number; title: string; type: string; closing_date: string; min_tier: string } | null;
                const status = (item.status as string) || 'pending';
                const itemId = item.id as string;
                const expressedAt = item.expressed_at as string | null;
                const statusColors: Record<string, { bg: string; text: string }> = {
                  pending: { bg: 'rgba(0,0,0,0.05)', text: colors.gray },
                  reviewed: { bg: 'rgba(139,115,85,0.1)', text: colors.sand },
                  accepted: { bg: 'rgba(16,185,129,0.1)', text: colors.success },
                  declined: { bg: 'rgba(239,68,68,0.1)', text: colors.error },
                };
                const sc = statusColors[status] || statusColors.pending;
                return (
                  <View key={itemId} style={styles.activityRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {opp?.title || 'Opportunity'}
                      </Text>
                      <Text style={styles.activityDate}>
                        {expressedAt
                          ? new Date(expressedAt).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </Text>
                    </View>
                    <View style={[styles.activityBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.activityBadgeText, { color: sc.text }]}>
                        {status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={[styles.projectText, { paddingTop: 14 }]}>
                Express interest in opportunities on the Corridor tab
              </Text>
            )}
          </WhiteCard>

          {/* Sign out */}
          <Pressable
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </StaggerReveal>
      </ScrollView>

      <FullCardOverlay
        profile={cardProfile}
        visible={showCardOverlay}
        onClose={() => setShowCardOverlay(false)}
      />

      <EditFieldModal
        visible={!!editField}
        onClose={() => setEditField(null)}
        onSave={handleSave}
        label={editField?.label || ''}
        currentValue={editField?.value || ''}
        multiline={editField?.key === 'bio'}
        isSaving={updateProfile.isPending}
      />
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
  completionLabel: { fontFamily: typography.geo.medium, fontSize: typography.sizes.caption, color: colors.grayLight, letterSpacing: 1 },
  completionPercent: { fontFamily: typography.serif.medium, fontSize: 18, fontWeight: '500', color: colors.sand },
  // Skills section
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16, paddingTop: 0 },
  skillTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(139,115,85,0.08)', borderWidth: 1, borderColor: 'rgba(139,115,85,0.1)' },
  skillTagText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.sand },
  interestTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.ghost, borderWidth: 1, borderColor: colors.rule },
  interestTagText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.gray },
  projectText: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray, fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 12, lineHeight: 18 },
  editBtn: { paddingHorizontal: 16, paddingBottom: 14, alignSelf: 'flex-start' as const },
  editBtnText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.sand },
  // Tiles section
  tileRow: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.rule },
  tileType: { fontFamily: typography.geo.medium, fontSize: 9, color: colors.sand, letterSpacing: 1, textTransform: 'uppercase' as const },
  tileDesc: { fontFamily: typography.body.regular, fontSize: 12, color: colors.black, marginTop: 2 },
  // Activity section
  activityRow: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.rule },
  activityTitle: { fontFamily: typography.body.medium, fontSize: 13, color: colors.black },
  activityDate: { fontFamily: typography.body.regular, fontSize: 10, color: colors.grayLight, marginTop: 2 },
  activityBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  activityBadgeText: { fontFamily: typography.body.semiBold, fontSize: 9 },
  // Sign out
  signOutBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.rule, alignItems: 'center',
  },
  signOutText: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray },
});
