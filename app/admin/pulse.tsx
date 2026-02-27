import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { C, T, S, R } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

interface PulseEdition {
  id: number;
  publish_date: string;
  status: string;
  headline: string;
  created_at: string;
}

export default function PulseAdminScreen() {
  const router = useRouter();
  const [editions, setEditions] = useState<PulseEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEditions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pulse_editions')
      .select('id, publish_date, status, headline, created_at')
      .order('publish_date', { ascending: false })
      .limit(30);
    if (error) console.error('Fetch pulse error:', error);
    setEditions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEditions(); }, [fetchEditions]);

  const handleCreate = async () => {
    if (!headline) {
      Alert.alert('Required', 'Headline is required.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('pulse_editions').insert({
      publish_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      headline,
      summary_content: {
        blocks: [{ type: 'text', content: summary || 'Summary coming soon.' }],
      },
      full_content: {
        blocks: [{ type: 'text', content: fullContent || 'Full content coming soon.' }],
      },
      stats: { alchemists: 0, cities: 0, connections: 0, opportunities: 0 },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Created', 'Draft edition created.');
    setShowForm(false);
    setHeadline(''); setSummary(''); setFullContent('');
    fetchEditions();
  };

  const handlePublish = async (edition: PulseEdition) => {
    const newStatus = edition.status === 'published' ? 'archived' : 'published';
    const { error } = await supabase
      .from('pulse_editions')
      .update({ status: newStatus })
      .eq('id', edition.id);

    if (error) Alert.alert('Error', error.message);
    else fetchEditions();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEditions} tintColor={C.lightPrimary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Admin</Text>
          </Pressable>
          <View style={styles.headerRow}>
            <Text style={styles.title}>The Pulse</Text>
            <Pressable style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
              <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ New'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Create Form */}
        {showForm && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <LiquidGlassCard variant="dark" style={styles.formCard}>
              <Text style={styles.formLabel}>Headline</Text>
              <TextInput style={styles.input} value={headline} onChangeText={setHeadline}
                placeholder="This week's headline" placeholderTextColor={C.lightFaint} />

              <Text style={styles.formLabel}>Summary</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={summary} onChangeText={setSummary}
                placeholder="Brief summary for the card" placeholderTextColor={C.lightFaint} multiline />

              <Text style={styles.formLabel}>Full Content</Text>
              <TextInput style={[styles.input, { height: 120 }]} value={fullContent} onChangeText={setFullContent}
                placeholder="Full editorial content" placeholderTextColor={C.lightFaint} multiline />

              <Pressable
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Creating...' : 'Create Draft'}
                </Text>
              </Pressable>
            </LiquidGlassCard>
          </MotiView>
        )}

        {/* Editions List */}
        {editions.map((edition, i) => (
          <MotiView
            key={edition.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 50 }}
          >
            <LiquidGlassCard variant="dark" style={styles.editionCard}>
              <View style={styles.editionHeader}>
                <View style={[
                  styles.statusBadge,
                  edition.status === 'published' && styles.statusPublished,
                  edition.status === 'archived' && styles.statusArchived,
                ]}>
                  <Text style={styles.statusText}>{edition.status}</Text>
                </View>
                <Text style={styles.editionDate}>{edition.publish_date}</Text>
              </View>
              <Text style={styles.editionHeadline}>{edition.headline}</Text>
              <Pressable
                style={styles.publishBtn}
                onPress={() => handlePublish(edition)}
              >
                <Text style={styles.publishBtnText}>
                  {edition.status === 'published' ? 'Archive' : 'Publish'}
                </Text>
              </Pressable>
            </LiquidGlassCard>
          </MotiView>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 + 84 },
  header: { paddingHorizontal: S._20, paddingTop: S._8 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...T.title, color: C.lightPrimary },
  addBtn: {
    paddingVertical: S._8, paddingHorizontal: S._16,
    backgroundColor: 'rgba(114,47,55,0.5)',
    borderRadius: R.md, borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.6)',
  },
  addBtnText: { ...T.btn, color: C.lightPrimary, fontSize: 11 },
  formCard: { marginHorizontal: S._12, marginTop: S._16 },
  formLabel: { ...T.label, color: C.lightTertiary, marginTop: S._12, marginBottom: S._6 },
  input: {
    fontFamily: 'DMSans-Regular', fontSize: 14, color: C.lightPrimary,
    backgroundColor: 'rgba(248,246,243,0.06)', borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.1)', borderRadius: 10, padding: S._12,
  },
  submitBtn: {
    marginTop: S._20, paddingVertical: S._16,
    backgroundColor: 'rgba(114,47,55,0.6)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(196,112,122,0.2)', alignItems: 'center',
  },
  submitBtnText: { ...T.btn, color: C.lightPrimary },
  editionCard: { marginHorizontal: S._12, marginTop: S._8 },
  editionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S._8 },
  statusBadge: {
    paddingVertical: S._4, paddingHorizontal: S._8,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.sm,
  },
  statusPublished: { backgroundColor: 'rgba(16,185,129,0.15)' },
  statusArchived: { backgroundColor: 'rgba(255,255,255,0.04)' },
  statusText: { ...T.label, fontSize: 8, color: C.lightSecondary },
  editionDate: { ...T.meta, color: C.lightFaint },
  editionHeadline: { ...T.cardTitle, color: C.lightPrimary },
  publishBtn: { marginTop: S._12, alignSelf: 'flex-start' },
  publishBtnText: { ...T.meta, color: C.goldOnDark },
});
