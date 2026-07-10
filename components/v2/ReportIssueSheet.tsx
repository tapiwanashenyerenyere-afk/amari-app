import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useReportIssue, type IssueCategory } from '@/queries/issues';

const CATEGORIES: { key: IssueCategory; label: string }[] = [
  { key: 'bug', label: 'Something broke' },
  { key: 'content', label: 'Content' },
  { key: 'account', label: 'Account' },
  { key: 'payment', label: 'Payment' },
  { key: 'suggestion', label: 'Suggestion' },
  { key: 'other', label: 'Other' },
];

export function ReportIssueSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<IssueCategory>('bug');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const report = useReportIssue();

  const close = () => {
    setMessage('');
    setCategory('bug');
    setDone(false);
    onClose();
  };

  const submit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await report.mutateAsync({ category, message });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={close} visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Report an issue</Text>
            <Text style={styles.subtitle}>Every AMARI admin is alerted straight away.</Text>
          </View>
          <Pressable hitSlop={8} onPress={close} style={styles.close}>
            <X color="rgba(0,0,0,0.55)" size={18} strokeWidth={2.1} />
          </Pressable>
        </View>

        {done ? (
          <View style={styles.doneWrap}>
            <View style={styles.doneRule} />
            <Text style={styles.doneTitle}>Thank you — it's with the team.</Text>
            <Text style={styles.doneText}>
              Every admin has been notified. We'll look into it and follow up if we need more.
            </Text>
            <Pressable onPress={close} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>WHAT KIND OF ISSUE?</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const on = category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(c.key);
                    }}
                    style={[styles.chip, on ? styles.chipOn : null]}
                  >
                    <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>WHAT HAPPENED?</Text>
            <TextInput
              multiline
              maxLength={2000}
              onChangeText={setMessage}
              placeholder="Describe what went wrong, what you expected, and where in the app…"
              placeholderTextColor={colors.grayLight}
              style={styles.input}
              value={message}
            />

            {report.isError ? (
              <Text style={styles.error}>Could not send just now. Check your connection and try again.</Text>
            ) : null}
          </ScrollView>
        )}

        {!done ? (
          <View style={styles.footer}>
            <Pressable
              disabled={report.isPending || message.trim().length < 5}
              onPress={submit}
              style={({ pressed }) => [
                styles.submit,
                message.trim().length < 5 ? styles.submitDisabled : null,
                pressed ? styles.submitPressed : null,
              ]}
            >
              {report.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitText}>Send to the team</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontFamily: typography.body.bold, fontSize: 24, color: colors.black, letterSpacing: -0.4 },
  subtitle: { marginTop: 4, fontFamily: typography.body.regular, fontSize: 12, color: colors.gray },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.xl, paddingTop: 18, paddingBottom: 24 },
  sectionLabel: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionLabelSpaced: { marginTop: 26 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontFamily: typography.body.medium, fontSize: 12.5, color: colors.black },
  chipTextOn: { color: colors.white },
  input: {
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.black,
    textAlignVertical: 'top',
  },
  error: { marginTop: 16, fontFamily: typography.body.regular, fontSize: 12, color: colors.error },
  footer: { paddingHorizontal: spacing.xl, paddingTop: 10, paddingBottom: 8 },
  submit: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitPressed: { opacity: 0.85 },
  submitText: { fontFamily: typography.body.semiBold, fontSize: 14, color: colors.white },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  doneRule: { width: 40, height: 2, backgroundColor: colors.sand, marginBottom: 18 },
  doneTitle: { fontFamily: typography.body.bold, fontSize: 18, color: colors.black, textAlign: 'center' },
  doneText: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.gray,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  doneButtonText: { fontFamily: typography.body.semiBold, fontSize: 13, color: colors.white },
});
