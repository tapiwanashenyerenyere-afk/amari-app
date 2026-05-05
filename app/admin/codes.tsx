import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { MotiView } from 'moti';
import { C, T, S, R, TIERS } from '../../lib/constants';
import type { MembershipTier } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

interface CodeSummary {
  tier_grant: string;
  grants_admin: boolean;
  total: number;
  used: number;
  remaining: number;
}

interface CodeDetail {
  id: number;
  code_prefix: string;
  tier_grant: string;
  grants_admin: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
}

export default function CodesScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<CodeSummary[]>([]);
  const [recentCodes, setRecentCodes] = useState<CodeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('member');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Get all codes (admin policy allows full access)
    const { data: codes, error } = await supabase
      .from('invitation_codes')
      .select('id, code_prefix, tier_grant, grants_admin, used_by, used_at, expires_at')
      .order('used_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Fetch codes error:', error);
      setLoading(false);
      return;
    }

    const allCodes = codes || [];

    // Build summary by tier
    const tiers = ['laureate', 'platinum', 'silver', 'member'];
    const summaryData: CodeSummary[] = tiers.map(tier => {
      const tierCodes = allCodes.filter(c => c.tier_grant === tier);
      const used = tierCodes.filter(c => c.used_by !== null).length;
      return {
        tier_grant: tier,
        grants_admin: tier === 'laureate' && tierCodes.some(c => c.grants_admin),
        total: tierCodes.length,
        used,
        remaining: tierCodes.length - used,
      };
    });

    setSummary(summaryData);

    // Recently used codes (last 20)
    const recent = allCodes.filter(c => c.used_at).slice(0, 20);
    setRecentCodes(recent);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const TIER_LABEL_COLORS: Record<string, string> = {
    laureate: C.goldOnDark,
    platinum: '#E5E4E2',
    silver: '#C0C0C0',
    member: C.lightSecondary,
  };

  const handleCreateCode = async () => {
    if (!recipientName.trim() || !recipientEmail.trim()) {
      Alert.alert('Recipient required', 'Add the recipient name and email before creating a code.');
      return;
    }

    setCreating(true);
    const { data, error } = await supabase.rpc('admin_create_invitation_code', {
      p_recipient_name: recipientName.trim(),
      p_recipient_email: recipientEmail.trim(),
      p_tier: selectedTier,
      p_grants_admin: false,
      p_staff_role: null,
      p_expires_at: null,
    });
    setCreating(false);

    if (error) {
      Alert.alert('Code not created', error.message);
      return;
    }

    if (!data?.success) {
      Alert.alert('Code not created', data?.error || 'Unknown error');
      return;
    }

    const code = String(data.code);
    setRecipientName('');
    setRecipientEmail('');
    setSelectedTier('member');
    fetchData();

    Alert.alert('Membership code created', `${code}\n\nTier: ${selectedTier}`, [
      { text: 'Close', style: 'cancel' },
      {
        text: 'Share',
        onPress: () => {
          Share.share({
            title: 'AMARI membership code',
            message: `AMARI membership code for ${data.recipient_name}\n\n${code}\n\nTier: ${selectedTier}`,
          }).catch(() => Alert.alert('Share unavailable', 'The share sheet could not be opened.'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={recentCodes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={C.lightPrimary} />}
          ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backText}>← Admin</Text>
              </Pressable>
              <Text style={styles.title}>Invite Codes</Text>
            </View>

            <LiquidGlassCard variant="dark" style={styles.createCard}>
              <Text style={styles.createTitle}>Create Membership Code</Text>
              <Text style={styles.createHint}>Generate a one-use code for a named recipient.</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Recipient name"
                placeholderTextColor={C.lightFaint}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="Recipient email"
                placeholderTextColor={C.lightFaint}
              />
              <View style={styles.tierPicker}>
                {TIERS.map(tier => (
                  <Pressable
                    key={tier}
                    onPress={() => setSelectedTier(tier)}
                    style={[styles.tierButton, selectedTier === tier ? styles.tierButtonActive : null]}
                  >
                    <Text style={[styles.tierButtonText, selectedTier === tier ? styles.tierButtonTextActive : null]}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={creating}
                onPress={handleCreateCode}
                style={[styles.createButton, creating ? styles.createButtonDisabled : null]}
              >
                <Text style={styles.createButtonText}>{creating ? 'Creating...' : 'Create code'}</Text>
              </Pressable>
            </LiquidGlassCard>

            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              {summary.map((s, i) => (
                <MotiView
                  key={s.tier_grant}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: i * 60 }}
                >
                  <LiquidGlassCard variant="dark" style={styles.summaryCard}>
                    <Text style={[styles.summaryTier, { color: TIER_LABEL_COLORS[s.tier_grant] }]}>
                      {s.tier_grant.toUpperCase()}
                      {s.grants_admin ? ' + ADMIN' : ''}
                    </Text>
                    <View style={styles.summaryNumbers}>
                      <View style={styles.summaryNumBlock}>
                        <Text style={styles.summaryNum}>{s.remaining}</Text>
                        <Text style={styles.summaryNumLabel}>Available</Text>
                      </View>
                      <View style={styles.summaryNumBlock}>
                        <Text style={[styles.summaryNum, { color: C.lightFaint }]}>{s.used}</Text>
                        <Text style={styles.summaryNumLabel}>Used</Text>
                      </View>
                      <View style={styles.summaryNumBlock}>
                        <Text style={[styles.summaryNum, { color: C.lightTertiary }]}>{s.total}</Text>
                        <Text style={styles.summaryNumLabel}>Total</Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${s.total > 0 ? (s.used / s.total) * 100 : 0}%` }]} />
                    </View>
                  </LiquidGlassCard>
                </MotiView>
              ))}
            </View>

            {/* Recent Usage Header */}
            <Text style={styles.sectionTitle}>Recently Used</Text>
          </>
        }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 200, delay: index * 30 }}
            >
              <LiquidGlassCard variant="dark" style={styles.codeCard}>
                <View style={styles.codeRow}>
                  <View>
                    <Text style={styles.codePrefix}>{item.code_prefix || '???'}</Text>
                    <Text style={styles.codeTier}>{item.tier_grant}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.codeUsedAt}>
                      {item.used_at ? new Date(item.used_at).toLocaleDateString('en-AU', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </Text>
                  </View>
                </View>
              </LiquidGlassCard>
            </MotiView>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>No codes have been used yet.</Text>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  keyboardView: { flex: 1 },
  content: { paddingBottom: S._40 + 156 },
  header: { paddingHorizontal: S._20, paddingTop: S._8 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  title: { ...T.title, color: C.lightPrimary, marginTop: S._4 },
  createCard: { marginHorizontal: S._12, marginTop: S._16 },
  createTitle: { ...T.cardTitleSm, color: C.lightPrimary },
  createHint: { ...T.meta, color: C.lightTertiary, marginTop: S._4, marginBottom: S._12 },
  input: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: C.lightPrimary,
    backgroundColor: 'rgba(248,246,243,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.1)',
    borderRadius: 12,
    padding: S._12,
    paddingHorizontal: S._16,
    marginTop: S._8,
  },
  tierPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: S._8, marginTop: S._12 },
  tierButton: {
    paddingHorizontal: S._12,
    paddingVertical: S._8,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierButtonActive: { backgroundColor: 'rgba(114,47,55,0.4)', borderColor: 'rgba(114,47,55,0.6)' },
  tierButtonText: { ...T.meta, color: C.lightSecondary },
  tierButtonTextActive: { color: C.lightPrimary },
  createButton: {
    marginTop: S._16,
    minHeight: 44,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.burgundyOnDark,
  },
  createButtonDisabled: { opacity: 0.48 },
  createButtonText: { ...T.btn, color: C.lightPrimary },
  summaryGrid: { paddingHorizontal: S._12, marginTop: S._16, gap: S._8 },
  summaryCard: {},
  summaryTier: { ...T.label, marginBottom: S._12 },
  summaryNumbers: { flexDirection: 'row', gap: S._16 },
  summaryNumBlock: { alignItems: 'center' },
  summaryNum: { ...T.stat, fontSize: 20, color: C.lightPrimary },
  summaryNumLabel: { ...T.label, fontSize: 8, color: C.lightFaint, marginTop: S._2 },
  progressBar: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, marginTop: S._12, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.burgundyOnDark, borderRadius: 2 },
  sectionTitle: { ...T.label, color: C.lightTertiary, paddingHorizontal: S._20, marginTop: S._24, marginBottom: S._8 },
  codeCard: { marginHorizontal: S._12, marginBottom: S._6 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codePrefix: { ...T.cardTitleSm, color: C.lightPrimary, fontFamily: 'DMSans-SemiBold', letterSpacing: 1 },
  codeTier: { ...T.meta, color: C.lightFaint, marginTop: S._2 },
  codeUsedAt: { ...T.meta, color: C.lightTertiary },
  emptyText: { ...T.body, color: C.lightFaint, textAlign: 'center', paddingTop: S._24 },
});
