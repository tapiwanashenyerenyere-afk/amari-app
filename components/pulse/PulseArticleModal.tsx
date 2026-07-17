import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  onClose: () => void;
}

type NomineeGroup = { category: string; nominees: GalaNominee[] };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function groupNominees(nominees: GalaNominee[]): NomineeGroup[] {
  return nominees.reduce<NomineeGroup[]>((groups, nominee) => {
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
  onClose,
}: PulseArticleModalProps) {
  if (!article) {
    return null;
  }

  const paragraphs = getPulseArticleBody(article);
  const nominees = getPulseNominees(article) as GalaNominee[];
  const nomineeGroups = groupNominees(nominees);

  if (nominees.length) {
    return (
      <NomineeDirectoryModal
        article={article}
        nominees={nominees}
        onClose={onClose}
      />
    );
  }

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
                contentFit="contain"
                contentPosition="center"
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
                          <View style={styles.nomineeImageFrame}>
                            <Image
                              source={{ uri: nominee.imageUrl }}
                              style={styles.nomineeImage}
                              contentFit="contain"
                              contentPosition="center"
                            />
                          </View>
                          <View style={styles.nomineeCopy}>
                            <Text style={styles.nomineeName} numberOfLines={2}>
                              {nominee.name}
                            </Text>
                            <Text style={styles.nomineeDetail} numberOfLines={2}>
                              {nominee.detail || `${group.category} nominee`}
                            </Text>
                            {nominee.blurb ? (
                              <Text style={styles.nomineeBlurb} numberOfLines={4}>
                                {nominee.blurb}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function NomineeDirectoryModal({
  article,
  nominees,
  onClose,
}: {
  article: PulseEdition;
  nominees: GalaNominee[];
  onClose: () => void;
}) {
  const [selectedNominee, setSelectedNominee] = React.useState<GalaNominee | null>(null);
  const nomineeGroups = groupNominees(nominees);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.nomineeRoot}>
        <FlatList
          data={nomineeGroups}
          keyExtractor={(group) => group.category}
          renderItem={({ item }) => (
            <NomineeCategorySection group={item} onSelectNominee={setSelectedNominee} />
          )}
          ListHeaderComponent={
            <View style={styles.nomineeHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close AMARI Gala nominees story"
                onPress={onClose}
                style={styles.backButton}
              >
                <ArrowLeft color="rgba(0,0,0,0.62)" size={18} strokeWidth={2.1} />
              </Pressable>

              <Text style={styles.category}>{getPulseCategoryLabel(article)}</Text>
              <Text style={styles.nomineeDirectoryTitle}>{article.headline}</Text>
              <Text style={styles.nomineeDirectoryIntro}>
                Scroll through each category, swipe across the nominees, then tap a card for
                the short AMARI note on who they are and what they are building.
              </Text>
            </View>
          }
          contentContainerStyle={styles.nomineeListContent}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
        <NomineeDetailModal
          nominee={selectedNominee}
          onClose={() => setSelectedNominee(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function NomineeCategorySection({
  group,
  onSelectNominee,
}: {
  group: NomineeGroup;
  onSelectNominee: (nominee: GalaNominee) => void;
}) {
  const { width } = useWindowDimensions();
  const availableWidth = Math.max(280, width - spacing.xl * 2);
  const cardWidth = Math.round(clamp(availableWidth * 0.48, 148, 188));
  const imageHeight = Math.round(clamp(cardWidth * 1.05, 154, 198));

  return (
    <View style={styles.directorySection}>
      <View style={styles.directorySectionHeader}>
        <Text style={styles.directorySectionTitle}>{group.category}</Text>
        <Text style={styles.directorySectionCount}>{group.nominees.length} nominees</Text>
      </View>

      <FlatList
        data={group.nominees}
        horizontal
        keyExtractor={(nominee) => `${group.category}-${nominee.name}`}
        renderItem={({ item }) => (
          <NomineeTile
            imageHeight={imageHeight}
            nominee={item}
            onPress={() => onSelectNominee(item)}
            width={cardWidth}
          />
        )}
        contentContainerStyle={styles.directoryCarousel}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        showsHorizontalScrollIndicator={false}
        windowSize={3}
      />
    </View>
  );
}

function NomineeTile({
  imageHeight,
  nominee,
  onPress,
  width,
}: {
  imageHeight: number;
  nominee: GalaNominee;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.directoryNomineeTile,
        { width },
        pressed ? styles.directoryNomineeTilePressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${nominee.name}, ${nominee.category} AMARI Gala nominee`}
    >
      <View style={[styles.directoryNomineeImageFrame, { height: imageHeight }]}>
        <Image
          source={{ uri: nominee.imageUrl }}
          style={styles.directoryNomineeImage}
          contentFit="contain"
          contentPosition="center"
          transition={120}
        />
      </View>

      <View style={styles.directoryNomineeCopy}>
        <Text style={styles.directoryNomineeName} numberOfLines={2}>
          {nominee.name}
        </Text>
        {nominee.detail ? (
          <Text style={styles.directoryNomineeDetail} numberOfLines={2}>
            {nominee.detail}
          </Text>
        ) : null}
        {nominee.blurb ? (
          <Text style={styles.directoryNomineeBlurb} numberOfLines={3}>
            {nominee.blurb}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function NomineeDetailModal({
  nominee,
  onClose,
}: {
  nominee: GalaNominee | null;
  onClose: () => void;
}) {
  const { height, width } = useWindowDimensions();
  const sheetMargin = width < 360 ? spacing.md : spacing.lg;
  const sheetMaxHeight = Math.round(height * 0.9);
  const detailImageHeight = Math.round(clamp(height * 0.28, 156, 270));

  if (!nominee) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.nomineeDetailOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close nominee details"
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.nomineeDetailSheet, { margin: sheetMargin, maxHeight: sheetMaxHeight }]}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.nomineeDetailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.nomineeDetailImageFrame, { height: detailImageHeight }]}>
              <Image
                source={{ uri: nominee.imageUrl }}
                style={styles.nomineeDetailImage}
                contentFit="contain"
                contentPosition="center"
                transition={140}
              />
            </View>

            <Text style={styles.nomineeDetailCategory}>{nominee.category}</Text>
            <Text style={styles.nomineeDetailName}>{nominee.name}</Text>
            {nominee.detail ? (
              <Text style={styles.nomineeDetailRole}>{nominee.detail}</Text>
            ) : null}
            {nominee.blurb ? (
              <Text style={styles.nomineeDetailBlurb}>{nominee.blurb}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close nominee details"
              onPress={onClose}
              style={styles.nomineeDetailClose}
            >
              <Text style={styles.nomineeDetailCloseText}>Close</Text>
            </Pressable>
          </ScrollView>
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
    height: 174,
    marginHorizontal: spacing.xl,
    marginBottom: 20,
    borderRadius: radius.lg,
    backgroundColor: '#17110B',
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
    gap: 10,
  },
  nomineeCard: {
    width: '100%',
    minHeight: 148,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
  },
  nomineeImageFrame: {
    width: 112,
    minHeight: 148,
    backgroundColor: '#F4EFE6',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
    padding: 5,
  },
  nomineeImage: {
    width: '100%',
    height: '100%',
  },
  nomineeCopy: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'center',
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
  nomineeBlurb: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.64)',
  },
  nomineeRoot: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  nomineeListContent: {
    paddingBottom: 42,
  },
  nomineeHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 22,
  },
  nomineeDirectoryTitle: {
    marginTop: 6,
    fontFamily: typography.body.bold,
    fontSize: 30,
    lineHeight: 35,
    color: colors.black,
    letterSpacing: -0.5,
  },
  nomineeDirectoryIntro: {
    marginTop: 10,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(0,0,0,0.56)',
  },
  directorySection: {
    marginBottom: 28,
  },
  directorySectionHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  directorySectionTitle: {
    flex: 1,
    fontFamily: typography.body.bold,
    fontSize: 22,
    lineHeight: 27,
    color: colors.black,
    letterSpacing: -0.3,
  },
  directorySectionCount: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    lineHeight: 13,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  directoryCarousel: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  },
  directoryNomineeTile: {
    width: 176,
    marginRight: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  directoryNomineeTilePressed: {
    opacity: 0.72,
  },
  directoryNomineeImageFrame: {
    height: 184,
    backgroundColor: colors.warm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    padding: 8,
  },
  directoryNomineeImage: {
    width: '100%',
    height: '100%',
  },
  directoryNomineeCopy: {
    minHeight: 138,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 12,
  },
  directoryNomineeName: {
    fontFamily: typography.body.bold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.black,
  },
  directoryNomineeDetail: {
    marginTop: 5,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.54)',
  },
  directoryNomineeBlurb: {
    marginTop: 7,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.66)',
  },
  nomineeDetailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.54)',
  },
  nomineeDetailSheet: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  nomineeDetailScrollContent: {
    paddingBottom: 2,
  },
  nomineeDetailImageFrame: {
    height: 250,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.warm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 8,
  },
  nomineeDetailImage: {
    width: '100%',
    height: '100%',
  },
  nomineeDetailCategory: {
    marginTop: 16,
    fontFamily: typography.mono.medium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  nomineeDetailName: {
    marginTop: 7,
    fontFamily: typography.body.bold,
    fontSize: 25,
    lineHeight: 30,
    color: colors.black,
    letterSpacing: -0.35,
  },
  nomineeDetailRole: {
    marginTop: 5,
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.52)',
  },
  nomineeDetailBlurb: {
    marginTop: 12,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(0,0,0,0.68)',
  },
  nomineeDetailClose: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  nomineeDetailCloseText: {
    fontFamily: typography.body.bold,
    fontSize: 13,
    color: colors.white,
  },
});
