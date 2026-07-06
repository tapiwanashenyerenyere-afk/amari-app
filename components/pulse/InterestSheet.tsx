import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { FEED_REGION_TAGS, FEED_TOPIC_TAGS, type FeedTag } from '@/constants/feedTags';
import { useFeedInterests, useSetFeedInterests } from '@/queries/news';

interface InterestSheetProps {
  visible: boolean;
  onClose: () => void;
}

function ChipGroup({
  tags,
  selected,
  onToggle,
}: {
  tags: FeedTag[];
  selected: Set<string>;
  onToggle: (tag: string) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {tags.map((entry) => {
        const isOn = selected.has(entry.tag);
        return (
          <Pressable
            key={entry.tag}
            onPress={() => onToggle(entry.tag)}
            style={[styles.chip, isOn ? styles.chipOn : null]}
          >
            <Text style={[styles.chipText, isOn ? styles.chipTextOn : null]}>
              {entry.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InterestSheet({ visible, onClose }: InterestSheetProps) {
  const { data: interests = [] } = useFeedInterests();
  const setInterests = useSetFeedInterests();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSelected(new Set(interests.map((interest) => interest.tag)));
    }
    // Only resync from server state when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggle = (tag: string) => {
    Haptics.selectionAsync();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const save = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setInterests.mutateAsync(Array.from(selected));
      onClose();
    } catch {
      // Mutation error state renders below; keep the sheet open.
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent={false} visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tune your feed</Text>
            <Text style={styles.subtitle}>
              The briefing ranks around what you choose here.
            </Text>
          </View>
          <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
            <X color="rgba(0,0,0,0.55)" size={18} strokeWidth={2.1} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>SECTORS</Text>
          <ChipGroup onToggle={toggle} selected={selected} tags={FEED_TOPIC_TAGS} />

          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>REGIONS</Text>
          <ChipGroup onToggle={toggle} selected={selected} tags={FEED_REGION_TAGS} />

          {setInterests.isError ? (
            <Text style={styles.errorText}>
              Your interests could not be saved. Check your connection and try again.
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={setInterests.isPending}
            onPress={save}
            style={({ pressed }) => [styles.saveButton, pressed ? styles.saveButtonPressed : null]}
          >
            {setInterests.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveText}>
                {selected.size ? `Save ${selected.size} ${selected.size === 1 ? 'interest' : 'interests'}` : 'Save'}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 8,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 24,
    color: colors.black,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 26,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: colors.white,
  },
  chipOn: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  chipText: {
    fontFamily: typography.body.medium,
    fontSize: 12.5,
    color: colors.black,
  },
  chipTextOn: {
    color: colors.white,
  },
  errorText: {
    marginTop: 20,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.error,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 8,
  },
  saveButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveText: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});
