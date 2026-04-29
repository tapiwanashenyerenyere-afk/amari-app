import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';
import {
  formatPulseDate,
  getPulseArticleBody,
  getPulseCategoryLabel,
  getPulseNominees,
} from '@/lib/pulse';
import type { GalaNominee } from '@/constants/galaNominees';
import type { PulseEdition } from '@/types/database';

interface PulseArticleModalProps {
  article: PulseEdition | null;
  matchFooter: string;
  onClose: () => void;
}

function groupNominees(nominees: GalaNominee[]) {
  return nominees.reduce<Array<{ category: string; nominees: GalaNominee[] }>>((groups, nominee) => {
    const existingGroup = groups.find((group) => group.category === nominee.category);
    if (existingGroup) {
      existingGroup.nominees.push(nominee);
    } else {
      groups.push({ category: nominee.category, nominees: [nominee] });
    }

    return groups;
  }, []);
}

export function PulseArticleModal({
  article,
  matchFooter,
  onClose,
}: PulseArticleModalProps) {
  if (!article) {
    return null;
  }

  const paragraphs = getPulseArticleBody(article);
  const nomineeGroups = groupNominees(getPulseNominees(article) as GalaNominee[]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <ArrowLeft color="rgba(0,0,0,0.55)" size={18} strokeWidth={2.1} />
            </Pressable>
          </View>

          <View style={styles.cover}>
            {article.hero_image_path ? (
              <Image
                source={{ uri: article.hero_image_path }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.coverPlaceholder}>Cover image</Text>
            )}
          </View>

          <View style={styles.body}>
            <Text style={styles.category}>{getPulseCategoryLabel(article)}</Text>
            <Text style={styles.title}>{article.headline}</Text>
            <Text style={styles.date}>{formatPulseDate(article.publish_date)}</Text>

            {paragraphs.length ? (
              paragraphs.map((paragraph, index) => (
                <Text key={`${article.id}-${index}`} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))
            ) : (
              <Text style={styles.paragraph}>
                This edition is live in the archive, but the editorial body has not been added yet.
              </Text>
            )}

            {nomineeGroups.length ? (
              <View style={styles.nomineeWrap}>
                {nomineeGroups.map((group) => (
                  <View key={group.category} style={styles.nomineeSection}>
                    <Text style={styles.nomineeSectionTitle}>{group.category}</Text>
                    <View style={styles.nomineeGrid}>
                      {group.nominees.map((nominee) => (
                        <View
                          key={`${group.category}-${nominee.name}`}
                          style={styles.nomineeCard}
                          accessibilityLabel={`${nominee.name}, ${group.category} AMARI Gala nominee`}
                        >
                          <Image
                            source={{ uri: nominee.imageUrl }}
                            style={styles.nomineeImage}
                            contentFit="cover"
                          />
                          <View style={styles.nomineeCopy}>
                            <Text style={styles.nomineeName} numberOfLines={2}>
                              {nominee.name}
                            </Text>
                            <Text style={styles.nomineeDetail} numberOfLines={2}>
                              {nominee.detail || `${group.category} nominee`}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.divider} />
            <Text style={styles.matchFooter}>{matchFooter}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  content: {
    paddingBottom: 60,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    height: 200,
    marginHorizontal: spacing.xl,
    marginBottom: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBase,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholder: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.18)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  category: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.goldDark,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.black,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  date: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(0,0,0,0.34)',
    marginBottom: 20,
  },
  paragraph: {
    fontFamily: typography.body.regular,
    fontSize: 15,
    lineHeight: 25,
    color: 'rgba(0,0,0,0.72)',
    marginBottom: 16,
  },
  nomineeWrap: {
    marginTop: 6,
  },
  nomineeSection: {
    marginTop: 20,
  },
  nomineeSectionTitle: {
    fontFamily: typography.mono.medium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.goldDark,
    marginBottom: 10,
  },
  nomineeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nomineeCard: {
    width: '48%',
    minHeight: 190,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  nomineeImage: {
    width: '100%',
    height: 122,
    backgroundColor: colors.cardBase,
  },
  nomineeCopy: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  nomineeName: {
    fontFamily: typography.body.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.black,
  },
  nomineeDetail: {
    marginTop: 4,
    fontFamily: typography.body.regular,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(0,0,0,0.48)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 24,
  },
  matchFooter: {
    fontFamily: typography.body.italic,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.46)',
  },
});
