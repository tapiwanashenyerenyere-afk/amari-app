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
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

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
      {/* Aurora background blobs */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { backgroundColor: 'rgba(201,169,98,0.07)', top: -40, right: -60, width: 260, height: 260 }]} />
        <View style={[styles.blob, { backgroundColor: 'rgba(114,47,55,0.05)', bottom: 100, left: -40, width: 220, height: 220 }]} />
        <View style={[styles.blob, { backgroundColor: 'rgba(107,107,71,0.04)', top: '45%', left: '25%', width: 180, height: 180 }]} />
      </View>
      <GrainOverlay opacity={0.03} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.lightPrimary}
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
                    backgroundColor: cfg.color + '15',
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
                    active ? { color: cfg.color } : { color: C.lightFaint },
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
              <LiquidGlassCard variant="dark" noPadding>
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
              </LiquidGlassCard>
            </MotiView>
          )}

          {/* Regular events */}
          {isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={{ ...T.body, color: C.lightTertiary }}>Loading events...</Text>
            </View>
          ) : !events?.length && !(mode === 'vibes' && gala) ? (
            <View style={styles.emptyBox}>
              <Text style={{ ...T.body, color: C.lightTertiary }}>
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
                  <LiquidGlassCard variant="dark" noPadding>
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
                        <Text style={{ ...T.stat, color: C.lightPrimary }}>
                          {formatDay(event.starts_at)}
                        </Text>
                        <Text style={{ ...T.label, fontSize: 11, color: C.goldOnDark }}>
                          {formatMonth(event.starts_at)}
                        </Text>
                      </View>
                      <View style={styles.dinnerInfo}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...T.cardTitleSm,
                              color: C.lightPrimary,
                              marginBottom: S._4,
                            }}
                          >
                            {event.title}
                          </Text>
                          <Text
                            style={{
                              ...T.bodyItalic,
                              fontSize: 13,
                              color: C.lightSecondary,
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
                            <Text style={{ ...T.meta, color: C.lightTertiary }}>
                              {TIER_DISPLAY_NAMES[event.min_tier]}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </LiquidGlassCard>
                ) : mode === 'talks' ? (
                  /* Talks layout — date label + title + speaker */
                  <LiquidGlassCard variant="dark" noPadding>
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
                      <Text style={{ ...T.label, color: C.oliveOnDark, marginBottom: S._8 }}>
                        {formatFullDate(event.starts_at)}
                      </Text>
                      <Text
                        style={{
                          ...T.cardTitle,
                          color: C.lightPrimary,
                          marginBottom: S._4,
                        }}
                      >
                        {event.title}
                      </Text>
                      <Text style={{ ...T.bodyItalic, color: C.lightSecondary }}>
                        {event.description}
                      </Text>
                    </Pressable>
                  </LiquidGlassCard>
                ) : (
                  /* Vibes layout — simple cards */
                  <LiquidGlassCard variant="dark" noPadding>
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
                          color: C.lightPrimary,
                          marginBottom: S._4,
                        }}
                      >
                        {event.title}
                      </Text>
                      <Text style={{ ...T.bodyItalic, color: C.lightSecondary }}>
                        {formatFullDate(event.starts_at)} · {event.venue_name || 'Culture'}
                      </Text>
                    </Pressable>
                  </LiquidGlassCard>
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
  container: { flex: 1, backgroundColor: C.charcoal },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 + 84 },
  blob: { position: 'absolute', borderRadius: 999 },

  // Header
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  heroText: { ...T.hero, color: C.lightPrimary },

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
    color: C.lightTertiary,
  },
  modeLabelActive: { color: C.lightPrimary },
  modeSub: { ...T.label, fontSize: 11, marginTop: S._2 },

  // Event list
  eventList: {
    paddingHorizontal: S._12,
    paddingTop: S._12,
    gap: S._8,
  },

  // Gala card
  galaCard: {
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
    overflow: 'hidden',
  },
  dateBlock: {
    width: 64,
    backgroundColor: 'rgba(248,246,243,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(248,246,243,0.08)',
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
    borderColor: C.darkBorder,
    borderRadius: R.lg,
  },

  // Talk cards
  talkCard: {
    padding: S._20,
    borderLeftWidth: 3,
    borderLeftColor: C.olive + '30',
  },

  // Vibes cards
  vibesCard: {
    padding: S._16,
    borderLeftWidth: 3,
    borderLeftColor: C.burgundy + '25',
  },

  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  emptyBox: { padding: S._24, alignItems: 'center' },
});
