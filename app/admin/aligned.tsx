import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, T, S, R } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

interface PendingAlignedTile {
  id: string;
  type: 'project' | 'interest';
  description: string;
  visibility_tiers: string[] | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string | null;
  member_name: string;
  member_tier: string;
}

export default function AdminAlignedScreen() {
  const router = useRouter();
  const [tiles, setTiles] = useState<PendingAlignedTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchTiles = useCallback(async () => {
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from('aligned_tiles')
      .select('id, type, description, visibility_tiers, moderation_status, created_at, members!aligned_tiles_user_id_fkey(full_name, tier)')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch aligned queue error:', error);
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      visibility_tiers: row.visibility_tiers,
      moderation_status: row.moderation_status,
      created_at: row.created_at,
      member_name: row.members?.full_name || 'AMARI Member',
      member_tier: row.members?.tier || 'member',
    })) as PendingAlignedTile[];

    setTiles(normalized);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTiles();
  }, [fetchTiles]);

  const handleReview = async (tile: PendingAlignedTile, decision: 'approve' | 'reject') => {
    setActingId(tile.id);
    const { data, error } = await (supabase as any).rpc('review_aligned_tile', {
      p_tile_id: tile.id,
      p_decision: decision,
      p_reason: decision === 'reject' ? 'Rejected from the in-app aligned review queue.' : null,
    });
    setActingId(null);

    if (error || !data?.success) {
      Alert.alert('Could not update tile', error?.message || data?.error || 'Unknown error');
      return;
    }

    fetchTiles();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      <FlatList
        data={tiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTiles} tintColor={C.lightPrimary} />
        }
        ListHeaderComponent={(
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Admin</Text>
            </Pressable>
            <Text style={styles.title}>Aligned Queue</Text>
            <Text style={styles.subtitle}>
              Review Silver submissions before they go live inside Aligned.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isActing = actingId === item.id;

          return (
            <LiquidGlassCard variant="dark" style={styles.card}>
              <Text style={styles.cardEyebrow}>
                {item.type.toUpperCase()} · {item.member_tier.toUpperCase()}
              </Text>
              <Text style={styles.cardTitle}>{item.member_name}</Text>
              <Text style={styles.cardCopy}>{item.description}</Text>
              <Text style={styles.cardMeta}>
                Visible to {(item.visibility_tiers || []).join(', ') || 'platinum, laureate'}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn, isActing && styles.disabledBtn]}
                  disabled={isActing}
                  onPress={() => handleReview(item, 'approve')}
                >
                  <Text style={styles.approveText}>{isActing ? 'Working...' : 'Approve'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.rejectBtn, isActing && styles.disabledBtn]}
                  disabled={isActing}
                  onPress={() => handleReview(item, 'reject')}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            </LiquidGlassCard>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No aligned submissions are waiting for review.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  content: { paddingBottom: S._40 + 84 },
  header: { paddingHorizontal: S._20, paddingTop: S._8, marginBottom: S._12 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  title: { ...T.title, color: C.lightPrimary, marginTop: S._4 },
  subtitle: { ...T.body, color: C.lightTertiary, marginTop: S._8 },
  card: { marginHorizontal: S._12, marginBottom: S._8 },
  cardEyebrow: { ...T.label, color: C.goldOnDark, marginBottom: S._8 },
  cardTitle: { ...T.cardTitle, color: C.lightPrimary, marginBottom: S._6 },
  cardCopy: { ...T.body, color: C.lightSecondary, marginBottom: S._12 },
  cardMeta: { ...T.meta, color: C.lightFaint },
  actions: { flexDirection: 'row', gap: S._8, marginTop: S._16 },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  approveBtn: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.24)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  approveText: { ...T.meta, color: C.lightPrimary },
  rejectText: { ...T.meta, color: '#ffb4b4' },
  disabledBtn: { opacity: 0.6 },
  emptyText: { ...T.body, color: C.lightFaint, textAlign: 'center', paddingTop: S._24 },
});
