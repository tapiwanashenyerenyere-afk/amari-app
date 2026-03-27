import React, { useMemo, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Bookmark, ExternalLink, Mail } from 'lucide-react-native';
import { colors, radius, typography } from '../../lib/theme';
import { CATEGORY_COLORS } from '../../lib/mapbox';

export interface MapResultsProject {
  project_id: string;
  name: string;
  description: string;
  category: string;
  creatorLabel: string;
  creatorShortName: string;
  creatorEmail: string | null;
  display_label: string;
  image_url: string | null;
  external_link: string | null;
  tags?: string[];
}

interface MapResultsSheetProps {
  projects: MapResultsProject[];
  projectCount: number;
  savedProjectIds: Set<string>;
  selectedProject: MapResultsProject | null;
  onContact: (project: MapResultsProject) => void;
  onProjectSelect: (projectId: string) => void;
  onToggleBookmark: (projectId: string) => void;
  onVisitLink?: (url: string) => void;
}

function BookmarkButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.bookmarkButton, active ? styles.bookmarkButtonActive : null]}>
      <Bookmark
        color={active ? colors.white : 'rgba(10,10,10,0.48)'}
        fill={active ? colors.white : 'transparent'}
        size={18}
        strokeWidth={1.7}
      />
    </Pressable>
  );
}

function ListCard({
  active,
  project,
  saved,
  onBookmark,
  onPress,
}: {
  active: boolean;
  project: MapResultsProject;
  saved: boolean;
  onBookmark: () => void;
  onPress: () => void;
}) {
  const accent = CATEGORY_COLORS[project.category]?.accent ?? colors.gold;

  return (
    <Pressable onPress={onPress} style={[styles.listCard, active ? styles.listCardActive : null]}>
      <View style={styles.listImageWrap}>
        {project.image_url ? (
          <Image source={{ uri: project.image_url }} style={styles.listImage} />
        ) : (
          <View style={styles.listFallback}>
            <Text style={styles.listFallbackText}>{project.name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.listCopy}>
        <Text style={[styles.listCategory, { color: accent }]}>{CATEGORY_COLORS[project.category]?.label ?? project.category}</Text>
        <Text style={styles.listTitle} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.listDescription} numberOfLines={2}>
          {project.description}
        </Text>
        <Text style={styles.listMeta}>
          {project.creatorShortName} {'\u00B7'} {project.display_label}
        </Text>
      </View>

      <BookmarkButton active={saved} onPress={onBookmark} />
    </Pressable>
  );
}

export function MapResultsSheet({
  projects,
  projectCount,
  savedProjectIds,
  selectedProject,
  onContact,
  onProjectSelect,
  onToggleBookmark,
  onVisitLink,
}: MapResultsSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);
  const detailProject = selectedProject ?? projects[0] ?? null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      backgroundStyle={styles.sheetBackground}
      enablePanDownToClose={false}
      handleIndicatorStyle={styles.handle}
      index={0}
      snapPoints={snapPoints}
    >
      <View style={styles.header}>
        <Text style={styles.headerCount}>
          <Text style={styles.headerCountNumber}>{projectCount}</Text> project{projectCount === 1 ? '' : 's'} in view
        </Text>

        <Pressable onPress={() => bottomSheetRef.current?.snapToIndex(2)} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>Expand</Text>
        </Pressable>
      </View>

      {detailProject ? (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            {detailProject.image_url ? (
              <Image source={{ uri: detailProject.image_url }} style={styles.detailImage} />
            ) : (
              <View style={[styles.detailImage, styles.detailFallback]}>
                <Text style={styles.detailFallbackText}>{detailProject.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.detailCopy}>
              <Text style={styles.detailCategory}>
                {CATEGORY_COLORS[detailProject.category]?.label ?? detailProject.category}
              </Text>
              <Text style={styles.detailTitle}>{detailProject.name}</Text>
              <Text style={styles.detailDescription}>{detailProject.description}</Text>
              <Text style={styles.detailMeta}>
                {detailProject.creatorShortName} {'\u00B7'} {detailProject.display_label}
              </Text>
            </View>
          </View>

          <View style={styles.detailActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleBookmark(detailProject.project_id);
              }}
              style={[
                styles.primaryAction,
                savedProjectIds.has(detailProject.project_id) ? styles.primaryActionSaved : null,
              ]}
            >
              <Bookmark
                color={savedProjectIds.has(detailProject.project_id) ? colors.black : colors.white}
                fill={savedProjectIds.has(detailProject.project_id) ? colors.black : 'transparent'}
                size={16}
                strokeWidth={1.8}
              />
              <Text
                style={[
                  styles.primaryActionText,
                  savedProjectIds.has(detailProject.project_id) ? styles.primaryActionTextSaved : null,
                ]}
              >
                {savedProjectIds.has(detailProject.project_id) ? 'Saved to Interested In' : 'Save to Interested In'}
              </Text>
            </Pressable>

            {detailProject.external_link ? (
              <Pressable
                onPress={() => onVisitLink?.(detailProject.external_link!)}
                style={styles.secondaryAction}
              >
                <ExternalLink color={colors.black} size={16} strokeWidth={1.8} />
                <Text style={styles.secondaryActionText}>Visit Link</Text>
              </Pressable>
            ) : null}
          </View>

          {detailProject.creatorEmail ? (
            <Pressable onPress={() => onContact(detailProject)} style={styles.contactButton}>
              <Mail color={colors.white} size={16} strokeWidth={1.8} />
              <Text style={styles.contactButtonText}>Contact {detailProject.creatorShortName.split(' ')[0]}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.disclaimer}>
            <Text style={styles.disclaimerStrong}>Community guideline:</Text> All communication between members must reflect
            AMARI values of respect, integrity, and mutual benefit. Behaviour inconsistent with these values may result in
            removal from the community.
          </Text>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={projects}
        keyExtractor={(item) => item.project_id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>Pan across regions or zoom in to load projects in this view.</Text>
        }
        renderItem={({ item }) => (
          <ListCard
            active={item.project_id === detailProject?.project_id}
            onBookmark={() => onToggleBookmark(item.project_id)}
            onPress={() => onProjectSelect(item.project_id)}
            project={item}
            saved={savedProjectIds.has(item.project_id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    width: 38,
    backgroundColor: 'rgba(10,10,10,0.14)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerCount: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
  },
  headerCountNumber: {
    fontFamily: typography.serif.medium,
    fontSize: 20,
    color: colors.black,
  },
  expandButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandButtonText: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.gray,
  },
  detailCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  detailTop: {
    flexDirection: 'row',
    gap: 14,
  },
  detailImage: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
  },
  detailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  detailFallbackText: {
    fontFamily: typography.serif.semiBold,
    fontSize: 24,
    color: colors.sandOnDark,
  },
  detailCopy: {
    flex: 1,
  },
  detailCategory: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  detailTitle: {
    marginTop: 4,
    fontFamily: typography.serif.semiBold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  detailDescription: {
    marginTop: 5,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },
  detailMeta: {
    marginTop: 7,
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.black,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  primaryActionSaved: {
    backgroundColor: colors.goldLight,
  },
  primaryActionText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
  },
  primaryActionTextSaved: {
    color: colors.black,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warm,
  },
  secondaryActionText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.black,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
  },
  disclaimer: {
    marginTop: 10,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.gray,
  },
  disclaimerStrong: {
    fontFamily: typography.body.semiBold,
    color: colors.black,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,10,10,0.05)',
  },
  listCardActive: {
    marginHorizontal: -10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(196,162,101,0.08)',
  },
  listImageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listFallback: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFallbackText: {
    fontFamily: typography.serif.semiBold,
    fontSize: 22,
    color: colors.sandOnDark,
  },
  listCopy: {
    flex: 1,
  },
  listCategory: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listTitle: {
    marginTop: 3,
    fontFamily: typography.serif.medium,
    fontSize: 15,
    color: colors.black,
  },
  listDescription: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.gray,
  },
  listMeta: {
    marginTop: 5,
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.black,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  bookmarkButtonActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  emptyText: {
    paddingTop: 24,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.gray,
    textAlign: 'center',
  },
});
