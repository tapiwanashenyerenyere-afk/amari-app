import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, T, S } from '../../lib/constants';
import { GrainOverlay } from '../../components/ui/GrainOverlay';
import { useAuth } from '../../providers/AuthProvider';
import { useIssueReports, useSetIssueStatus, type IssueReport } from '../../queries/issues';

const STATUS_FLOW: Record<IssueReport['status'], IssueReport['status']> = {
  open: 'reviewing',
  reviewing: 'resolved',
  resolved: 'open',
};

const STATUS_LABEL: Record<IssueReport['status'], string> = {
  open: 'OPEN',
  reviewing: 'REVIEWING',
  resolved: 'RESOLVED',
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminIssuesScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: issues = [], isLoading } = useIssueReports(isAdmin);
  const setStatus = useSetIssueStatus();

  const openCount = issues.filter((i) => i.status === 'open').length;

  const renderItem = ({ item }: { item: IssueReport }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Pressable
          onPress={() => setStatus.mutate({ id: item.id, status: STATUS_FLOW[item.status] })}
          style={[styles.statusPill, styles[`status_${item.status}`]]}
        >
          <Text style={[styles.statusText, styles[`statusText_${item.status}`]]}>{STATUS_LABEL[item.status]}</Text>
        </Pressable>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.meta}>
        {(item.reporter?.full_name ?? 'Member')} · {timeAgo(item.created_at)}
        {item.platform ? ` · ${item.platform}` : ''}
        {item.app_version ? ` · v${item.app_version}` : ''}
      </Text>
      {item.status === 'resolved' && item.reporter?.email ? (
        <Text style={styles.contactLine}>{item.reporter.email}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Command Centre</Text>
        <Text style={styles.title}>Issues</Text>
        <Text style={styles.summary}>
          {openCount} open · {issues.length} total
        </Text>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Loading reports…</Text>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No reports yet. Members can report issues from their Account tab.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  back: { ...T.label, color: C.lightTertiary, marginBottom: S._12 },
  eyebrow: { ...T.label, color: C.goldOnDark, marginBottom: S._4 },
  title: { ...T.hero, color: C.lightPrimary, fontSize: 32 },
  summary: { ...T.body, color: C.lightTertiary, marginTop: S._4 },
  list: { padding: S._16, paddingBottom: S._40 + 40 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: S._16,
    marginBottom: S._12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S._8 },
  category: { ...T.label, fontSize: 9, color: C.goldOnDark, letterSpacing: 1.6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  status_open: { backgroundColor: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.4)' },
  status_reviewing: { backgroundColor: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.4)' },
  status_resolved: { backgroundColor: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.4)' },
  statusText: { ...T.label, fontSize: 8, letterSpacing: 1.2 },
  statusText_open: { color: '#EF4444' },
  statusText_reviewing: { color: '#F59E0B' },
  statusText_resolved: { color: '#10B981' },
  message: { ...T.body, color: C.lightPrimary, lineHeight: 21 },
  meta: { ...T.meta, color: C.lightTertiary, marginTop: S._8 },
  contactLine: { ...T.meta, color: C.goldOnDark, marginTop: S._4 },
  empty: { ...T.body, color: C.lightTertiary, textAlign: 'center', marginTop: S._40, paddingHorizontal: S._24 },
});
