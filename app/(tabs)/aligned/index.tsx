import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  ChevronRight,
  Mail,
  Search,
  ScanLine,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChips } from '../../../components/aligned/FilterChips';
import { ProjectPage } from '../../../components/aligned/ProjectPage';
import { ProjectShelves } from '../../../components/aligned/ProjectShelves';
import { MapResultsSheet, type MapResultsProject } from '../../../components/aligned/MapResultsSheet';
import { type MapRegionKey, ProjectMap } from '../../../components/aligned/ProjectMap';
import { type AlignedView, ViewToggle } from '../../../components/aligned/ViewToggle';
import { CardPopupModal } from '../../../components/v2/CardPopupModal';
import { useMapProjects } from '../../../hooks/useMapData';
import { type ViewportBounds } from '../../../hooks/useMapViewport';
import { useProjectBookmarks, useToggleBookmark } from '../../../hooks/useProjectBookmarks';
import { colors, radius, spacing, TIER_DISPLAY_NAMES, typography } from '../../../lib/theme';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import { useMyProfile } from '../../../queries/members';
import type { ProjectCategory } from '../../../types/database';

const PROJECT_CREATOR_LABEL = 'Project creator';
const MIN_CONNECT_MESSAGE_LENGTH = 12;

interface DirectoryProject extends MapResultsProject {
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
      }
    | Array<{
        email: string | null;
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

const ALIGNED_STEPS = [
  {
    label: '1',
    title: 'Browse approved projects',
    copy: 'Use the list for detail or switch into the map when location matters.',
  },
  {
    label: '2',
    title: 'Connect with context',
    copy: 'Project contact opens your email app after you write a short member note.',
  },
  {
    label: '3',
    title: 'Publish from Platinum',
    copy: 'Submitted projects are reviewed before they appear in Aligned.',
  },
];

function HowAlignedWorks() {
  return (
    <View style={styles.howCard}>
      <Text style={styles.howKicker}>How Aligned works</Text>
      {ALIGNED_STEPS.map((step) => (
        <View key={step.label} style={styles.howRow}>
          <View style={styles.howNumber}>
            <Text style={styles.howNumberText}>{step.label}</Text>
          </View>
          <View style={styles.howCopyWrap}>
            <Text style={styles.howTitle}>{step.title}</Text>
            <Text style={styles.howCopy}>{step.copy}</Text>
          </View>
        </View>
      ))}
    </View>
  );
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
  onOpenPass,
}: {
  connections: ConnectionCardData[];
  onOpenInterests: () => void;
  onOpenMap: () => void;
  onOpenPass: () => void;
}) {
  return (
    <View style={styles.boardStack}>
      <HowAlignedWorks />

      <ProjectEntryCard
        colors={['#1C1815', '#111111', '#14120F']}
        onPress={onOpenMap}
        subtitle="Browse projects as a list, then switch into the map when location matters."
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
        dark
        description="Show your QR code, scan another pass, or share yours"
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
      [project.name, project.description, project.creatorEmail ?? '', project.display_label, ...project.tags]
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
              placeholder="Projects, sectors, places, contact email"
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
                      {project.creatorEmail ? `Contact: ${project.creatorEmail}` : project.display_label}
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

function ProjectDetailModal({
  onClose,
  onContact,
  onOpenLink,
  onToggleBookmark,
  project,
  saved,
}: {
  onClose: () => void;
  onContact: (project: DirectoryProject) => void;
  onOpenLink: (url: string) => void;
  onToggleBookmark: (projectId: string) => void;
  project: DirectoryProject | null;
  saved: boolean;
}) {
  if (!project) return null;

  return (
    <ProjectPage
      onClose={onClose}
      onContact={() => onContact(project)}
      onOpenLink={onOpenLink}
      onToggleBookmark={() => onToggleBookmark(project.project_id)}
      project={project}
      saved={saved}
    />
  );
}

export default function AlignedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; projectId?: string }>();
  const { user, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const { width } = useWindowDimensions();

  const [activeView, setActiveView] = useState<AlignedView>('map');
  const [activeRegion, setActiveRegion] = useState<MapRegionKey>('au');
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | null>(null);
  const [mapBounds, setMapBounds] = useState<ViewportBounds | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);
  const [showPassPopup, setShowPassPopup] = useState(false);
  const [connectProject, setConnectProject] = useState<MapResultsProject | null>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [detailProject, setDetailProject] = useState<DirectoryProject | null>(null);

  const contentWidth = Math.min(Math.max(width - spacing.xl * 2, 300), 760);
  const connectMessageReady = connectMessage.trim().length >= MIN_CONNECT_MESSAGE_LENGTH;
  const fullName = profile?.full_name?.trim() || 'AMARI Member';
  const locationLabel = profile?.city?.trim() || 'Australia';
  const displayId = profile?.display_id || `AMARI-${new Date().getFullYear()}-0000`;
  const tierLabel = tier ? TIER_DISPLAY_NAMES[tier] || tier.toUpperCase() : 'MEMBER';

  const { data: bookmarkData = [] } = useProjectBookmarks();
  const toggleBookmark = useToggleBookmark();
  const { data: visibleMapProjects = [] } = useMapProjects(mapBounds, activeCategory ?? undefined);

  const { data: directoryProjects = [] } = useQuery<DirectoryProject[]>({
    queryKey: ['aligned', 'directory-projects'],
    queryFn: async () => {
      const { data: cacheRows, error: cacheError } = await supabase
        .from('map_cache_projects')
        .select('project_id, name, description, category, display_label, image_url, external_link, refreshed_at')
        .order('refreshed_at', { ascending: false });

      if (cacheError) throw cacheError;

      const projectIds = (cacheRows || []).map((row) => row.project_id);
      let ownerRows: ProjectOwnerRow[] = [];

      if (projectIds.length) {
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id, creator:members!projects_creator_id_fkey(email)')
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
        const tags = dedupe([sentenceCase(row.category)]);

        return {
          category: row.category,
          creatorEmail: creator?.email ?? null,
          creatorLabel: PROJECT_CREATOR_LABEL,
          creatorShortName: PROJECT_CREATOR_LABEL,
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
          creatorLabel: PROJECT_CREATOR_LABEL,
          creatorShortName: PROJECT_CREATOR_LABEL,
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
    if ((activeView === 'interests' || activeView === 'list') && selectedInterestProject && !selectedProjectId) {
      setSelectedProjectId(selectedInterestProject.project_id);
    }
  }, [activeView, selectedInterestProject, selectedProjectId]);

  useEffect(() => {
    if (params.view === 'map' || params.view === 'board' || params.view === 'list' || params.view === 'interests') {
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

  const openConnectRequest = useCallback((project: MapResultsProject) => {
    setConnectProject(project);
    setConnectMessage('');
  }, []);

  const openProjectDetail = useCallback((project: DirectoryProject) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProjectId(project.project_id);
    setDetailProject(project);
  }, []);

  const openProjectDetailById = useCallback(
    (projectId: string) => {
      const project =
        directoryProjectMap.get(projectId) ||
        visibleProjects.find((visibleProject) => visibleProject.project_id === projectId) ||
        null;

      setSelectedProjectId(projectId);
      if (project) {
        openProjectDetail(project);
      }
    },
    [directoryProjectMap, openProjectDetail, visibleProjects],
  );

  useEffect(() => {
    if (typeof params.projectId === 'string' && params.projectId && directoryProjects.length) {
      openProjectDetailById(params.projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.projectId, directoryProjects.length]);

  const closeConnectRequest = useCallback(() => {
    setConnectProject(null);
    setConnectMessage('');
  }, []);

  const handleContact = useCallback(async (project: MapResultsProject, message: string) => {
    if (!project.creatorEmail) {
      Alert.alert('Contact unavailable', 'This member has not shared a contact email yet.');
      return false;
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length < MIN_CONNECT_MESSAGE_LENGTH) {
      Alert.alert('Message required', 'Please add a short note explaining why you want to connect.');
      return false;
    }

    const subject = encodeURIComponent(`AMARI — Connecting on ${project.name}`);
    const body = encodeURIComponent(
      [
        'Hi,',
        '',
        cleanMessage,
        '',
        `Project: ${project.name}`,
        'Sent via AMARI.',
      ].join('\n'),
    );
    const email = project.creatorEmail.trim();
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      Alert.alert('Email unavailable', 'No mail app is available on this device.');
      return false;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(mailtoUrl);
    return true;
  }, []);

  const handleSubmitConnectRequest = useCallback(async () => {
    if (!connectProject) return;

    const cleanMessage = connectMessage.trim();
    if (cleanMessage.length < MIN_CONNECT_MESSAGE_LENGTH) {
      Alert.alert('Message required', 'Please add a short note explaining why you want to connect.');
      return;
    }

    const didOpen = await handleContact(connectProject, cleanMessage);
    if (didOpen) {
      setConnectProject(null);
      setConnectMessage('');
    }
  }, [connectMessage, connectProject, handleContact]);

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


  const mapScene = (
    <View style={[styles.mapScene, { width: contentWidth }, showFullscreenMap ? styles.mapSceneExpanded : null]}>
      <ProjectMap
        activeRegion={activeRegion}
        categoryFilter={activeCategory}
        expanded={showFullscreenMap}
        onCollapse={closeFullscreenMap}
        onExpand={() => setShowFullscreenMap(true)}
        onProjectSelect={(project) => openProjectDetailById(project.project_id)}
        onRegionChange={setActiveRegion}
        onRequestCreate={() => router.push('/(tabs)/aligned/create')}
        onViewportChange={({ bounds }) => setMapBounds(bounds)}
      />

      <MapResultsSheet
        onContact={openConnectRequest}
        onProjectSelect={openProjectDetailById}
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
                  onOpenMap={() => switchView('list')}
                  onOpenPass={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassPopup(true);
                  }}
                />
              ) : (
                <>
                  <View style={styles.projectModeHeader}>
                    <View style={styles.projectModeCopy}>
                      <Text style={styles.projectModeTitle}>
                        {activeView === 'list' ? 'Projects' : 'Interests'}
                      </Text>
                      <Text style={styles.projectModeSubtitle}>
                        {activeView === 'list'
                          ? 'What members are building — browse by category, or open the map for where.'
                          : 'Ideas and ventures across the categories members care about.'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => switchView(activeView === 'list' ? 'map' : 'list')}
                      style={styles.projectModeButton}
                    >
                      <Text style={styles.projectModeButtonText}>
                        {activeView === 'list' ? 'Map' : 'Project list'}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.filterWrap}>
                    <FilterChips activeFilter={activeCategory} onFilterChange={setActiveCategory} />
                  </View>

                  <ProjectShelves
                    activeCategory={activeCategory}
                    onOpen={(project) => openProjectDetail(project as DirectoryProject)}
                    onToggleSave={handleToggleBookmark}
                    projects={filteredInterestProjects}
                    savedIds={bookmarkedProjectIds}
                  />
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

        {connectProject ? (
          <Modal
            animationType="fade"
            onRequestClose={closeConnectRequest}
            transparent
            visible={!!connectProject}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.connectBackdrop}
            >
              <Pressable onPress={closeConnectRequest} style={StyleSheet.absoluteFillObject} />
              <View style={styles.connectCard}>
                <View style={styles.connectHeader}>
                  <View>
                    <Text style={styles.connectEyebrow}>Connect request</Text>
                    <Text style={styles.connectTitle}>Message the project creator</Text>
                  </View>
                  <Pressable onPress={closeConnectRequest} style={styles.closePill}>
                    <X color={colors.gray} size={14} strokeWidth={2} />
                  </Pressable>
                </View>

                <Text style={styles.connectProjectName}>{connectProject.name}</Text>
                <Text style={styles.connectContactLine}>
                  {connectProject.creatorEmail ? `Contact: ${connectProject.creatorEmail}` : 'Contact email unavailable'}
                </Text>

                <TextInput
                  autoFocus
                  multiline
                  maxLength={640}
                  onChangeText={setConnectMessage}
                  placeholder="Share why you want to connect, how you can help, or what you would like to discuss."
                  placeholderTextColor={colors.grayLight}
                  style={styles.connectInput}
                  textAlignVertical="top"
                  value={connectMessage}
                />
                <Text style={styles.connectHintText}>
                  This note is required and will be included in the email that opens on your phone.
                </Text>

                <View style={styles.connectActions}>
                  <Pressable onPress={closeConnectRequest} style={styles.connectSecondaryButton}>
                    <Text style={styles.connectSecondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={!connectMessageReady}
                    onPress={handleSubmitConnectRequest}
                    style={[
                      styles.connectPrimaryButton,
                      !connectMessageReady ? styles.connectPrimaryButtonDisabled : null,
                    ]}
                  >
                    <Mail color={colors.white} size={15} strokeWidth={1.8} />
                    <Text style={styles.connectPrimaryButtonText}>Open email</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        ) : null}

        <ProjectDetailModal
          onClose={() => setDetailProject(null)}
          onContact={openConnectRequest}
          onOpenLink={handleVisitLink}
          onToggleBookmark={handleToggleBookmark}
          project={detailProject}
          saved={detailProject ? bookmarkedProjectIds.has(detailProject.project_id) : false}
        />

        <CardPopupModal
          visible={showPassPopup}
          onClose={() => setShowPassPopup(false)}
          fullName={fullName}
          city={locationLabel}
          tierLabel={tierLabel}
          displayId={displayId}
          memberUuid={user?.id || profile?.id || ''}
        />

        {searchOpen ? (
          <SearchOverlay
            onClose={() => setSearchOpen(false)}
            onSelect={(projectId) => {
              openProjectDetailById(projectId);
              setSearchOpen(false);
              switchView('list');
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
  howCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
    backgroundColor: colors.cream,
    gap: 12,
  },
  howKicker: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  howRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  howNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  howNumberText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    color: colors.goldDark,
  },
  howCopyWrap: {
    flex: 1,
  },
  howTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  howCopy: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.gray,
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
  projectModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  projectModeCopy: {
    flex: 1,
  },
  projectModeTitle: {
    fontFamily: typography.serif.semiBold,
    fontSize: 20,
    color: colors.black,
  },
  projectModeSubtitle: {
    marginTop: 4,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.gray,
  },
  projectModeButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.black,
  },
  projectModeButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
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
  contactRequirementText: {
    marginTop: 6,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.gray,
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
  interestRowContact: {
    marginTop: 4,
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.black,
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
  connectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  connectCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radius.xl,
    backgroundColor: colors.bone,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  connectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  connectEyebrow: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.gray,
  },
  connectTitle: {
    marginTop: 4,
    fontFamily: typography.serif.medium,
    fontSize: 20,
    color: colors.black,
  },
  connectProjectName: {
    marginTop: 18,
    fontFamily: typography.serif.medium,
    fontSize: 16,
    color: colors.black,
  },
  connectContactLine: {
    marginTop: 4,
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
  connectInput: {
    minHeight: 126,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.08)',
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.black,
  },
  connectHintText: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.gray,
  },
  connectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  connectSecondaryButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.06)',
  },
  connectSecondaryButtonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.black,
  },
  connectPrimaryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  connectPrimaryButtonDisabled: {
    opacity: 0.42,
  },
  connectPrimaryButtonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
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
  projectDetailBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  projectDetailShell: {
    maxHeight: '86%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.bone,
    overflow: 'hidden',
  },
  projectDetailScroll: {
    padding: 18,
    paddingBottom: 34,
  },
  projectDetailEyebrow: {
    marginBottom: 10,
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gray,
  },
  projectDetailHint: {
    marginTop: 10,
    paddingHorizontal: 2,
    fontFamily: typography.body.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.gray,
  },
});
