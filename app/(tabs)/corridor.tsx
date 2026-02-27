import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { C, T, S, R, TIER_DISPLAY_NAMES } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';
import { useCorridorOpportunities, useExpressInterest } from '../../queries/corridor';
import { TierGate } from '../../components/TierGate';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

const FILTER_MAP: Record<string, string | undefined> = {
  All: undefined,
  'Co-Invest': 'co_invest',
  Boards: 'board',
  Speaking: 'speaking',
};

const TYPE_DISPLAY: Record<string, string> = {
  co_invest: 'CO-INVEST',
  board: 'BOARD SEAT',
  speaking: 'KEYNOTE',
  procurement: 'PROCUREMENT',
};

const TYPE_COLOR: Record<string, string> = {
  co_invest: C.gold,
  board: C.burgundy,
  speaking: C.olive,
  procurement: C.brass,
};


export default function CorridorScreen() {
  const { tier } = useAuth();
  const [filter, setFilter] = useState('All');
  const filterType = FILTER_MAP[filter];
  const { data: opportunities, isLoading, refetch, isRefetching } = useCorridorOpportunities(filterType);
  const expressInterest = useExpressInterest();

  return (
    <TierGate minTier="silver" >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Aurora background blobs */}
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, { backgroundColor: 'rgba(201,169,98,0.06)', top: -30, left: -50, width: 240, height: 240 }]} />
          <View style={[styles.blob, { backgroundColor: 'rgba(114,47,55,0.05)', bottom: 80, right: -40, width: 200, height: 200 }]} />
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
            <Text style={styles.heroThe}>The</Text>
            <Text style={styles.heroCorridor}>Corridor</Text>
            <View style={styles.taglineRow}>
              <View style={styles.skewBar} />
              <Text style={styles.tagline}>Where real deals happen</Text>
            </View>
          </MotiView>

          {/* Filter Pills */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            style={styles.filterRow}
          >
            {Object.keys(FILTER_MAP).map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilter(f);
                  }}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </MotiView>

          {/* Opportunities */}
          <View style={styles.oppList}>
            {isLoading ? (
              <View style={styles.emptyBox}>
                <Text style={{ ...T.body, color: C.lightTertiary }}>Loading opportunities...</Text>
              </View>
            ) : !opportunities?.length ? (
              <View style={styles.emptyBox}>
                <Text style={{ ...T.body, color: C.lightTertiary }}>No opportunities in this category.</Text>
              </View>
            ) : (
              opportunities.map((opp: any, i: number) => {
                const color = TYPE_COLOR[opp.type] || C.olive;
                const colorOnDark = color === C.gold ? C.goldOnDark
                  : color === C.burgundy ? C.burgundyOnDark
                  : color === C.olive ? C.oliveOnDark
                  : C.goldOnDark;
                const isUrgent = opp.closing_date &&
                  new Date(opp.closing_date).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000;

                return (
                  <MotiView
                    key={opp.id}
                    from={{ opacity: 0, translateY: 16 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 200 + i * 80 }}
                  >
                    <LiquidGlassCard variant="dark" noPadding>
                      <Pressable
                        style={({ pressed }) => [
                          styles.oppCard,
                          { borderLeftColor: color + '40' },
                          pressed && styles.oppCardPressed,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          expressInterest.mutate({ opportunityId: opp.id });
                        }}
                        accessibilityLabel={`${TYPE_DISPLAY[opp.type]}: ${opp.title}`}
                      >
                        {/* Urgent corner */}
                        {isUrgent && <View style={styles.urgentCorner} />}

                        <View style={styles.oppHeader}>
                          <View style={styles.oppTypeRow}>
                            <Text style={{ ...T.label, color: colorOnDark }}>
                              {TYPE_DISPLAY[opp.type] || opp.type.toUpperCase()}
                            </Text>
                            {isUrgent && (
                              <View style={styles.closingBadge}>
                                <Text style={styles.closingText}>CLOSING</Text>
                              </View>
                            )}
                          </View>
                          <View style={[styles.tierPill, { borderColor: C.darkBorder }]}>
                            <Text style={{ ...T.meta, color: C.lightTertiary }}>
                              {TIER_DISPLAY_NAMES[opp.min_tier] || 'All'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={{
                            ...T.cardTitle,
                            color: C.lightPrimary,
                            marginBottom: S._6,
                          }}
                        >
                          {opp.title}
                        </Text>
                        <Text
                          style={{
                            ...T.bodyItalic,
                            color: C.lightSecondary,
                          }}
                        >
                          {opp.description}
                        </Text>
                      </Pressable>
                    </LiquidGlassCard>
                  </MotiView>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TierGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 + 84 },
  blob: { position: 'absolute', borderRadius: 999 },

  // Header
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  heroThe: { ...T.hero, color: C.lightPrimary },
  heroCorridor: { ...T.hero, color: C.lightPrimary },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: S._12, marginTop: S._8 },
  skewBar: {
    width: 32,
    height: 4,
    backgroundColor: C.burgundyOnDark,
    transform: [{ skewX: '-20deg' }],
    opacity: 0.5,
  },
  tagline: { ...T.bodyItalic, color: C.lightTertiary },

  // Filter pills
  filterRow: {
    flexDirection: 'row',
    gap: S._8,
    paddingHorizontal: S._20,
    paddingVertical: S._16,
  },
  filterPill: {
    paddingVertical: S._8,
    paddingHorizontal: S._16,
    minHeight: 40,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(248,246,243,0.08)',
    borderColor: 'rgba(248,246,243,0.25)',
  },
  filterText: { ...T.label, fontSize: 11, color: C.lightTertiary },
  filterTextActive: { color: C.lightPrimary, fontWeight: '700' },

  // Opportunity cards
  oppList: {
    paddingHorizontal: S._12,
    gap: S._8,
  },
  oppCard: {
    borderLeftWidth: 3,
    padding: S._16,
    position: 'relative',
    overflow: 'hidden',
  },
  oppCardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  urgentCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 28,
    borderTopColor: C.gold,
    borderLeftWidth: 28,
    borderLeftColor: 'transparent',
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S._12,
  },
  oppTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S._8,
  },
  closingBadge: {
    backgroundColor: C.gold,
    paddingVertical: S._2,
    paddingHorizontal: S._8,
    borderRadius: R.lg,
  },
  closingText: {
    ...T.label,
    fontSize: 11,
    letterSpacing: 1,
    color: C.warmBlack,
  },
  tierPill: {
    paddingVertical: S._4,
    paddingHorizontal: S._12,
    borderWidth: 1,
    borderRadius: R.lg,
  },
  emptyBox: {
    padding: S._24,
    alignItems: 'center',
  },
});
