import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile, useUpdateProfile } from '../../queries/members';
import { useMonthlyInviteStatus } from '../../queries/invites';
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

interface EditFieldState {
  label: string;
  key: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
}

interface MyTileRecord {
  id: string;
  type: string;
  description: string;
  is_active: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  visibility_tiers?: string[] | null;
  contact_enabled?: boolean | null;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: inviteStatus } = useMonthlyInviteStatus();
  const updateProfile = useUpdateProfile();
  const { data: corridorActivity } = useCorridorActivity();

  const { data: myTiles } = useQuery({
    queryKey: ['my-aligned-tiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('aligned_tiles')
        .select('id, type, description, is_active, moderation_status, visibility_tiers, contact_enabled')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MyTileRecord[];
    },
    enabled: !!user?.id,
  });

  const [editField, setEditField] = useState<EditFieldState | null>(null);
  const [showCardOverlay, setShowCardOverlay] = useState(false);

  const openEditField = useCallback(
    (
      label: string,
      key: string,
      value: string,
      options?: {
        placeholder?: string;
        multiline?: boolean;
      },
    ) => {
      setEditField({
        label,
        key,
        value,
        placeholder: options?.placeholder,
        multiline: options?.multiline,
      });
    },
    [],
  );

  const handleSave = useCallback(
    (value: string) => {
      if (!editField) return;
      const parsed =
        editField.key === 'skills' || editField.key === 'interests'
          ? value.split(',').map((item) => item.trim()).filter(Boolean)
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
    const fields = ['full_name', 'bio', 'company', 'industry', 'city', 'current_project', 'skills', 'interests'];
    fields.forEach((field) => {
      const value = profile[field as keyof typeof profile];
      if (Array.isArray(value)) {
        if (value.length > 0) filled++;
      } else if (value) {
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

          <View style={styles.completionRow}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
              <Text style={styles.completionPercent}>{profileCompletion}%</Text>
            </View>
            <ProgressBar progress={profileCompletion} />
          </View>

          <SectionLabel>Details</SectionLabel>
          <WhiteCard static>
            <InfoRow
              label="City"
              value={profile?.city || 'Tap to add'}
              onPress={() => openEditField('City', 'city', profile?.city || '')}
            />
            <InfoRow
              label="Company"
              value={profile?.company || 'Tap to add'}
              onPress={() => openEditField('Company', 'company', profile?.company || '')}
            />
            <InfoRow
              label="Sector"
              value={profile?.industry || 'Tap to add'}
              onPress={() => openEditField('Sector', 'industry', profile?.industry || '')}
            />
            <InfoRow
              label="Open To"
              value={profile?.bio || 'Tap to add'}
              onPress={() =>
                openEditField('Open To', 'bio', profile?.bio || '', {
                  placeholder: 'How should members think about working with you?',
                  multiline: true,
                })
              }
            />
            <InfoRow
              label="Current Project"
              value={profile?.current_project || 'Tap to add'}
              isLast
              onPress={() =>
                openEditField('Current Project', 'current_project', profile?.current_project || '', {
                  placeholder: 'What are you building or exploring right now?',
                  multiline: true,
                })
              }
            />
          </WhiteCard>

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
                  onPress={() => openEditField('Skills (comma-separated)', 'skills', '')}
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
                  onPress={() => openEditField('Interests (comma-separated)', 'interests', '')}
                  accessibilityRole="button"
                  accessibilityLabel="Add your interests"
                >
                  <Text style={styles.projectText}>Tap to add your interests</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.projectPanel}>
              <Text style={styles.projectLabel}>CURRENT PROJECT</Text>
              <Text style={styles.projectCopy}>
                {profile?.current_project || 'Add what you are building or exploring right now.'}
              </Text>
            </View>

            <View style={styles.editActionRow}>
              <Pressable
                style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.7 }]}
                onPress={() =>
                  openEditField(
                    'Skills (comma-separated)',
                    'skills',
                    Array.isArray(profile?.skills) ? (profile.skills as string[]).join(', ') : '',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Edit skills"
              >
                <Text style={styles.editChipText}>Skills</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.7 }]}
                onPress={() =>
                  openEditField(
                    'Interests (comma-separated)',
                    'interests',
                    Array.isArray(profile?.interests) ? (profile.interests as string[]).join(', ') : '',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Edit interests"
              >
                <Text style={styles.editChipText}>Interests</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.editChip, pressed && { opacity: 0.7 }]}
                onPress={() =>
                  openEditField('Current Project', 'current_project', profile?.current_project || '', {
                    placeholder: 'What are you building or exploring right now?',
                    multiline: true,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Edit current project"
              >
                <Text style={styles.editChipText}>Current Project</Text>
              </Pressable>
            </View>
          </WhiteCard>

          <SectionLabel>My Tiles</SectionLabel>
          <WhiteCard static>
            {myTiles && myTiles.length > 0 ? (
              <>
                <Text
                  style={[
                    styles.completionLabel,
                    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
                  ]}
                >
                  {myTiles.filter((tile) => tile.is_active).length} ACTIVE TILES
                </Text>
                {myTiles.map((tile) => (
                  <View key={tile.id} style={styles.tileRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tileType}>{tile.type || 'PROJECT'}</Text>
                      <Text style={styles.tileDesc} numberOfLines={1}>
                        {tile.description || 'Untitled tile'}
                      </Text>
                      <Text style={styles.tileMeta}>
                        {`${(tile.visibility_tiers || []).join(', ').toUpperCase() || 'PLATINUM, LAUREATE'}${tile.type === 'project' ? ` • EMAIL ${tile.contact_enabled ? 'OPEN' : 'CLOSED'}` : ''}`}
                      </Text>
                    </View>
                    <Badge>{(tile.moderation_status || 'approved').toUpperCase()}</Badge>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.projectText, { paddingTop: 14 }]}>
                Create your first tile on the Aligned tab
              </Text>
            )}
          </WhiteCard>

          {inviteStatus?.eligible ? (
            <>
              <SectionLabel>Monthly Invites</SectionLabel>
              <WhiteCard static>
                <InfoRow
                  label="Remaining"
                  value={`${inviteStatus.remaining} this month`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/member-invites' as any);
                  }}
                />
                <InfoRow
                  label="Sent"
                  value={`${inviteStatus.quota_used} of ${inviteStatus.quota_total}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/member-invites' as any);
                  }}
                />
                <InfoRow
                  label="Eligible Levels"
                  value="Member, Silver, Platinum"
                  isLast
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/member-invites' as any);
                  }}
                />
              </WhiteCard>
            </>
          ) : null}

          <SectionLabel>Corridor Activity</SectionLabel>
          <WhiteCard static>
            {corridorActivity && corridorActivity.length > 0 ? (
              corridorActivity.map((item: Record<string, unknown>) => {
                const opp = item.opportunity as {
                  id: number;
                  title: string;
                  type: string;
                  closing_date: string;
                  min_tier: string;
                } | null;
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
        placeholder={editField?.placeholder}
        multiline={editField?.multiline}
        isSaving={updateProfile.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  profileHeader: { padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.serif.medium,
    fontSize: 20,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: -0.5,
  },
  name: {
    fontFamily: typography.serif.medium,
    fontSize: 20,
    fontWeight: '500',
    color: colors.black,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  role: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.gray,
    marginTop: 2,
  },
  badgeCenter: { alignItems: 'center', marginVertical: 2 },
  completionRow: { paddingHorizontal: 4, marginTop: 12 },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  completionLabel: {
    fontFamily: typography.geo.medium,
    fontSize: typography.sizes.caption,
    color: colors.grayLight,
    letterSpacing: 1,
  },
  completionPercent: {
    fontFamily: typography.serif.medium,
    fontSize: 18,
    fontWeight: '500',
    color: colors.sand,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16, paddingTop: 0 },
  skillTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(139,115,85,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,115,85,0.1)',
  },
  skillTagText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.sand },
  interestTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.ghost,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  interestTagText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.gray },
  projectText: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 18,
  },
  projectPanel: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.ghost,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  projectLabel: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    color: colors.sand,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  projectCopy: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
  },
  editActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  editChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  editChipText: { fontFamily: typography.body.medium, fontSize: 11, color: colors.sand },
  tileRow: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  tileType: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    color: colors.sand,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tileDesc: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.black,
    marginTop: 2,
  },
  tileMeta: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: colors.gray,
    marginTop: 5,
  },
  activityRow: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  activityTitle: { fontFamily: typography.body.medium, fontSize: 13, color: colors.black },
  activityDate: { fontFamily: typography.body.regular, fontSize: 10, color: colors.grayLight, marginTop: 2 },
  activityBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  activityBadgeText: { fontFamily: typography.body.semiBold, fontSize: 9 },
  signOutBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
  },
  signOutText: { fontFamily: typography.body.regular, fontSize: 12, color: colors.gray },
});
