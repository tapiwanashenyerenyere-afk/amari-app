import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { C, T, S, R } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';
import { useCurrentMatch, useAlignedDecide } from '../../queries/aligned';
import { TierGate } from '../../components/TierGate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AlignedScreen() {
  const { tier } = useAuth();
  const { data: match, isLoading, refetch, isRefetching } = useCurrentMatch();
  const decideMutation = useAlignedDecide();

  // Determine stage from data
  const stage = match
    ? match.stage === 'revealed'
      ? 2
      : match.myDecision === 'accept'
        ? 1
        : 0
    : 0;

  const handleDecision = async (decision: 'accept' | 'pass') => {
    if (!match) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    decideMutation.mutate({ matchId: match.id, decision });
  };

  const otherMember = match?.otherMember;
  const initials = otherMember?.full_name
    ? otherMember.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <TierGate minTier="platinum" >
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
            <Text style={styles.heroText}>Aligned</Text>
            <View style={styles.taglineRow}>
              <View style={styles.skewBar} />
              <Text style={styles.tagline}>A convergence in miniature</Text>
            </View>
          </MotiView>

          {/* Main Card */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 150 }}
            style={styles.mainCard}
          >
            {/* Portrait Zone */}
            <View style={styles.portraitZone}>
              <View style={styles.portraitGradientLine} />

              {/* Central arc + portrait */}
              <View style={styles.centralArc}>
                {/* Outer ring */}
                <View style={[styles.arcRing, { width: 132, height: 132, borderRadius: 66 }]}>
                  {/* Inner portrait */}
                  <View
                    style={[
                      styles.portrait,
                      stage >= 2 && styles.portraitRevealed,
                    ]}
                  >
                    <Text
                      style={[
                        stage < 2 ? styles.mysteryChar : styles.revealedInitials,
                      ]}
                    >
                      {stage < 2 ? '?' : initials}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Week label */}
              <View style={styles.weekLabel}>
                <Text style={{ ...T.label, color: C.lightTertiary }}>Week 9</Text>
              </View>

              {/* Match percentage */}
              <View style={styles.matchPercent}>
                <Text style={[styles.matchNumber, stage >= 2 && styles.matchNumberRevealed]}>
                  {stage >= 2 ? (match?.alignment_score || '94') : '—'}
                </Text>
                <Text style={{ ...T.meta, color: C.lightTertiary }}>%</Text>
              </View>

              {/* Bottom gradient fade */}
              <View style={styles.portraitFade} />
            </View>

            {/* Info Panel */}
            <View style={styles.infoPanel}>
              <Text style={styles.infoName}>
                {stage >= 2
                  ? otherMember?.full_name || 'Amara Keita'
                  : 'Introduction Ready'}
              </Text>
              <Text style={styles.infoRole}>
                {stage >= 2
                  ? `${otherMember?.title || 'Venture Partner'} · ${otherMember?.city || 'Lagos → Melbourne'}`
                  : 'Mutual acceptance required to reveal'}
              </Text>

              {/* Why Aligned */}
              <View style={styles.whyBox}>
                <Text style={{ ...T.label, color: C.goldOnDark, marginBottom: S._8 }}>
                  Why You're Aligned
                </Text>
                <Text style={{ ...T.body, color: C.lightSecondary }}>
                  Both building at the intersection of fintech and diaspora investment.
                  {stage >= 2 ? ' Her fund has deployed $12M across African markets.' : ''}
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.tagRow}>
                {[
                  { text: 'Fintech', color: C.burgundy },
                  { text: 'Diaspora Capital', color: C.gold },
                  { text: otherMember?.city || 'Melbourne', color: C.olive },
                  { text: "Laureate '24", color: C.brass },
                ].map((tag, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tag,
                      { backgroundColor: tag.color + '15', borderColor: tag.color + '25' },
                    ]}
                  >
                    <Text style={{ ...T.meta, color: C.lightSecondary }}>{tag.text}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {stage === 0 && !match && (
                  <View style={styles.noMatchBox}>
                    <Text style={{ ...T.body, color: C.lightSecondary, textAlign: 'center' }}>
                      No active match this week. Check back soon.
                    </Text>
                  </View>
                )}

                {stage === 0 && match && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.acceptBtn,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleDecision('accept')}
                      accessibilityLabel="Accept match"
                    >
                      <Text style={styles.btnText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.passBtn,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => handleDecision('pass')}
                      accessibilityLabel="Pass on match"
                    >
                      <Text style={styles.passBtnText}>Pass</Text>
                    </Pressable>
                  </>
                )}

                {stage === 1 && (
                  <View style={styles.awaitingBtn}>
                    <Text style={styles.btnText}>Awaiting · Tap to Reveal →</Text>
                  </View>
                )}

                {stage === 2 && (
                  <MotiView
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.convergenceBox}
                  >
                    <Text style={styles.btnText}>Convergence Achieved</Text>
                    <Text
                      style={{
                        ...T.bodyItalic,
                        fontSize: 13,
                        color: C.lightTertiary,
                        marginTop: S._4,
                      }}
                    >
                      Contact shared via The Corridor
                    </Text>
                  </MotiView>
                )}
              </View>
            </View>
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    </TierGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 },

  // Header
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  heroText: { ...T.hero, color: C.textPrimary },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: S._12, marginTop: S._8 },
  skewBar: {
    width: 32,
    height: 4,
    backgroundColor: C.gold,
    transform: [{ skewX: '-20deg' }],
    opacity: 0.5,
  },
  tagline: { ...T.bodyItalic, color: C.textTertiary },

  // Main card
  mainCard: {
    marginHorizontal: S._12,
    marginTop: S._20,
    overflow: 'hidden',
    borderRadius: R.sm,
  },

  // Portrait zone
  portraitZone: {
    height: 272,
    backgroundColor: C.warmBlack,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitGradientLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.gold,
  },
  centralArc: { position: 'relative' },
  arcRing: {
    borderWidth: 2,
    borderColor: 'rgba(248,246,243,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portrait: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.burgundy,
    opacity: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitRevealed: {
    opacity: 1,
  },
  mysteryChar: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 36,
    fontStyle: 'italic',
    color: C.lightFaint,
  },
  revealedInitials: {
    ...T.title,
    fontSize: 28,
    color: C.lightPrimary,
  },
  weekLabel: { position: 'absolute', top: S._16, left: S._16 },
  matchPercent: {
    position: 'absolute',
    top: S._16,
    right: S._16,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  matchNumber: {
    fontFamily: 'Syne-ExtraBold',
    fontSize: 28,
    fontWeight: '800',
    color: C.lightFaint,
  },
  matchNumberRevealed: { color: C.goldOnDark },
  portraitFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(17,17,16,0.6)',
  },

  // Info panel
  infoPanel: { backgroundColor: C.warmBlack, paddingHorizontal: S._20, paddingBottom: S._24 },
  infoName: { ...T.title, color: C.lightPrimary, paddingTop: S._4 },
  infoRole: { ...T.bodyItalic, color: C.lightSecondary, marginTop: S._4 },
  whyBox: {
    marginTop: S._16,
    padding: S._16,
    backgroundColor: 'rgba(248,246,243,0.05)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(201,169,98,0.3)',
  },
  tagRow: {
    flexDirection: 'row',
    gap: S._8,
    marginTop: S._16,
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: S._6,
    paddingHorizontal: S._12,
    borderWidth: 1,
    borderRadius: R.lg,
  },

  // Actions
  actions: { marginTop: S._20, flexDirection: 'row', gap: S._8 },
  acceptBtn: {
    flex: 1,
    paddingVertical: S._16,
    paddingHorizontal: S._24,
    minHeight: 48,
    borderRadius: R.pill,
    backgroundColor: 'rgba(114,47,55,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(114,47,55,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtn: {
    paddingVertical: S._16,
    paddingHorizontal: S._24,
    minHeight: 48,
    borderRadius: R.pill,
    backgroundColor: 'rgba(248,246,243,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,246,243,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingBtn: {
    flex: 1,
    paddingVertical: S._16,
    paddingHorizontal: S._24,
    minHeight: 48,
    borderRadius: R.pill,
    backgroundColor: 'rgba(201,169,98,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,98,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convergenceBox: {
    flex: 1,
    padding: S._16,
    alignItems: 'center',
    backgroundColor: 'rgba(114,47,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.3)',
    borderRadius: R.xl,
  },
  noMatchBox: {
    flex: 1,
    padding: S._20,
    alignItems: 'center',
  },
  btnText: { ...T.btn, color: C.lightPrimary },
  passBtnText: { ...T.nav, color: C.lightTertiary },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
