import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { AmbientGradient, PressableScale } from '@/components/v2';
import { CATEGORY_ORDER, categoryStyle } from '@/lib/projectCategories';
import { colors, radius, spacing, typography } from '@/lib/theme';

// A project as the shelves need it — a structural subset of DirectoryProject.
export interface ShelfProject {
  project_id: string;
  name: string;
  category: string;
  description?: string;
  image_url: string | null;
  display_label?: string | null;
  tags?: string[];
}

const RECENT_COUNT = 8;

function CoverCard({
  project,
  saved,
  onOpen,
  onToggleSave,
  wide,
}: {
  project: ShelfProject;
  saved: boolean;
  onOpen: (p: ShelfProject) => void;
  onToggleSave: (id: string) => void;
  wide?: boolean;
}) {
  const style = categoryStyle(project.category);
  return (
    <PressableScale onPress={() => onOpen(project)} style={[styles.card, wide ? styles.cardWide : null]}>
      {project.image_url ? (
        <Image contentFit="cover" source={{ uri: project.image_url }} style={StyleSheet.absoluteFillObject} transition={200} />
      ) : (
        <LinearGradient colors={style.gradient} style={StyleSheet.absoluteFillObject}>
          <AmbientGradient color={hexToRgb(style.accent)} intensity={0.06} size={160} />
        </LinearGradient>
      )}
      <LinearGradient
        colors={['rgba(10,10,10,0.0)', 'rgba(10,10,10,0.05)', 'rgba(10,10,10,0.82)']}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable hitSlop={8} onPress={() => onToggleSave(project.project_id)} style={styles.saveCorner}>
        <Bookmark
          color={colors.white}
          fill={saved ? colors.white : 'transparent'}
          size={15}
          strokeWidth={2}
        />
      </Pressable>
      <View style={styles.cardText}>
        <Text style={[styles.cardCategory, { color: style.accent }]}>{style.label.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.cardName}>
          {project.name}
        </Text>
      </View>
    </PressableScale>
  );
}

function Spotlight({
  project,
  saved,
  onOpen,
  onToggleSave,
}: {
  project: ShelfProject;
  saved: boolean;
  onOpen: (p: ShelfProject) => void;
  onToggleSave: (id: string) => void;
}) {
  const style = categoryStyle(project.category);
  return (
    <PressableScale haptic={false} onPress={() => onOpen(project)} style={styles.spotlight}>
      {project.image_url ? (
        <Image contentFit="cover" source={{ uri: project.image_url }} style={StyleSheet.absoluteFillObject} transition={240} />
      ) : (
        <LinearGradient colors={style.gradient} style={StyleSheet.absoluteFillObject}>
          <AmbientGradient color={hexToRgb(style.accent)} intensity={0.08} size={260} />
        </LinearGradient>
      )}
      <LinearGradient
        colors={['rgba(10,10,10,0.15)', 'rgba(10,10,10,0.0)', 'rgba(10,10,10,0.85)']}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable hitSlop={8} onPress={() => onToggleSave(project.project_id)} style={styles.saveCorner}>
        <Bookmark color={colors.white} fill={saved ? colors.white : 'transparent'} size={17} strokeWidth={2} />
      </Pressable>
      <View style={styles.spotlightText}>
        <Text style={styles.spotlightEyebrow}>IN FOCUS · {style.label.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.spotlightName}>
          {project.name}
        </Text>
        {project.display_label ? <Text style={styles.spotlightMeta}>{project.display_label}</Text> : null}
      </View>
    </PressableScale>
  );
}

function Shelf({
  title,
  projects,
  savedIds,
  onOpen,
  onToggleSave,
}: {
  title: string;
  projects: ShelfProject[];
  savedIds: Set<string>;
  onOpen: (p: ShelfProject) => void;
  onToggleSave: (id: string) => void;
}) {
  if (!projects.length) return null;
  return (
    <View style={styles.shelf}>
      <Text style={styles.shelfTitle}>{title}</Text>
      <FlatList
        data={projects}
        horizontal
        keyExtractor={(p) => p.project_id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfRow}
        renderItem={({ item }) => (
          <CoverCard
            project={item}
            saved={savedIds.has(item.project_id)}
            onOpen={onOpen}
            onToggleSave={onToggleSave}
          />
        )}
      />
    </View>
  );
}

export function ProjectShelves({
  projects,
  activeCategory,
  savedIds,
  onOpen,
  onToggleSave,
}: {
  projects: ShelfProject[];
  activeCategory: string | null;
  savedIds: Set<string>;
  onOpen: (p: ShelfProject) => void;
  onToggleSave: (id: string) => void;
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, ShelfProject[]>();
    for (const p of projects) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [projects]);

  if (!projects.length) {
    return (
      <Text style={styles.empty}>Approved projects will surface here once members start publishing them.</Text>
    );
  }

  // Filtered to a single category: show a grid of that category.
  if (activeCategory) {
    return (
      <View style={styles.grid}>
        {projects.map((project) => (
          <CoverCard
            key={project.project_id}
            project={project}
            saved={savedIds.has(project.project_id)}
            onOpen={onOpen}
            onToggleSave={onToggleSave}
            wide
          />
        ))}
      </View>
    );
  }

  const spotlight = projects[0];
  const recent = projects.slice(1, 1 + RECENT_COUNT);

  return (
    <View>
      <Spotlight
        project={spotlight}
        saved={savedIds.has(spotlight.project_id)}
        onOpen={onOpen}
        onToggleSave={onToggleSave}
      />

      <Shelf title="Recently added" projects={recent} savedIds={savedIds} onOpen={onOpen} onToggleSave={onToggleSave} />

      {CATEGORY_ORDER.map((cat) => {
        const list = byCategory.get(cat);
        if (!list || !list.length) return null;
        return (
          <Shelf
            key={cat}
            title={categoryStyle(cat).label}
            projects={list}
            savedIds={savedIds}
            onOpen={onOpen}
            onToggleSave={onToggleSave}
          />
        );
      })}
    </View>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

const CARD_W = 150;
const CARD_H = 190;

const styles = StyleSheet.create({
  empty: {
    marginHorizontal: spacing.xl,
    fontFamily: typography.body.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.gray,
  },
  spotlight: {
    height: 260,
    marginHorizontal: spacing.xl,
    marginBottom: 8,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.cardBase,
  },
  spotlightText: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
  },
  spotlightEyebrow: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  spotlightName: {
    fontFamily: typography.body.bold,
    fontSize: 24,
    lineHeight: 29,
    color: colors.white,
    letterSpacing: -0.4,
  },
  spotlightMeta: {
    marginTop: 6,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
  },
  shelf: { marginTop: 22 },
  shelfTitle: {
    fontFamily: typography.body.bold,
    fontSize: 16,
    color: colors.black,
    letterSpacing: -0.3,
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  shelfRow: {
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.cardBase,
  },
  cardWide: {
    width: '47%',
    marginBottom: 12,
  },
  cardText: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardCategory: {
    fontFamily: typography.mono.medium,
    fontSize: 7.5,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  cardName: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
    letterSpacing: -0.2,
  },
  saveCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10,10,10,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
});
