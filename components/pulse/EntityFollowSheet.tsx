import { useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  buildEntityListRows,
  entityIndustryLabel,
  entityKindLabel,
  entityRegionLabel,
  filterEntities,
  type EntityFilter,
  type EntityListRow,
} from '@/lib/entityMeta';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useEntityFollows, useFollowableEntities, useSetEntityFollow } from '@/queries/news';

interface EntityFollowSheetProps {
  visible: boolean;
  onClose: () => void;
}

const FILTERS: { key: EntityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'person', label: 'People' },
  { key: 'company', label: 'Organisations' },
  { key: 'theme', label: 'Themes' },
];

export function EntityFollowSheet({ visible, onClose }: EntityFollowSheetProps) {
  const catalogue = useFollowableEntities(visible);
  const follows = useEntityFollows(visible);
  const setFollow = useSetEntityFollow();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<EntityFilter>('all');
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [mutationError, setMutationError] = useState<string | null>(null);

  const entities = useMemo(() => catalogue.data ?? [], [catalogue.data]);
  const followedIds = useMemo(() => new Set(follows.data ?? []), [follows.data]);
  const filtered = useMemo(
    () => filterEntities(entities, filter, search),
    [entities, filter, search],
  );
  const rows = useMemo(() => buildEntityListRows(filtered), [filtered]);
  const followedCount = useMemo(
    () => entities.filter((entity) => followedIds.has(entity.id)).length,
    [entities, followedIds],
  );

  const initialLoading =
    (catalogue.isLoading && !catalogue.data) || (follows.isLoading && !follows.data);
  const initialCatalogueError = catalogue.isError && !catalogue.data;
  const initialFollowsError = follows.isError && !follows.data;
  const refreshing =
    (catalogue.isFetching && Boolean(catalogue.data)) ||
    (follows.isFetching && Boolean(follows.data));
  const refreshError =
    (catalogue.isError && Boolean(catalogue.data)) || (follows.isError && Boolean(follows.data));

  const retry = () => {
    catalogue.refetch();
    follows.refetch();
  };

  const toggleFollow = async (entityId: number, name: string) => {
    if (pendingIds.has(entityId)) return;
    const follow = !followedIds.has(entityId);
    setMutationError(null);
    setPendingIds((current) => new Set(current).add(entityId));
    Haptics.selectionAsync();
    try {
      await setFollow.mutateAsync({ entityId, follow });
      AccessibilityInfo.announceForAccessibility(
        follow ? `Following ${name}` : `No longer following ${name}`,
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMutationError(`We couldn’t confirm the change for ${name}. The previous setting was restored.`);
      AccessibilityInfo.announceForAccessibility(`Could not update ${name}. Previous setting restored.`);
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(entityId);
        return next;
      });
    }
  };

  const renderRow = ({ item }: { item: EntityListRow }) => {
    if (item.type === 'divider') {
      return (
        <View accessibilityRole="header" style={styles.divider}>
          <Text style={styles.dividerText}>{item.label}</Text>
        </View>
      );
    }

    const { entity } = item;
    const followed = followedIds.has(entity.id);
    const pending = pendingIds.has(entity.id);
    const metadata = [
      entityKindLabel(entity.kind),
      entityIndustryLabel(entity.industry),
      entityRegionLabel(entity.region),
    ].filter(Boolean).join(' · ');

    return (
      <Pressable
        accessibilityHint={followed ? 'Double tap to unfollow' : 'Double tap to follow'}
        accessibilityLabel={`${entity.name}. ${metadata}`}
        accessibilityRole="switch"
        accessibilityState={{ checked: followed, disabled: pending, busy: pending }}
        disabled={pending}
        onPress={() => void toggleFollow(entity.id, entity.name)}
        style={({ pressed }) => [styles.entityRow, pressed && !pending && styles.entityRowPressed]}
      >
        <View style={styles.entityCopy}>
          <Text style={styles.entityName}>{entity.name}</Text>
          <Text style={styles.entityMeta}>{metadata}</Text>
        </View>
        <View style={styles.trailingState}>
          {pending ? (
            <ActivityIndicator color={colors.black} size="small" />
          ) : (
            <Text style={[styles.followState, followed && styles.followStateOn]}>
              {followed ? 'Following' : 'Follow'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.column}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text accessibilityRole="header" style={styles.title}>Follow your world</Text>
                <Text style={styles.subtitle}>
                  People, organisations and themes you follow rise in your briefing.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close entity following"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={styles.closeButton}
              >
                <X color={colors.gray} size={19} strokeWidth={2.1} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Search color={colors.gray} size={18} strokeWidth={2} />
              <TextInput
                accessibilityLabel="Search people, organisations and themes"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                clearButtonMode="while-editing"
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor="rgba(0,0,0,0.42)"
                returnKeyType="search"
                style={styles.searchInput}
                value={search}
              />
            </View>

            <View accessibilityRole="tablist" style={styles.filters}>
              {FILTERS.map((entry) => {
                const selected = filter === entry.key;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={entry.key}
                    onPress={() => setFilter(entry.key)}
                    style={[styles.filter, selected && styles.filterSelected]}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.countRow}>
              <Text accessibilityLiveRegion="polite" style={styles.countText}>
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'} · {followedCount} followed
              </Text>
              {refreshing ? <ActivityIndicator accessibilityLabel="Refreshing catalogue" color={colors.gray} size="small" /> : null}
            </View>

            {mutationError ? (
              <Text accessibilityLiveRegion="assertive" style={styles.errorBanner}>{mutationError}</Text>
            ) : refreshError ? (
              <Text accessibilityLiveRegion="polite" style={styles.refreshBanner}>
                We couldn’t refresh just now. Showing the last confirmed list.
              </Text>
            ) : null}

            {initialLoading ? (
              <View style={styles.state}>
                <ActivityIndicator color={colors.black} />
                <Text style={styles.stateText}>Loading your world…</Text>
              </View>
            ) : initialFollowsError ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>Your follow settings didn’t load.</Text>
                <Text style={styles.stateText}>Nothing has been changed. Try again when you’re ready.</Text>
                <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : initialCatalogueError ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>The catalogue didn’t load.</Text>
                <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : entities.length === 0 ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>Nothing to follow yet.</Text>
                <Text style={styles.stateText}>The AMARI desk is preparing the catalogue.</Text>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>No matches.</Text>
                <Text style={styles.stateText}>Try another name or choose a different filter.</Text>
              </View>
            ) : (
              <FlatList
                contentContainerStyle={styles.listContent}
                data={rows}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.key}
                renderItem={renderRow}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  keyboardAvoiding: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  headerCopy: { flex: 1 },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 25,
    lineHeight: 31,
    color: colors.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.gray,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchWrap: {
    minHeight: 48,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.13)',
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 0,
    fontFamily: typography.body.regular,
    fontSize: 16,
    color: colors.black,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.14)',
  },
  filterSelected: { backgroundColor: colors.black, borderColor: colors.black },
  filterText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
  filterTextSelected: { color: colors.white },
  countRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  countText: {
    fontFamily: typography.mono.medium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.gray,
    letterSpacing: 0.5,
  },
  errorBanner: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(178,34,34,0.08)',
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
  },
  refreshBanner: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },
  listContent: { paddingBottom: spacing.xxxl },
  divider: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bone,
  },
  dividerText: {
    fontFamily: typography.mono.medium,
    fontSize: 10,
    lineHeight: 16,
    color: colors.gray,
    letterSpacing: 1.6,
  },
  entityRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.13)',
  },
  entityRowPressed: { backgroundColor: 'rgba(0,0,0,0.035)' },
  entityCopy: { flex: 1, paddingVertical: spacing.xs },
  entityName: {
    fontFamily: typography.body.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.black,
  },
  entityMeta: {
    marginTop: 2,
    fontFamily: typography.body.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.gray,
  },
  trailingState: {
    width: 78,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  followState: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.gray,
  },
  followStateOn: { color: colors.black },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  stateTitle: {
    fontFamily: typography.body.bold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.black,
    textAlign: 'center',
  },
  stateText: {
    marginTop: spacing.sm,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.gray,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  retryText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.white,
  },
});
