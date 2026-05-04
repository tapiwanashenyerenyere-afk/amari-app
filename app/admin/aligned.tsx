import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { C, R, S, T } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { GrainOverlay } from '../../components/ui/GrainOverlay';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';

type WorkTab = 'projects' | 'interests';
type ProjectStatus = 'pending' | 'approved' | 'rejected';
type TileStatus = 'pending' | 'approved' | 'rejected';

interface MemberLite {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface RegionLite {
  id: string;
  display_label: string | null;
  country_name: string | null;
  state_province: string | null;
  city_name: string | null;
}

interface ProjectSubmission {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  category: string;
  region_id: string;
  external_link: string | null;
  status: ProjectStatus;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string | null;
  submitterName: string;
  submitterEmail: string;
  location: string;
}

interface TileSubmission {
  id: string;
  user_id: string;
  type: string;
  description: string;
  tags: string[];
  location: string | null;
  is_active: boolean | null;
  moderation_status: TileStatus;
  rejected_reason: string | null;
  created_at: string | null;
  submitterName: string;
  submitterEmail: string;
}

function sentenceCase(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function compactDate(value: string | null) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function memberLabel(member: MemberLite | undefined, fallback = 'Unknown member') {
  return {
    email: member?.email?.trim() || 'No email',
    name: member?.full_name?.trim() || fallback,
  };
}

function regionLabel(region: RegionLite | undefined) {
  if (!region) return 'Unknown region';
  return region.display_label || [region.city_name, region.state_province, region.country_name].filter(Boolean).join(', ') || 'Unknown region';
}

function StatusPill({ status }: { status: string }) {
  const approved = status === 'approved';
  const pending = status === 'pending';
  return (
    <Text style={[styles.statusPill, approved ? styles.statusApproved : null, pending ? styles.statusPending : null]}>
      {status.toUpperCase()}
    </Text>
  );
}

export default function AdminAlignedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkTab>('projects');
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [tiles, setTiles] = useState<TileSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);

    const [projectResult, tileResult] = await Promise.all([
      supabase
        .from('projects')
        .select('id, creator_id, name, description, category, region_id, external_link, status, rejection_reason, published_at, created_at')
        .order('created_at', { ascending: false })
        .range(0, 999),
      supabase
        .from('aligned_tiles')
        .select('id, user_id, type, description, tags, location, is_active, moderation_status, rejected_reason, created_at')
        .order('created_at', { ascending: false })
        .range(0, 999),
    ]);

    if (projectResult.error) {
      console.error('Fetch submitted projects error:', projectResult.error);
    }
    if (tileResult.error) {
      console.error('Fetch aligned tiles error:', tileResult.error);
    }

    const projectRows = projectResult.data || [];
    const tileRows = tileResult.data || [];
    const memberIds = Array.from(new Set([...projectRows.map((row) => row.creator_id), ...tileRows.map((row) => row.user_id)].filter(Boolean)));
    const regionIds = Array.from(new Set(projectRows.map((row) => row.region_id).filter(Boolean)));

    const [memberResult, regionResult] = await Promise.all([
      memberIds.length
        ? supabase.from('members').select('id, full_name, email').in('id', memberIds)
        : Promise.resolve({ data: [] as MemberLite[], error: null }),
      regionIds.length
        ? supabase.from('region_centroids').select('id, display_label, country_name, state_province, city_name').in('id', regionIds)
        : Promise.resolve({ data: [] as RegionLite[], error: null }),
    ]);

    if (memberResult.error) {
      console.error('Fetch submitter members error:', memberResult.error);
    }
    if (regionResult.error) {
      console.error('Fetch project regions error:', regionResult.error);
    }

    const memberMap = new Map((memberResult.data || []).map((member) => [member.id, member]));
    const regionMap = new Map((regionResult.data || []).map((region) => [region.id, region]));

    setProjects(projectRows.map((row) => {
      const member = memberLabel(memberMap.get(row.creator_id), 'Project submitter');
      return {
        ...row,
        category: String(row.category),
        status: String(row.status) as ProjectStatus,
        submitterEmail: member.email,
        submitterName: member.name,
        location: regionLabel(regionMap.get(row.region_id)),
      };
    }));

    setTiles(tileRows.map((row) => {
      const member = memberLabel(memberMap.get(row.user_id), 'Tile submitter');
      return {
        ...row,
        moderation_status: String(row.moderation_status) as TileStatus,
        tags: Array.isArray(row.tags) ? row.tags : [],
        submitterEmail: member.email,
        submitterName: member.name,
      };
    }));

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const setProjectStatus = async (project: ProjectSubmission, nextStatus: ProjectStatus) => {
    const { data, error } = await supabase.rpc('admin_set_project_status', {
      p_project_id: project.id,
      p_status: nextStatus,
      p_reason: nextStatus === 'rejected' ? 'Rejected in the mobile admin panel' : null,
    });

    if (error) {
      Alert.alert('Project not updated', error.message);
      return;
    }
    if (!data?.success) {
      Alert.alert('Project not updated', data?.error || 'Unknown error');
      return;
    }

    Alert.alert('Project updated', `${project.name} is now ${nextStatus}.`);
    fetchSubmissions();
  };

  const reviewTile = async (tile: TileSubmission, decision: 'approve' | 'reject') => {
    const { data, error } = await supabase.rpc('review_aligned_tile', {
      p_tile_id: tile.id,
      p_decision: decision,
      p_reason: decision === 'reject' ? 'Rejected in the mobile admin panel' : null,
    });

    if (error) {
      Alert.alert('Submission not updated', error.message);
      return;
    }
    if (!data?.success) {
      Alert.alert('Submission not updated', data?.error || 'Unknown error');
      return;
    }

    Alert.alert('Submission updated', `Submission is now ${data.status}.`);
    fetchSubmissions();
  };

  const renderProject = ({ item, index }: { item: ProjectSubmission; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: Math.min(index * 35, 240) }}
    >
      <LiquidGlassCard variant="dark" style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardEyebrow}>{sentenceCase(item.category)} · {item.location}</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <StatusPill status={item.status} />
        </View>

        <Text style={styles.metaLine}>Submitted by {item.submitterName} · {item.submitterEmail}</Text>
        <Text style={styles.metaLine}>Created {compactDate(item.created_at)}{item.published_at ? ` · Published ${compactDate(item.published_at)}` : ''}</Text>
        {item.external_link ? <Text style={styles.linkLine}>{item.external_link}</Text> : null}
        {item.rejection_reason ? <Text style={styles.rejectLine}>{item.rejection_reason}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            disabled={item.status === 'approved'}
            onPress={() => setProjectStatus(item, 'approved')}
            style={[styles.actionButton, item.status === 'approved' ? styles.actionButtonDisabled : null]}
          >
            <Text style={styles.actionText}>Approve</Text>
          </Pressable>
          <Pressable
            disabled={item.status === 'rejected'}
            onPress={() => setProjectStatus(item, 'rejected')}
            style={[styles.actionButton, styles.rejectButton, item.status === 'rejected' ? styles.actionButtonDisabled : null]}
          >
            <Text style={styles.actionText}>Reject</Text>
          </Pressable>
        </View>
      </LiquidGlassCard>
    </MotiView>
  );

  const renderTile = ({ item, index }: { item: TileSubmission; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: Math.min(index * 35, 240) }}
    >
      <LiquidGlassCard variant="dark" style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardEyebrow}>{sentenceCase(item.type)} · {item.location || 'No location'}</Text>
            <Text style={styles.cardTitle}>{item.tags.length ? item.tags.map(sentenceCase).join(', ') : sentenceCase(item.type)}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <StatusPill status={item.moderation_status} />
        </View>

        <Text style={styles.metaLine}>Submitted by {item.submitterName} · {item.submitterEmail}</Text>
        <Text style={styles.metaLine}>Created {compactDate(item.created_at)} · {item.is_active ? 'Active' : 'Inactive'}</Text>
        {item.rejected_reason ? <Text style={styles.rejectLine}>{item.rejected_reason}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            disabled={item.moderation_status === 'approved'}
            onPress={() => reviewTile(item, 'approve')}
            style={[styles.actionButton, item.moderation_status === 'approved' ? styles.actionButtonDisabled : null]}
          >
            <Text style={styles.actionText}>Approve</Text>
          </Pressable>
          <Pressable
            disabled={item.moderation_status === 'rejected'}
            onPress={() => reviewTile(item, 'reject')}
            style={[styles.actionButton, styles.rejectButton, item.moderation_status === 'rejected' ? styles.actionButtonDisabled : null]}
          >
            <Text style={styles.actionText}>Reject</Text>
          </Pressable>
        </View>
      </LiquidGlassCard>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Admin</Text>
        </Pressable>
        <Text style={styles.title}>Submitted Work</Text>
        <Text style={styles.count}>{projects.length} projects · {tiles.length} interest tiles</Text>
      </View>

      <View style={styles.tabRow}>
        {(['projects', 'interests'] as WorkTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
              {tab === 'projects' ? `Projects (${projects.length})` : `Interests (${tiles.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'projects' ? (
        <FlatList<ProjectSubmission>
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSubmissions} tintColor={C.lightPrimary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No submitted projects yet.</Text>}
        />
      ) : (
        <FlatList<TileSubmission>
          data={tiles}
          keyExtractor={(item) => item.id}
          renderItem={renderTile}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSubmissions} tintColor={C.lightPrimary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No submitted interests yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  header: { paddingHorizontal: S._20, paddingTop: S._12, paddingBottom: S._12 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  title: { ...T.title, color: C.lightPrimary, marginTop: S._4 },
  count: { ...T.meta, color: C.lightTertiary, marginTop: S._4 },
  tabRow: {
    flexDirection: 'row',
    gap: S._8,
    paddingHorizontal: S._12,
    paddingBottom: S._12,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(114,47,55,0.44)',
    borderColor: 'rgba(201,169,98,0.24)',
  },
  tabText: { ...T.meta, color: C.lightSecondary },
  tabTextActive: { color: C.lightPrimary },
  listContent: {
    paddingHorizontal: S._12,
    paddingBottom: S._40 + 96,
    gap: S._12,
  },
  card: {},
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: S._12 },
  cardCopy: { flex: 1 },
  cardEyebrow: { ...T.label, color: C.goldOnDark, marginBottom: S._6 },
  cardTitle: { ...T.cardTitleSm, color: C.lightPrimary },
  cardDescription: { ...T.body, color: C.lightSecondary, marginTop: S._6 },
  statusPill: {
    ...T.label,
    paddingHorizontal: S._8,
    paddingVertical: S._4,
    borderRadius: R.pill,
    overflow: 'hidden',
    color: '#fca5a5',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  statusApproved: {
    color: C.goldOnDark,
    backgroundColor: 'rgba(201,169,98,0.12)',
  },
  statusPending: {
    color: C.lightPrimary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaLine: { ...T.meta, color: C.lightTertiary, marginTop: S._8 },
  linkLine: { ...T.meta, color: C.goldOnDark, marginTop: S._8 },
  rejectLine: { ...T.meta, color: '#fca5a5', marginTop: S._8 },
  actionRow: { flexDirection: 'row', gap: S._8, marginTop: S._16 },
  actionButton: {
    minHeight: 40,
    paddingHorizontal: S._16,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.burgundyOnDark,
  },
  rejectButton: {
    backgroundColor: 'rgba(239,68,68,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
  },
  actionButtonDisabled: { opacity: 0.42 },
  actionText: { ...T.btn, color: C.lightPrimary },
  emptyText: {
    ...T.body,
    color: C.lightTertiary,
    textAlign: 'center',
    paddingTop: S._40,
  },
});
