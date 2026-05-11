import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { C, T, S, R, TIERS } from '../../lib/constants';
import type { MembershipTier } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { TierBadge } from '../../components/badges/TierBadge';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

type MemberStatus = 'pending' | 'active' | 'suspended' | 'inactive';

interface Member {
  id: string;
  full_name: string;
  email: string;
  tier: MembershipTier;
  status: MemberStatus;
  city: string | null;
  industry: string | null;
  created_at: string;
}

const STATUS_OPTIONS: MemberStatus[] = ['active', 'pending', 'suspended', 'inactive'];

export default function MembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('members')
      .select('id, full_name, email, tier, status, city, industry, created_at')
      .order('created_at', { ascending: false })
      .range(0, 999);

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) console.error('Fetch members error:', error);
    setMembers(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleChangeTier = async (member: Member, newTier: MembershipTier) => {
    const { data, error } = await supabase.rpc('change_member_tier', {
      p_member_id: member.id,
      p_new_tier: newTier,
      p_reason: 'Admin tier change via admin panel',
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    if (data?.success) {
      Alert.alert('Success', `${member.full_name} is now ${newTier}`);
      setSelectedMember(null);
      fetchMembers();
    } else {
      Alert.alert('Failed', data?.error || 'Unknown error');
    }
  };

  const handleSetStatus = async (member: Member, nextStatus: MemberStatus) => {
    const runUpdate = async () => {
      const { data, error } = await supabase.rpc('admin_set_member_status', {
        p_member_id: member.id,
        p_status: nextStatus,
        p_reason: `Admin set ${member.full_name} to ${nextStatus} from mobile admin panel`,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data?.success) {
        Alert.alert('Updated', `${member.full_name} is now ${nextStatus}`);
        setSelectedMember(null);
        fetchMembers();
        return;
      }

      Alert.alert('Failed', data?.error || 'Unknown error');
    };

    if (nextStatus === 'suspended' || nextStatus === 'inactive') {
      Alert.alert(
        nextStatus === 'suspended' ? 'Kick out member?' : 'Deactivate member?',
        `${member.full_name} will lose active member access, but their history, projects, and audit records stay intact.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: nextStatus === 'suspended' ? 'Kick out' : 'Deactivate', style: 'destructive', onPress: runUpdate },
        ],
      );
      return;
    }

    await runUpdate();
  };

  const renderMember = ({ item, index }: { item: Member; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 40 }}
    >
      <Pressable onPress={() => setSelectedMember(selectedMember?.id === item.id ? null : item)}>
        <LiquidGlassCard variant="dark" style={styles.memberCard}>
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>
                {item.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{item.full_name}</Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
              <Text style={[styles.statusPill, item.status === 'active' ? styles.statusPillActive : null]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <TierBadge tier={item.tier} />
          </View>

          {selectedMember?.id === item.id && (
            <View style={styles.tierActions}>
              <Text style={styles.tierActionsLabel}>Change Tier</Text>
              <View style={styles.tierButtons}>
                {TIERS.map(t => (
                  <Pressable
                    key={t}
                    style={[
                      styles.tierBtn,
                      t === item.tier && styles.tierBtnActive,
                    ]}
                    onPress={() => t !== item.tier && handleChangeTier(item, t)}
                    disabled={t === item.tier}
                  >
                    <Text style={[
                      styles.tierBtnText,
                      t === item.tier && styles.tierBtnTextActive,
                    ]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.tierActionsLabel, styles.statusActionsLabel]}>Member Status</Text>
              <View style={styles.tierButtons}>
                {STATUS_OPTIONS.map(status => (
                  <Pressable
                    key={status}
                    style={[
                      styles.tierBtn,
                      status === item.status && styles.tierBtnActive,
                      status === 'suspended' && status !== item.status ? styles.dangerBtn : null,
                    ]}
                    onPress={() => status !== item.status && handleSetStatus(item, status)}
                    disabled={status === item.status}
                  >
                    <Text style={[
                      styles.tierBtnText,
                      status === item.status && styles.tierBtnTextActive,
                      status === 'suspended' && status !== item.status ? styles.dangerBtnText : null,
                    ]}>
                      {status === 'suspended' ? 'Kick out' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.memberMeta}>
                {item.city && <Text style={styles.metaText}>{item.city}</Text>}
                {item.industry && <Text style={styles.metaText}>{item.industry}</Text>}
                <Text style={styles.metaText}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
        </LiquidGlassCard>
      </Pressable>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Admin</Text>
        </Pressable>
        <Text style={styles.title}>Members</Text>
        <Text style={styles.count}>{members.length} loaded across all statuses</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email"
          placeholderTextColor={C.lightFaint}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMembers} tintColor={C.lightPrimary} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  header: { paddingHorizontal: S._20, paddingTop: S._8 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  title: { ...T.title, color: C.lightPrimary, marginTop: S._4 },
  count: { ...T.meta, color: C.lightFaint, marginTop: S._4 },
  searchContainer: { paddingHorizontal: S._12, marginTop: S._16, marginBottom: S._8 },
  searchInput: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: C.lightPrimary,
    backgroundColor: 'rgba(248,246,243,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.1)',
    borderRadius: 12,
    padding: S._12,
    paddingHorizontal: S._16,
  },
  list: { paddingHorizontal: S._12, paddingBottom: S._40 + 84, gap: S._8 },
  memberCard: { marginBottom: 0 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: S._12 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(114,47,55,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  memberInitials: { ...T.label, fontSize: 12, color: C.lightPrimary, letterSpacing: 0 },
  memberName: { ...T.cardTitleSm, color: C.lightPrimary },
  memberEmail: { ...T.meta, color: C.lightTertiary, marginTop: S._2 },
  statusPill: {
    ...T.label,
    alignSelf: 'flex-start',
    marginTop: S._6,
    paddingHorizontal: S._8,
    paddingVertical: S._4,
    borderRadius: R.pill,
    overflow: 'hidden',
    color: C.lightTertiary,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusPillActive: {
    color: C.goldOnDark,
    backgroundColor: 'rgba(201,169,98,0.12)',
  },
  tierActions: { marginTop: S._16, paddingTop: S._12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  tierActionsLabel: { ...T.label, color: C.lightTertiary, marginBottom: S._8 },
  statusActionsLabel: { marginTop: S._16 },
  tierButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: S._8 },
  tierBtn: {
    paddingVertical: S._8, paddingHorizontal: S._12,
    borderRadius: R.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierBtnActive: { backgroundColor: 'rgba(114,47,55,0.4)', borderColor: 'rgba(114,47,55,0.6)' },
  dangerBtn: { borderColor: 'rgba(239,68,68,0.44)', backgroundColor: 'rgba(239,68,68,0.10)' },
  tierBtnText: { ...T.meta, color: C.lightSecondary },
  tierBtnTextActive: { color: C.lightPrimary },
  dangerBtnText: { color: '#fca5a5' },
  memberMeta: { marginTop: S._12, gap: S._4 },
  metaText: { ...T.meta, color: C.lightFaint },
});
