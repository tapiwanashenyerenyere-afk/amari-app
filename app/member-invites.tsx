import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../lib/theme';
import {
  InviteTierGrant,
  useCreateMonthlyInvite,
  useMonthlyInviteStatus,
} from '../queries/invites';

const TIER_OPTIONS: InviteTierGrant[] = ['member', 'silver', 'platinum'];

function formatDate(value: string | null) {
  if (!value) return 'Not used yet';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MemberInvitesScreen() {
  const router = useRouter();
  const { data: inviteStatus, isLoading } = useMonthlyInviteStatus();
  const createInvite = useCreateMonthlyInvite();

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [tierGrant, setTierGrant] = useState<InviteTierGrant>('member');

  const canSubmit = useMemo(() => {
    return recipientName.trim().length > 1 && /\S+@\S+\.\S+/.test(recipientEmail) && !createInvite.isPending;
  }, [createInvite.isPending, recipientEmail, recipientName]);

  const handleCreateInvite = () => {
    if (!canSubmit) {
      Alert.alert('Missing details', 'Add a recipient name, a valid email, and choose a membership level.');
      return;
    }

    createInvite.mutate(
      {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        tierGrant,
      },
      {
        onSuccess: (data) => {
          setRecipientName('');
          setRecipientEmail('');
          setTierGrant('member');
          Alert.alert(
            'Invite created',
            `Code: ${data.code}\n\nSend this to ${data.recipient_name}. Remaining invites this month: ${data.remaining}.`,
          );
        },
        onError: (error: Error) => {
          Alert.alert('Could not create invite', error.message);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>INVITES</Text>
        <Text style={styles.title}>Member Invites</Text>
        <Text style={styles.subtitle}>
          Send up to 3 invites each month. Unused invites do not roll over, and this flow can grant only Member, Silver, or Platinum access.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryNumber}>
            {isLoading ? '...' : inviteStatus?.remaining ?? 0}
          </Text>
          <Text style={styles.summaryMeta}>
            {inviteStatus?.quota_used ?? 0} sent of {inviteStatus?.quota_total ?? 0}
          </Text>
        </View>

        {!inviteStatus?.eligible && !isLoading ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Invite access is not available on this membership.</Text>
            <Text style={styles.noticeCopy}>
              Platinum and Laureate members receive monthly invite allocations. Your current tier does not include this feature.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recipient Name</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Recipient full name"
                placeholderTextColor={colors.grayLight}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recipient Email</Text>
              <TextInput
                style={styles.input}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@example.com"
                placeholderTextColor={colors.grayLight}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Membership Level</Text>
              <View style={styles.tierRow}>
                {TIER_OPTIONS.map((option) => {
                  const selected = tierGrant === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.tierPill, selected && styles.tierPillActive]}
                      onPress={() => setTierGrant(option)}
                    >
                      <Text style={[styles.tierPillText, selected && styles.tierPillTextActive]}>
                        {option.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              disabled={!canSubmit}
              onPress={handleCreateInvite}
            >
              <Text style={styles.primaryText}>
                {createInvite.isPending ? 'Creating Invite...' : 'Create Invite'}
              </Text>
            </Pressable>
          </>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>Sent This Month</Text>
          {(inviteStatus?.invites?.length ?? 0) === 0 ? (
            <Text style={styles.emptyText}>No invites have been sent this month yet.</Text>
          ) : (
            inviteStatus?.invites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <Text style={styles.inviteRecipient}>{invite.recipient_name || 'Recipient'}</Text>
                  <Text style={styles.inviteTier}>{invite.tier_grant.toUpperCase()}</Text>
                </View>
                <Text style={styles.inviteEmail}>{invite.recipient_email}</Text>
                <Text style={styles.inviteCode}>{invite.code}</Text>
                <Text style={styles.inviteMeta}>
                  {invite.used_at ? `Redeemed ${formatDate(invite.used_at)}` : 'Awaiting redemption'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 56,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 12,
  },
  backText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
  eyebrow: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 30,
    color: colors.black,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  summaryCard: {
    marginTop: 18,
    padding: 18,
    backgroundColor: colors.black,
    borderRadius: radius.xl,
  },
  summaryLabel: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: colors.sandOnDark,
    letterSpacing: 2,
    marginBottom: 8,
  },
  summaryNumber: {
    fontFamily: typography.serif.medium,
    fontSize: 34,
    color: colors.white,
    lineHeight: 36,
  },
  summaryMeta: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.grayLight,
    marginTop: 6,
  },
  noticeCard: {
    marginTop: 20,
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  noticeTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.black,
  },
  noticeCopy: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
    marginTop: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: colors.gray,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 14,
    color: colors.black,
    fontFamily: typography.body.regular,
    fontSize: 13,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tierPill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  tierPillText: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.gray,
  },
  tierPillTextActive: {
    color: colors.white,
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  historySection: {
    marginTop: 28,
  },
  emptyText: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
  },
  inviteCard: {
    marginTop: 10,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  inviteRecipient: {
    flex: 1,
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  inviteTier: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 1.5,
  },
  inviteEmail: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    marginTop: 6,
  },
  inviteCode: {
    fontFamily: typography.mono.medium,
    fontSize: 12,
    color: colors.black,
    marginTop: 10,
  },
  inviteMeta: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 8,
  },
});
