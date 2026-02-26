import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { C, T, S, R, TIER_LEVELS } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';
import { useLatestPulse } from '../../queries/pulse';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PAD = S._12;
const GAP = S._8;
const HALF_W = (SCREEN_WIDTH - GRID_PAD * 2 - GAP) / 2;

// Animated counter
function Counter({ to, duration = 800 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let n = 0;
    const step = to / (duration / 16);
    const interval = setInterval(() => {
      n += step;
      if (n >= to) {
        setValue(to);
        clearInterval(interval);
      } else {
        setValue(Math.floor(n));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [to, duration]);

  return <Text style={{ ...T.stat, color: C.textPrimary }}>{value}</Text>;
}

export default function PulseScreen() {
  const { tier } = useAuth();
  const { data: pulse, isLoading, refetch, isRefetching } = useLatestPulse();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const stats = pulse?.stats as any;

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
          <Text style={styles.dateLabel}>{dateStr}</Text>
          <Text style={styles.heroThe}>The</Text>
          <Text style={styles.heroPulse}>Pulse</Text>
          <View style={styles.taglineRow}>
            <View style={styles.skewBar} />
            <Text style={styles.tagline}>Dispatches from the Convergence</Text>
          </View>
        </MotiView>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* ── HERO CARD ── Full Width, Dark */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            style={styles.heroCard}
          >
            <View style={styles.topGradientLine} />
            <View style={styles.heroCardInner}>
              {/* Featured badge */}
              <View style={styles.featuredBadge}>
                <View style={styles.pulseDot} />
                <Text style={{ ...T.label, color: C.goldOnDark }}>Featured</Text>
              </View>

              <Text style={styles.heroHeadline}>
                {pulse?.headline || 'The 2026 Laureate Class Revealed'}
              </Text>
              <Text style={styles.heroSubline}>
                Seven alchemists. Seven paradigm shifts.
              </Text>

              {/* Avatar row */}
              <View style={styles.avatarRow}>
                {[
                  { initials: 'KK', bg: C.burgundy },
                  { initials: 'ZO', bg: C.gold },
                  { initials: 'JE', bg: C.olive },
                  { initials: '+4', bg: '#5a4a5a' },
                ].map((a, i) => (
                  <View
                    key={i}
                    style={[
                      styles.avatar,
                      { backgroundColor: a.bg, marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i },
                    ]}
                  >
                    <Text style={styles.avatarText}>{a.initials}</Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>

          {/* ── ROW 2: Recognition + Right Column ── */}
          <View style={styles.row2}>
            {/* Recognition */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
              style={styles.recognitionCard}
            >
              <View style={styles.goldTopBorder} />
              <Text style={{ ...T.label, color: C.brass, marginBottom: S._8 }}>
                Recognition
              </Text>
              <Text style={{ ...T.cardTitleSm, color: C.textPrimary, marginBottom: S._4 }}>
                Prof. Kudzai Kanhutu
              </Text>
              <Text style={{ ...T.bodyItalic, fontSize: 13, color: C.textSecondary }}>
                WHO Advisory Board
              </Text>
              <View style={styles.recognitionBottom}>
                <Text style={{ ...T.stat, color: C.gWarm, fontSize: 36, opacity: 0.15 }}>98</Text>
              </View>
            </MotiView>

            {/* Right Column: Investment + Movement */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 250 }}
              style={styles.rightCol}
            >
              {/* Investment - Dark */}
              <View style={styles.investCard}>
                <Text style={{ ...T.label, color: C.burgundyOnDark, marginBottom: S._8 }}>
                  Investment
                </Text>
                <Text style={{ ...T.cardTitleSm, color: C.lightPrimary }}>KPMG Accelerator</Text>
                <Text
                  style={{
                    ...T.bodyItalic,
                    fontSize: 12,
                    color: C.lightSecondary,
                    marginTop: S._4,
                  }}
                >
                  12-week programme
                </Text>
                <View
                  style={{ flexDirection: 'row', alignItems: 'baseline', gap: S._2, marginTop: S._8 }}
                >
                  <Text style={{ ...T.stat, color: C.goldOnDark }}>50</Text>
                  <Text style={{ ...T.meta, color: C.lightTertiary }}>K</Text>
                </View>
              </View>

              {/* Movement - Light */}
              <View style={styles.moveCard}>
                <Text style={{ ...T.label, color: C.olive, marginBottom: S._8 }}>Movement</Text>
                <Text style={{ ...T.cardTitleSm, color: C.textPrimary }}>Brisbane Launches</Text>
                <Text
                  style={{ ...T.stat, fontSize: 28, color: C.olive, opacity: 0.2, marginTop: S._4 }}
                >
                  84
                </Text>
              </View>
            </MotiView>
          </View>

          {/* ── CULTURE CARD ── Full Width */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 350 }}
            style={styles.cultureCard}
          >
            <View style={styles.cultureLeftBar} />
            <View style={styles.culturePattern} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...T.label, color: C.olive, marginBottom: S._4 }}>
                Culture · SecondzAU
              </Text>
              <Text style={{ ...T.cardTitleSm, color: C.textPrimary }}>
                The Archive Collection
              </Text>
              <Text
                style={{ ...T.bodyItalic, fontSize: 13, color: C.textSecondary, marginTop: S._2 }}
              >
                Vintage African textiles reimagined
              </Text>
            </View>
          </MotiView>

          {/* ── STATS ROW ── */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 420 }}
            style={styles.statsRow}
          >
            {[
              { n: stats?.alchemists || 527, label: 'Alchemists', color: C.burgundy },
              { n: stats?.this_week || 84, label: 'This Week', color: C.gold },
              { n: stats?.cities || 12, label: 'Cities', color: C.olive },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { borderTopColor: s.color + '30' }]}>
                <Counter to={s.n} duration={1000 + i * 200} />
                <Text
                  style={{
                    ...T.label,
                    fontSize: 11,
                    color: C.textTertiary,
                    marginTop: S._2,
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </MotiView>
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
  dateLabel: { ...T.label, color: C.textTertiary, marginBottom: S._8 },
  heroThe: { ...T.hero, color: C.textPrimary },
  heroPulse: { ...T.hero, color: C.textPrimary },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: S._12, marginTop: S._8 },
  skewBar: {
    width: 40,
    height: 4,
    backgroundColor: C.burgundy,
    transform: [{ skewX: '-20deg' }],
    opacity: 0.5,
  },
  tagline: { ...T.bodyItalic, color: C.textTertiary },

  // Bento grid
  bentoGrid: { paddingHorizontal: GRID_PAD, marginTop: S._20, gap: GAP },

  // Hero card
  heroCard: {
    backgroundColor: C.charcoal,
    overflow: 'hidden',
    position: 'relative',
  },
  topGradientLine: { height: 3, backgroundColor: C.burgundy },
  heroCardInner: { padding: S._20 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S._8,
    paddingVertical: S._6,
    paddingHorizontal: S._12,
    backgroundColor: 'rgba(248,246,243,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.1)',
    borderRadius: R.lg,
    alignSelf: 'flex-start',
    marginBottom: S._16,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.goldOnDark,
  },
  heroHeadline: {
    ...T.subtitle,
    color: C.lightPrimary,
    maxWidth: '78%',
    marginBottom: S._8,
  },
  heroSubline: { ...T.bodyItalic, color: C.lightSecondary },
  avatarRow: { flexDirection: 'row', marginTop: S._16 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: C.lightPrimary,
    fontWeight: '600',
  },

  // Row 2
  row2: { flexDirection: 'row', gap: GAP },

  // Recognition
  recognitionCard: {
    width: HALF_W,
    backgroundColor: C.creamSoft,
    padding: S._16,
    minHeight: 192,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  goldTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.gold,
    opacity: 0.3,
  },
  recognitionBottom: {
    alignItems: 'flex-end',
    marginTop: S._8,
  },

  // Right column
  rightCol: { width: HALF_W, gap: GAP },
  investCard: {
    flex: 1,
    backgroundColor: C.charcoal,
    padding: S._16,
    overflow: 'hidden',
  },
  moveCard: {
    flex: 1,
    backgroundColor: C.creamSoft,
    padding: S._16,
    borderLeftWidth: 3,
    borderLeftColor: C.olive + '35',
  },

  // Culture
  cultureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S._16,
    padding: S._16,
    backgroundColor: C.stone,
    overflow: 'hidden',
  },
  cultureLeftBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: C.gWarm,
  },
  culturePattern: {
    width: 52,
    height: 52,
    backgroundColor: C.gFaint,
    borderWidth: 1,
    borderColor: C.border,
    marginLeft: S._8,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: S._24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.creamSoft,
    padding: S._12,
    alignItems: 'center',
    borderTopWidth: 2,
  },
});
