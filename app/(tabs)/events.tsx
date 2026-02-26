import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { C, T, S, R, TIER_DISPLAY_NAMES } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';
import { useEvents, useRsvpToEvent } from '../../queries/events';

type EventMode = 'vibes' | 'dinners' | 'talks';

const MODE_CONFIG: Record<
  EventMode,
  { label: string; sub: string; color: string; dbType: string }
> = {
  vibes: { label: 'Vibes', sub: 'Cultural', color: C.burgundy, dbType: 'vibes' },
  dinners: { label: 'Dinners', sub: 'Intimate', color: C.gold, dbType: 'dinner' },
  talks: { label: 'Talks', sub: 'Intellectual', color: C.olive, dbType: 'talk' },
};

function formatDay(dateStr: string) {
  return new Date(dateStr).getDate().toString();
}

function formatMonth(dateStr: string) {
  return new Date(dateStr)
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export default function EventsScreen() {
  const { tier } = useAuth();
  const [mode, setMode] = useState<EventMode>('vibes');
  const dbType = MODE_CONFIG[mode].dbType;
  const { data: events, isLoading, refetch, isRefetching } = useEvents(dbType);
  const rsvpMutation = useRsvpToEvent();

  // Also fetch gala events for vibes tab
  const { data: galas } = useEvents('gala');
  const gala = galas?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.textPrimary}
          />
        }
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.header}
        >
          <Text style={styles.heroText}>Events</Text>
        </MotiView>

        {/* Mode Tabs — Three Worlds */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.modeTabs}
        >
          {(Object.keys(MODE_CONFIG) as EventMode[]).map((m) => {
            const active = mode === m;
            const cfg = MODE_CONFIG[m];
            return (
              <Pressable
                key={m}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode(m);
                }}
                style={[
                  styles.modeTab,
                  active && {
                    backgroundColor: cfg.color + '08',
                    borderTopColor: cfg.color,
                    borderTopWidth: 2,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.modeLabel,
                    active && styles.modeLabelActive,
                  ]}
                >
                  {cfg.label}
                </Text>
                <Text
                  style={[
                    styles.modeSub,
                    active ? { color: cfg.color } : { color: C.textGhost },
                  ]}
                >
                  {cfg.sub}
                </Text>
              </Pressable>
            );
          })}
        </MotiView>

        {/* Events List */}
        <View style={styles.eventList}>
          {/* Gala Card — only on vibes tab */}
          {mode === 'vibes' && gala && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.galaCard,
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  rsvpMutation.mutate(gala.id);
                }}
                accessibilityLabel="AMARI Gala 2026"
              >
                <View style={styles.galaGradientLine} />

                {/* The Event badge */}
                <View style={styles.galaBadge}>
                  <View style={styles.galaPulseDot} />
                  <Text style={{ ...T.label, color: C.goldOnDark }}>The Event</Text>
                </View>

                <Text style={{ ...T.title, color: C.lightPrimary }}>AMARI</Text>
                <Text style={styles.galaTitle}>Gala 2026</Text>
                <Text
                  style={{
                    ...T.bodyItalic,
                    color: C.lightSecondary,
                    marginTop: S._8,
                  }}
                >
                  Black Tie · November · Melbourne
                </Text>

                <Pressable style={styles.galaBtn}>
                  <Text style={styles.galaBtnText}>Register Interest</Text>
                </Pressable>
              </Pressable>
            </MotiView>
          )}

          {/* Regular events */}
          {isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={{ ...T.body, color: C.textTertiary }}>Loading events...</Text>
            </View>
          ) : !events?.length && !(mode === 'vibes' && gala) ? (
            <View style={styles.emptyBox}>
              <Text style={{ ...T.body, color: C.textTertiary }}>
                No upcoming {MODE_CONFIG[mode].label.toLowerCase()} events.
              </Text>
            </View>
          ) : (
            events?.map((event: any, i: number) => (
              <MotiView
                key={event.id}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: i * 80 }}
              >
                {mode === 'dinners' ? (
                  /* Dinner layout — date block + info */
                  <Pressable
                    style={({ pressed }) => [
                      styles.dinnerCard,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      rsvpMutation.mutate(event.id);
                    }}
                    accessibilityLabel={event.title}
                  >
                    <View style={styles.dateBlock}>
                      <Text style={{ ...T.stat, color: C.textPrimary }}>
                        {formatDay(event.starts_at)}
                      </Text>
                      <Text style={{ ...T.label, fontSize: 11, color: C.brass }}>
                        {formatMonth(event.starts_at)}
                      </Text>
                    </View>
                    <View style={styles.dinnerInfo}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...T.cardTitleSm,
                            color: C.textPrimary,
                            marginBottom: S._4,
                          }}
                        >
                          {event.title}
                        </Text>
                        <Text
                          style={{
                            ...T.bodyItalic,
                            fontSize: 13,
                            color: C.textSecondary,
                          }}
                        >
                          {event.venue_name || 'TBA'} ·{' '}
                          {event.capacity
                            ? `${event.capacity} seats`
                            : 'Open'}
                        </Text>
                      </View>
                      {event.min_tier && event.min_tier !== 'member' && (
                        <View style={styles.eventTierPill}>
                          <Text style={{ ...T.meta, color: C.textSecondary }}>
                            {TIER_DISPLAY_NAMES[event.min_tier]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ) : mode === 'talks' ? (
                  /* Talks layout — date label + title + speaker */
                  <Pressable
                    style={({ pressed }) => [
                      styles.talkCard,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      rsvpMutation.mutate(event.id);
                    }}
                    accessibilityLabel={event.title}
                  >
                    <Text style={{ ...T.label, color: C.olive, marginBottom: S._8 }}>
                      {formatFullDate(event.starts_at)}
                    </Text>
                    <Text
                      style={{
                        ...T.cardTitle,
                        color: C.textPrimary,
                        marginBottom: S._4,
                      }}
                    >
                      {event.title}
                    </Text>
                    <Text style={{ ...T.bodyItalic, color: C.textSecondary }}>
                      {event.description}
                    </Text>
                  </Pressable>
                ) : (
                  /* Vibes layout — simple cards */
                  <Pressable
                    style={({ pressed }) => [
                      styles.vibesCard,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      rsvpMutation.mutate(event.id);
                    }}
                    accessibilityLabel={event.title}
                  >
                    <Text
                      style={{
                        ...T.cardTitle,
                        fontSize: 15,
                        color: C.textPrimary,
                        marginBottom: S._4,
                      }}
                    >
                      {event.title}
                    </Text>
                    <Text style={{ ...T.bodyItalic, color: C.textSecondary }}>
                      {formatFullDate(event.starts_at)} · {event.venue_name || 'Culture'}
                    </Text>
                  </Pressable>
                )}
              </MotiView>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 },

  // Header
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  heroText: { ...T.hero, color: C.textPrimary },

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    paddingHorizontal: S._12,
    paddingTop: S._16,
    gap: S._8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: S._12,
    minHeight: 48,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  modeLabel: {
    ...T.cardTitleSm,
    fontSize: 13,
    color: C.textTertiary,
  },
  modeLabelActive: { color: C.textPrimary },
  modeSub: { ...T.label, fontSize: 11, marginTop: S._2 },

  // Event list
  eventList: {
    paddingHorizontal: S._12,
    paddingTop: S._12,
    gap: S._8,
  },

  // Gala card
  galaCard: {
    backgroundColor: C.warmBlack,
    padding: S._24,
    paddingHorizontal: S._20,
    minHeight: 232,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  galaGradientLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.gold,
  },
  galaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S._8,
    paddingVertical: S._6,
    paddingHorizontal: S._12,
    backgroundColor: C.gold + '12',
    borderWidth: 1,
    borderColor: C.gold + '18',
    borderRadius: R.lg,
    alignSelf: 'flex-start',
    marginBottom: S._16,
  },
  galaPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.goldOnDark,
  },
  galaTitle: {
    ...T.title,
    color: C.goldOnDark,
  },
  galaBtn: {
    marginTop: S._16,
    alignSelf: 'flex-start',
    paddingVertical: S._16,
    paddingHorizontal: S._24,
    minHeight: 48,
    borderRadius: R.pill,
    backgroundColor: 'rgba(114,47,55,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(114,47,55,0.4)',
  },
  galaBtnText: { ...T.btn, color: C.lightPrimary },

  // Dinner cards
  dinnerCard: {
    flexDirection: 'row',
    backgroundColor: C.creamSoft,
    overflow: 'hidden',
  },
  dateBlock: {
    width: 64,
    backgroundColor: C.gFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    paddingVertical: S._12,
  },
  dinnerInfo: {
    flex: 1,
    padding: S._16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTierPill: {
    paddingVertical: S._4,
    paddingHorizontal: S._12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
  },

  // Talk cards
  talkCard: {
    backgroundColor: C.creamSoft,
    padding: S._20,
    borderLeftWidth: 3,
    borderLeftColor: C.olive + '30',
  },

  // Vibes cards
  vibesCard: {
    backgroundColor: C.creamSoft,
    padding: S._16,
    borderLeftWidth: 3,
    borderLeftColor: C.burgundy + '25',
  },

  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  emptyBox: { padding: S._24, alignItems: 'center' },
});
