import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Mail,
  PenLine,
  Plus,
  Search,
  ScanLine,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChips } from '../../../components/aligned/FilterChips';
import { MapResultsSheet, type MapResultsProject } from '../../../components/aligned/MapResultsSheet';
import { type MapRegionKey, ProjectMap } from '../../../components/aligned/ProjectMap';
import { type AlignedView, ViewToggle } from '../../../components/aligned/ViewToggle';
import { useMapProjects } from '../../../hooks/useMapData';
import { type ViewportBounds } from '../../../hooks/useMapViewport';
import { useProjectBookmarks, useToggleBookmark } from '../../../hooks/useProjectBookmarks';
import { CATEGORY_COLORS } from '../../../lib/mapbox';
import { colors, radius, spacing, typography } from '../../../lib/theme';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import type { ProjectCategory } from '../../../types/database';

interface DirectoryProject extends MapResultsProject {
  creatorFullName: string | null;
  creatorPhotoUrl: string | null;
  tags: string[];
}

interface ConnectionCardData {
  id: string;
  initials: string;
  location: string;
  matchedVia: string;
  name: string;
}

interface ProjectOwnerRow {
  id: string;
  creator:
    | {
        email: string | null;
        full_name: string | null;
        interests: string[] | null;
        photo_url: string | null;
      }
    | Array<{
        email: string | null;
        full_name: string | null;
        interests: string[] | null;
        photo_url: string | null;
      }>
    | null;
}

function sentenceCase(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function shortMemberName(fullName: string | null | undefined, fallbackFirstName: string) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return fallbackFirstName || 'Member';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].slice(0, 1).toUpperCase()}.`;
}

function initialsFromName(value: string) {
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function ProjectEntryCard({
  colors: gradient,
  onPress,
  subtitle,
  tag,
  title,
}: {
  colors: [string, string, string];
  onPress: () => void;
  subtitle: string;
  tag: string;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.entryCard, pressed ? styles.entryCardPressed : null]}>
      <LinearGradient colors={gradient} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFillObject} />
      <View style={styles.entryGlow} />
      <View style={styles.entryRing} />
      <ArrowRight color="rgba(255,255,255,0.82)" size={18} strokeWidth={1.8} style={styles.entryArrow} />
      <View style={styles.entryCopy}>
        <Text style={styles.entryTag}>{tag}</Text>
        <Text style={styles.entryTitle}>{title}</Text>
        <Text style={styles.entrySubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ActionRow({
  dark = false,
  description,
  icon,
  onPress,
  title,
}: {
  dark?: boolean;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, dark ? styles.actionRowDark : null, pressed ? styles.actionRowPressed : null]}>
      <View style={[styles.actionIconWrap, dark ? styles.actionIconWrapDark : null]}>{icon}</View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, dark ? styles.actionTitleDark : null]}>{title}</Text>
        <Text style={[styles.actionDescription, dark ? styles.actionDescriptionDark : null]}>{description}</Text>
      </View>
      <ChevronRight color={dark ? 'rgba(255,255,255,0.34)' : 'rgba(10,10,10,0.22)'} size={16} />
    </Pressable>
  );
}

function ConnectionCard({ connection }: { connection: ConnectionCardData }) {
  return (
    <View style={styles.connectionCard}>
      <View style={styles.connectionAvatar}>
        <Text style={styles.connectionInitials}>{connection.initials}</Text>
      </View>

      <View style={styles.connectionCopy}>
        <Text style={styles.connectionName}>{connection.name}</Text>
        <Text style={styles.connectionMeta}>
          {connection.location} {'\u00B7'} {connection.matchedVia}
        </Text>
      </View>
    </View>
  );
}

function BoardView({
  connections,
  onOpenInterests,
  onOpenMap,
  onOpenNotes,
  onOpenPass,
  onStartProject,
}: {
  connections: ConnectionCardData[];
  onOpenInterests: () => void;
  onOpenMap: () => void;
  onOpenNotes: () => void;
  onOpenPass: () => void;
  onStartProject: () => void;
}) {
  return (
    <View style={styles.boardStack}>
      <ProjectEntryCard
        colors={['#1C1815', '#111111', '#14120F']}
        onPress={onOpenMap}
        subtitle="Explore projects on the map, save what belongs on your board."
        tag="See what people are building"
        title="Projects"
      />

      <ProjectEntryCard
        colors={['#151618', '#111111', '#111114']}
        onPress={onOpenInterests}
        subtitle="Browse members and ideas connected to the same categories you care about."
        tag="Discover shared passions"
        title="Interests"
      />

      <ActionRow
        description="Open the share sheet for Notes, Mail, Messages, or another app"
        icon={<PenLine color={colors.white} size={16} strokeWidth={1.9} />}
        onPress={onOpenNotes}
        title="Share board"
      />

      <ActionRow
        description="Begin a new project"
        icon={<Plus color={colors.gold} size={18} strokeWidth={2.2} />}
        onPress={onStartProject}
        title="Spark"
      />

      <ActionRow
        dark
        description="Open your QR card and share it"
        icon={<ScanLine color={colors.white} size={18} strokeWidth={1.8} />}
        onPress={onOpenPass}
        title="Your pass"
      />

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Recent connections</Text>
        {connections.length ? (
          <View style={styles.connectionList}>
            {connections.map((connection) => (
              <ConnectionCard connection={connection} key={connection.id} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyCopy}>Your connections will appear here as the network grows.</Text>
        )}
      </View>
    </View>
  );
}

function InterestDetailCard({
  onClear,
  onContact,
  onOpenLink,
  onToggleBookmark,
  project,
  saved,
}: {
  onClear: () => void;
  onContact: (project: DirectoryProject) => void;
  onOpenLink: (url: string) => void;
  onToggleBookmark: (projectId: string) => void;
  project: DirectoryProject;
  saved: boolean;
}) {
  return (
    <View style={styles.interestDetailCard}>
      <View style={styles.interestDetailTop}>
        <View style={styles.interestAvatar}>
          {project.creatorPhotoUrl ? (
            <Image source={{ uri: project.creatorPhotoUrl }} style={styles.interestAvatarImage} />
          ) : (
            <Text style={styles.interestAvatarInitials}>{initialsFromName(project.creatorLabel)}</Text>
          )}
        </View>

        <View style={styles.interestDetailCopy}>
          <Text style={styles.interestDetailName}>{project.creatorLabel}</Text>
          <Text style={styles.interestDetailLocation}>{project.display_label}</Text>
        </View>

        <Pressable onPress={onClear} style={styles.closePill}>
          <X color={colors.gray} size={14} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={styles.interestQuote}>"{project.description}"</Text>

      <View style={styles.interestTagRow}>
        {project.tags.map((tag) => (
          <View key={tag} style={styles.interestTag}>
            <Text style={styles.interestTagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.interestActionRow}>
        <Pressable onPress={onClear} style={styles.interestSecondaryButton}>
          <Text style={styles.interestSecondaryButtonText}>Not now</Text>
        </Pressable>

        <Pressable
          onPress={() => onToggleBookmark(project.project_id)}
          style={[styles.interestPrimaryButton, saved ? styles.interestPrimaryButtonSaved : null]}
        >
          <Bookmark
            color={saved ? colors.black : colors.white}
            fill={saved ? colors.black : 'transparent'}
            size={15}
            strokeWidth={1.7}
          />
          <Text style={[styles.interestPrimaryButtonText, saved ? styles.interestPrimaryButtonTextSaved : null]}>
            {saved ? 'Saved' : 'Save to Interested In'}
          </Text>
        </Pressable>
      </View>

      {project.creatorEmail ? (
        <Pressable onPress={() => onContact(project)} style={styles.contactAction}>
          <Mail color={colors.white} size={15} strokeWidth={1.8} />
          <Text style={styles.contactActionText}>Contact {project.creatorShortName.split(' ')[0]}</Text>
        </Pressable>
      ) : null}

      {project.external_link ? (
        <Pressable onPress={() => onOpenLink(project.external_link!)} style={styles.linkAction}>
          <Text style={styles.linkActionText}>Visit project link</Text>
        </Pressable>
      ) : null}

      <Text style={styles.guidelineText}>
        <Text style={styles.guidelineStrong}>Community guideline:</Text> All communication between members must reflect
        AMARI values of respect, integrity, and mutual benefit. Behaviour inconsistent with these values may result in
        removal from the community.
      </Text>
    </View>
  );
}

function InterestRow({
  active,
  onPress,
  onToggleBookmark,
  project,
  saved,
}: {
  active: boolean;
  onPress: () => void;
  onToggleBookmark: (projectId: string) => void;
  project: DirectoryProject;
  saved: boolean;
}) {
  const accent = CATEGORY_COLORS[project.category]?.accent ?? colors.gold;

  return (
    <Pressable onPress={onPress} style={[styles.interestRow, active ? styles.interestRowActive : null]}>
      <View style={styles.interestRowAvatar}>
        {project.creatorPhotoUrl ? (
          <Image source={{ uri: project.creatorPhotoUrl }} style={styles.interestRowAvatarImage} />
        ) : (
          <Text style={styles.interestRowInitials}>{initialsFromName(project.creatorLabel)}</Text>
        )}
      </View>

      <View style={styles.interestRowCopy}>
        <Text style={[styles.interestRowCategory, { color: accent }]}>{CATEGORY_COLORS[project.category]?.label ?? project.category}</Text>
        <Text style={styles.interestRowName}>{project.creatorLabel}</Text>
        <Text style={styles.interestRowDescription} numberOfLines={1}>
          {project.description}
        </Text>
        <View style={styles.interestRowTags}>
          {project.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.interestRowTag}>
              <Text style={styles.interestRowTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable onPress={() => onToggleBookmark(project.project_id)} style={[styles.rowBookmark, saved ? styles.rowBookmarkSaved : null]}>
        <Bookmark
          color={saved ? colors.white : 'rgba(10,10,10,0.48)'}
          fill={saved ? colors.white : 'transparent'}
          size={18}
          strokeWidth={1.7}
        />
      </Pressable>
    </Pressable>
  );
}

function SearchOverlay({
  onClose,
  onSelect,
  projects,
}: {
  onClose: () => void;
  onSelect: (projectId: string) => void;
  projects: DirectoryProject[];
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects.slice(0, 8);

    return projects.filter((project) =>
      [project.name, project.description, project.creatorLabel, project.display_label, ...project.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [projects, query]);

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.searchBackdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <View style={styles.searchCard}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Search aligned</Text>
            <Pressable onPress={onClose} style={styles.closePill}>
              <X color={colors.gray} size={14} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.searchInputWrap}>
            <Search color={colors.gray} size={16} strokeWidth={1.9} />
            <TextInput
              autoFocus
              onChangeText={setQuery}
              placeholder="Projects, members, places"
              placeholderTextColor={colors.grayLight}
              style={styles.searchInput}
              value={query}
            />
          </View>

          <ScrollView contentContainerStyle={styles.searchResults} keyboardShouldPersistTaps="handled">
            {results.length ? (
              results.map((project) => (
                <Pressable key={project.project_id} onPress={() => onSelect(project.project_id)} style={styles.searchResultRow}>
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultTitle}>{project.name}</Text>
                    <Text style={styles.searchResultMeta}>
                      {project.creatorLabel} {'\u00B7'} {project.display_label}
                    </Text>
                  </View>
                  <ChevronRight color="rgba(10,10,10,0.22)" size={15} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.searchEmpty}>No matching projects or interests yet.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AlignedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [activeView, setActiveView] = useState<AlignedView>('map');
  const [activeRegion, setActiveRegion] = useState<MapRegionKey>('au');
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | null>(null);
  const [mapBounds, setMapBounds] = useState<ViewportBounds | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);

  const contentWidth = Math.min(Math.max(width - spacing.xl * 2, 300), 760);

  const { data: bookmarkData = [] } = useProjectBookmarks();
  const toggleBookmark = useToggleBookmark();
  const { data: visibleMapProjects = [] } = useMapProjects(mapBounds, activeCategory ?? undefined);

  const { data: directoryProjects = [] } = useQuery<DirectoryProject[]>({
    queryKey: ['aligned', 'directory-projects'],
    queryFn: async () => {
      const { data: cacheRows, error: cacheError } = await supabase
        .from('map_cache_projects')
        .select('project_id, name, description, category, creator_first_name, display_label, image_url, external_link, refreshed_at')
        .order('refreshed_at', { ascending: false });

      if (cacheError) throw cacheError;

      const projectIds = (cacheRows || []).map((row) => row.project_id);
      let ownerRows: ProjectOwnerRow[] = [];

      if (projectIds.length) {
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id, creator:members!projects_creator_id_fkey(full_name, email, photo_url, interests)')
          .in('id', projectIds);

        if (projectError) throw projectError;
        ownerRows = (projects || []) as ProjectOwnerRow[];
      }

      const ownerMap = new Map(
        ownerRows.map((row) => {
          const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
          return [row.id, creator];
        }),
      );

      return (cacheRows || []).map((row) => {
        const creator = ownerMap.get(row.project_id);
        const creatorFullName = creator?.full_name?.trim() || row.creator_first_name;
        const creatorShortName = shortMemberName(creator?.full_name, row.creator_first_name);
        const tags = dedupe([sentenceCase(row.category), ...(creator?.interests || []).slice(0, 2)]);

        return {
          category: row.category,
          creatorEmail: creator?.email ?? null,
          creatorFullName,
          creatorLabel: creatorFullName,
          creatorPhotoUrl: creator?.photo_url ?? null,
          creatorShortName,
          description: row.description,
          display_label: row.display_label,
          external_link: row.external_link,
          image_url: row.image_url,
          name: row.name,
          project_id: row.project_id,
          tags: tags.length ? tags : [sentenceCase(row.category)],
        };
      });
    },
  });

  const { data: recentConnections = [] } = useQuery<ConnectionCardData[]>({
    enabled: !!user?.id,
    queryKey: ['aligned', 'recent-connections', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('connections')
        .select('id, user_a, user_b, matched_via, connected_at')
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .eq('status', 'mutual')
        .order('connected_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      const memberIds = Array.from(new Set((rows || []).map((row) => (row.user_a === user!.id ? row.user_b : row.user_a))));
      if (!memberIds.length) return [];

      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, city')
        .in('id', memberIds);

      if (memberError) throw memberError;

      const memberMap = new Map((members || []).map((member) => [member.id, member]));

      return (rows || []).map((row) => {
        const otherUserId = row.user_a === user!.id ? row.user_b : row.user_a;
        const otherMember = memberMap.get(otherUserId);
        const name = shortMemberName(otherMember?.full_name, 'Member');

        return {
          id: row.id,
          initials: initialsFromName(name),
          location: otherMember?.city?.trim() || 'Australia',
          matchedVia: sentenceCase(row.matched_via),
          name,
        };
      });
    },
  });

  const bookmarkedProjectIds = useMemo(
    () => new Set((bookmarkData as Array<{ project_id: string }>).map((row) => row.project_id).filter(Boolean)),
    [bookmarkData],
  );

  const directoryProjectMap = useMemo(
    () => new Map(directoryProjects.map((project) => [project.project_id, project])),
    [directoryProjects],
  );

  const visibleProjects = useMemo<DirectoryProject[]>(
    () =>
      visibleMapProjects.map((project) => {
        const existing = directoryProjectMap.get(project.project_id);
        if (existing) return existing;

        return {
          category: project.category,
          creatorEmail: null,
          creatorFullName: project.creator_first_name,
          creatorLabel: project.creator_first_name,
          creatorPhotoUrl: null,
          creatorShortName: project.creator_first_name,
          description: project.description,
          display_label: project.display_label,
          external_link: project.external_link,
          image_url: project.image_url,
          name: project.name,
          project_id: project.project_id,
          tags: [sentenceCase(project.category)],
        };
      }),
    [directoryProjectMap, visibleMapProjects],
  );

  const filteredInterestProjects = useMemo(
    () => directoryProjects.filter((project) => (activeCategory ? project.category === activeCategory : true)),
    [activeCategory, directoryProjects],
  );

  const selectedMapProject = useMemo(
    () => visibleProjects.find((project) => project.project_id === selectedProjectId) || visibleProjects[0] || null,
    [selectedProjectId, visibleProjects],
  );

  const selectedInterestProject = useMemo(
    () =>
      filteredInterestProjects.find((project) => project.project_id === selectedProjectId) ||
      filteredInterestProjects[0] ||
      null,
    [filteredInterestProjects, selectedProjectId],
  );

  useEffect(() => {
    if (activeView === 'interests' && selectedInterestProject && !selectedProjectId) {
      setSelectedProjectId(selectedInterestProject.project_id);
    }
  }, [activeView, selectedInterestProject, selectedProjectId]);

  useEffect(() => {
    if (params.view === 'map' || params.view === 'board' || params.view === 'interests') {
      setActiveView(params.view);
    }
  }, [params.view]);

  const switchView = useCallback((nextView: AlignedView) => {
    Haptics.selectionAsync();
    if (nextView !== 'map') {
      setShowFullscreenMap(false);
    }
    startTransition(() => {
      setActiveView(nextView);
    });
  }, []);

  const closeFullscreenMap = useCallback(() => {
    Haptics.selectionAsync();
    setShowFullscreenMap(false);
  }, []);

  const handleToggleBookmark = useCallback(
    (projectId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleBookmark.mutate(projectId);
    },
    [toggleBookmark],
  );

  const handleContact = useCallback(async (project: MapResultsProject) => {
    if (!project.creatorEmail) {
      Alert.alert('Contact unavailable', 'This member has not shared a contact email yet.');
      return;
    }

    const subject = encodeURIComponent(`AMARI — Connecting on ${project.name}`);
    const email = project.creatorEmail.trim();
    const mailtoUrl = `mailto:${email}?subject=${subject}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      Alert.alert('Email unavailable', 'No mail app is available on this device.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(mailtoUrl);
  }, []);

  const handleVisitLink = useCallback(async (url: string) => {
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    const canOpen = await Linking.canOpenURL(normalizedUrl);
    if (!canOpen) {
      Alert.alert('Invalid link', 'This project link could not be opened.');
      return;
    }

    Alert.alert('Open external link', 'This project link will open in the appropriate external app or browser.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Linking.openURL(normalizedUrl).catch(() => {
            Alert.alert('Open failed', 'This project link could not be opened right now.');
          });
        },
      },
    ]);
  }, []);

  const handleOpenNotes = useCallback(async () => {
    const savedProjects = directoryProjects.filter((project) => bookmarkedProjectIds.has(project.project_id));
    const hasShareContent = savedProjects.length > 0 || recentConnections.length > 0;

    if (!hasShareContent) {
      Alert.alert(
        'Nothing to share yet',
        'Save a project or make a connection first, then share your board to Notes, Mail, Messages, or another app.',
      );
      return;
    }

    const noteLines = [
      'AMARI Aligned Board',
      '',
      savedProjects.length ? 'Saved projects' : 'Saved projects: none yet',
      ...savedProjects.flatMap((project, index) => ([
        `${index + 1}. ${project.name}`,
        `   ${project.creatorShortName} · ${project.display_label}`,
        `   ${project.description}`,
        project.external_link ? `   ${project.external_link}` : null,
      ].filter(Boolean) as string[])),
      '',
      recentConnections.length ? 'Recent connections' : 'Recent connections: none yet',
      ...recentConnections.map((connection, index) => `${index + 1}. ${connection.name} · ${connection.location} · ${connection.matchedVia}`),
    ];

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: 'AMARI Aligned Board',
        message: noteLines.join('\n'),
      });
    } catch {
      Alert.alert('Share unavailable', 'The share sheet could not be opened right now.');
    }
  }, [bookmarkedProjectIds, directoryProjects, recentConnections]);

  const mapScene = (
    <View style={[styles.mapScene, { width: contentWidth }, showFullscreenMap ? styles.mapSceneExpanded : null]}>
      <ProjectMap
        activeRegion={activeRegion}
        categoryFilter={activeCategory}
        expanded={showFullscreenMap}
        onCollapse={closeFullscreenMap}
        onExpand={() => setShowFullscreenMap(true)}
        onProjectSelect={(project) => setSelectedProjectId(project.project_id)}
        onRegionChange={setActiveRegion}
        onRequestCreate={() => router.push('/(tabs)/aligned/create')}
        onViewportChange={({ bounds }) => setMapBounds(bounds)}
      />

      <MapResultsSheet
        onContact={handleContact}
        onProjectSelect={setSelectedProjectId}
        onToggleBookmark={handleToggleBookmark}
        onVisitLink={handleVisitLink}
        projectCount={visibleProjects.length}
        projects={visibleProjects}
        savedProjectIds={bookmarkedProjectIds}
        selectedProject={selectedMapProject}
      />
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { width: contentWidth }]}>
          <Text style={styles.title}>Aligned</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchOpen(true);
            }}
            style={styles.searchButton}
          >
            <Search color={colors.gray} size={18} strokeWidth={1.9} />
          </Pressable>
        </View>

        <View style={[styles.toggleWrap, { width: contentWidth }]}>
          <ViewToggle activeView={activeView} onViewChange={switchView} />
        </View>

        {activeView === 'map' ? (
          <>
            <View style={[styles.mapFilterWrap, { width: contentWidth }]}>
              <FilterChips activeFilter={activeCategory} onFilterChange={setActiveCategory} />
            </View>
            <View style={styles.mapStageWrap}>{mapScene}</View>
          </>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentColumn, { width: contentWidth }]}>
              {activeView === 'board' ? (
                <BoardView
                  connections={recentConnections}
                  onOpenInterests={() => switchView('interests')}
                  onOpenMap={() => switchView('map')}
                  onOpenNotes={handleOpenNotes}
                  onOpenPass={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(tabs)/profile');
                  }}
                  onStartProject={() => router.push('/(tabs)/aligned/create')}
                />
              ) : (
                <>
                  <View style={styles.filterWrap}>
                    <FilterChips activeFilter={activeCategory} onFilterChange={setActiveCategory} />
                  </View>

                  {selectedInterestProject ? (
                    <InterestDetailCard
                      onClear={() => setSelectedProjectId(null)}
                      onContact={handleContact}
                      onOpenLink={handleVisitLink}
                      onToggleBookmark={handleToggleBookmark}
                      project={selectedInterestProject}
                      saved={bookmarkedProjectIds.has(selectedInterestProject.project_id)}
                    />
                  ) : (
                    <Text style={styles.emptyCopy}>Approved projects will surface here once members start publishing them.</Text>
                  )}

                  <View style={styles.interestList}>
                    {filteredInterestProjects.map((project) => (
                      <InterestRow
                        active={project.project_id === selectedInterestProject?.project_id}
                        key={project.project_id}
                        onPress={() => setSelectedProjectId(project.project_id)}
                        onToggleBookmark={handleToggleBookmark}
                        project={project}
                        saved={bookmarkedProjectIds.has(project.project_id)}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        )}

        <Modal
          animationType="slide"
          transparent={false}
          visible={showFullscreenMap}
          onRequestClose={closeFullscreenMap}
        >
          <View style={styles.fullscreenMap}>
            <View style={[styles.fullscreenMapHeader, { paddingTop: insets.top + 8 }]}>
              <Text style={styles.fullscreenMapTitle}>Aligned Map</Text>
              <Pressable onPress={closeFullscreenMap} style={styles.fullscreenMapClose}>
                <Text style={styles.fullscreenMapCloseText}>Close</Text>
              </Pressable>
            </View>
            <View style={styles.fullscreenMapBody}>{mapScene}</View>
          </View>
        </Modal>

        {searchOpen ? (
          <SearchOverlay
            onClose={() => setSearchOpen(false)}
            onSelect={(projectId) => {
              setSelectedProjectId(projectId);
              setSearchOpen(false);
              switchView('interests');
            }}
            projects={directoryProjects}
          />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  header: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontFamily: typography.serif.semiBold,
    fontSize: 26,
    color: colors.black,
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleWrap: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingTop: 2,
  },
  contentColumn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
  boardStack: {
    gap: 14,
  },
  entryCard: {
    minHeight: 150,
    overflow: 'hidden',
    borderRadius: radius.xl,
    padding: 20,
    justifyContent: 'flex-end',
  },
  entryCardPressed: {
    transform: [{ scale: 0.995 }],
  },
  entryGlow: {
    position: 'absolute',
    top: 28,
    left: 116,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(196,162,101,0.08)',
  },
  entryRing: {
    position: 'absolute',
    right: 44,
    top: 34,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  entryArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  entryCopy: {
    gap: 6,
  },
  entryTag: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  entryTitle: {
    fontFamily: typography.serif.semiBold,
    fontSize: 24,
    color: colors.white,
  },
  entrySubtitle: {
    maxWidth: '86%',
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  actionRowDark: {
    backgroundColor: colors.cardBase,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionRowPressed: {
    opacity: 0.94,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 16,
    color: colors.black,
  },
  actionTitleDark: {
    color: colors.white,
  },
  actionDescription: {
    marginTop: 3,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },
  actionDescriptionDark: {
    color: 'rgba(255,255,255,0.68)',
  },
  sectionBlock: {
    paddingTop: 6,
  },
  sectionLabel: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gray,
    marginBottom: 10,
  },
  connectionList: {
    gap: 10,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionInitials: {
    fontFamily: typography.geo.medium,
    fontSize: 14,
    color: colors.sandOnDark,
  },
  connectionCopy: {
    flex: 1,
  },
  connectionName: {
    fontFamily: typography.serif.medium,
    fontSize: 15,
    color: colors.black,
  },
  connectionMeta: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
  },
  emptyCopy: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.gray,
  },
  mapStageWrap: {
    flex: 1,
    paddingBottom: 96,
  },
  mapFilterWrap: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  mapScene: {
    alignSelf: 'center',
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.cardBase,
  },
  mapSceneExpanded: {
    width: '100%',
    borderRadius: 0,
  },
  filterWrap: {
    marginBottom: 16,
  },
  interestDetailCard: {
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  interestDetailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  interestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  interestAvatarImage: {
    width: '100%',
    height: '100%',
  },
  interestAvatarInitials: {
    fontFamily: typography.geo.medium,
    fontSize: 16,
    color: colors.sandOnDark,
  },
  interestDetailCopy: {
    flex: 1,
  },
  interestDetailName: {
    fontFamily: typography.serif.medium,
    fontSize: 18,
    color: colors.black,
  },
  interestDetailLocation: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },
  closePill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestQuote: {
    marginTop: 14,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.black,
  },
  interestTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  interestTagText: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.black,
  },
  interestActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  interestSecondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.06)',
  },
  interestSecondaryButtonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.black,
  },
  interestPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  interestPrimaryButtonSaved: {
    backgroundColor: colors.goldLight,
  },
  interestPrimaryButtonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
  },
  interestPrimaryButtonTextSaved: {
    color: colors.black,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  contactActionText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
  },
  linkAction: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  linkActionText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.goldDark,
  },
  guidelineText: {
    marginTop: 12,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.gray,
  },
  guidelineStrong: {
    fontFamily: typography.body.semiBold,
    color: colors.black,
  },
  interestList: {
    gap: 10,
    marginTop: 14,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  interestRowActive: {
    borderColor: 'rgba(196,162,101,0.28)',
    backgroundColor: colors.white,
  },
  interestRowAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  interestRowAvatarImage: {
    width: '100%',
    height: '100%',
  },
  interestRowInitials: {
    fontFamily: typography.geo.medium,
    fontSize: 15,
    color: colors.sandOnDark,
  },
  interestRowCopy: {
    flex: 1,
  },
  interestRowCategory: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  interestRowName: {
    marginTop: 3,
    fontFamily: typography.serif.medium,
    fontSize: 15,
    color: colors.black,
  },
  interestRowDescription: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },
  interestRowTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  interestRowTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  interestRowTagText: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: colors.black,
  },
  rowBookmark: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.07)',
    backgroundColor: colors.white,
  },
  rowBookmarkSaved: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  fullscreenMap: {
    flex: 1,
    backgroundColor: colors.black,
    paddingBottom: 0,
  },
  fullscreenMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
    backgroundColor: colors.black,
  },
  fullscreenMapTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.2,
  },
  fullscreenMapClose: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  fullscreenMapCloseText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  fullscreenMapBody: {
    flex: 1,
  },
  searchBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  searchCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '70%',
    borderRadius: radius.xl,
    backgroundColor: colors.bone,
    padding: 18,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 20,
    color: colors.black,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.black,
  },
  searchResults: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,10,10,0.05)',
  },
  searchResultCopy: {
    flex: 1,
    paddingRight: 12,
  },
  searchResultTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 15,
    color: colors.black,
  },
  searchResultMeta: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
  },
  searchEmpty: {
    paddingVertical: 16,
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
  },
});
