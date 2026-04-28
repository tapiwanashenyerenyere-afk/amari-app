import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AmariEmblem } from '../../components/v2/AmariEmblem';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { useSubmitOnboarding, type OnboardingScores } from '../../queries/onboarding';
import type {
  OnboardingAxis,
  OnboardingCommunityNeed,
  OnboardingTimeFocus,
  OnboardingWorkStage,
} from '../../types/database';

const CONSENT_VERSION = 'onboarding-2026-04-28';

const AXES: Array<{
  key: OnboardingAxis;
  label: string;
  accent: string;
}> = [
  { key: 'investor', label: 'Investor', accent: colors.gold },
  { key: 'founder', label: 'Founder', accent: '#D9B06F' },
  { key: 'operator', label: 'Operator', accent: '#C78B6E' },
  { key: 'creator', label: 'Creator', accent: '#8FAE8B' },
  { key: 'domain_specialist', label: 'Domain Specialist', accent: '#86A8C7' },
  { key: 'artist', label: 'Artist', accent: '#B57A8A' },
];

const TIME_OPTIONS: Array<{ label: string; value: OnboardingTimeFocus }> = [
  { label: 'Building', value: 'building' },
  { label: 'Investing', value: 'investing' },
  { label: 'Operating', value: 'operating' },
  { label: 'Creating', value: 'creating' },
  { label: 'Performing', value: 'performing' },
  { label: 'Specialising', value: 'specialising' },
];

const STAGE_OPTIONS: Array<{ label: string; value: OnboardingWorkStage }> = [
  { label: 'Idea', value: 'idea' },
  { label: 'Building', value: 'building' },
  { label: 'Launched', value: 'launched' },
  { label: 'Traction', value: 'traction' },
  { label: 'Scaling', value: 'scaling' },
  { label: 'Established', value: 'established' },
];

const NEED_OPTIONS: Array<{ label: string; value: OnboardingCommunityNeed }> = [
  { label: 'Capital', value: 'capital' },
  { label: 'Talent', value: 'talent' },
  { label: 'Customers', value: 'customers' },
  { label: 'Collaborators', value: 'collaborators' },
  { label: 'Distribution', value: 'distribution' },
  { label: 'Counsel', value: 'counsel' },
  { label: 'Community', value: 'community' },
];

const PRESETS: Array<{ label: string; scores: OnboardingScores }> = [
  {
    label: 'Founder',
    scores: { investor: 30, founder: 92, operator: 64, creator: 42, domain_specialist: 44, artist: 22 },
  },
  {
    label: 'Operator',
    scores: { investor: 28, founder: 56, operator: 95, creator: 34, domain_specialist: 66, artist: 18 },
  },
  {
    label: 'Investor',
    scores: { investor: 94, founder: 40, operator: 58, creator: 26, domain_specialist: 54, artist: 14 },
  },
  {
    label: 'Artist',
    scores: { investor: 16, founder: 36, operator: 24, creator: 72, domain_specialist: 34, artist: 96 },
  },
  {
    label: 'Specialist',
    scores: { investor: 34, founder: 42, operator: 58, creator: 46, domain_specialist: 94, artist: 24 },
  },
];

const DEFAULT_SCORES: OnboardingScores = {
  investor: 42,
  founder: 76,
  operator: 58,
  creator: 50,
  domain_specialist: 46,
  artist: 32,
};

type Point = { x: number; y: number };

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function axisUnit(index: number): Point {
  const angle = -Math.PI / 2 + (index / AXES.length) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function markerFromScores(scores: OnboardingScores): Point {
  let x = 0;
  let y = 0;
  let total = 0;

  AXES.forEach((axis, index) => {
    const unit = axisUnit(index);
    const score = scores[axis.key];
    x += unit.x * score;
    y += unit.y * score;
    total += score;
  });

  if (total <= 0) return { x: 0, y: 0 };

  const point = { x: x / total, y: y / total };
  const distance = Math.hypot(point.x, point.y);

  if (distance <= 0.88) return point;
  return { x: (point.x / distance) * 0.88, y: (point.y / distance) * 0.88 };
}

function scoresFromMarker(marker: Point): OnboardingScores {
  return AXES.reduce((next, axis, index) => {
    const unit = axisUnit(index);
    const dot = marker.x * unit.x + marker.y * unit.y;
    next[axis.key] = Math.round(clamp(Math.pow((dot + 1) / 2, 1.3) * 100));
    return next;
  }, {} as OnboardingScores);
}

function pointToSvg(point: Point, center: number, radiusPx: number) {
  return {
    x: center + point.x * radiusPx,
    y: center + point.y * radiusPx,
  };
}

function polygonPoints(scores: OnboardingScores, center: number, radiusPx: number) {
  return AXES
    .map((axis, index) => {
      const unit = axisUnit(index);
      const scoreRadius = (scores[axis.key] / 100) * radiusPx;
      return `${center + unit.x * scoreRadius},${center + unit.y * scoreRadius}`;
    })
    .join(' ');
}

function dominantAxis(scores: OnboardingScores) {
  return [...AXES].sort((a, b) => scores[b.key] - scores[a.key])[0];
}

function scoresForTimeFocus(timeFocus: OnboardingTimeFocus | null) {
  if (!timeFocus) return DEFAULT_SCORES;
  const preset = {
    building: PRESETS[0].scores,
    investing: PRESETS[2].scores,
    operating: PRESETS[1].scores,
    creating: { investor: 20, founder: 52, operator: 34, creator: 94, domain_specialist: 38, artist: 70 },
    performing: PRESETS[3].scores,
    specialising: PRESETS[4].scores,
  } satisfies Record<OnboardingTimeFocus, OnboardingScores>;
  return preset[timeFocus];
}

function ProgressRail({ step }: { step: number }) {
  return (
    <View style={styles.progressRail} accessibilityElementsHidden>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
      ))}
    </View>
  );
}

function ChoiceScreen<T extends string>({
  step,
  eyebrow,
  title,
  options,
  value,
  onSelect,
  onNext,
}: {
  step: number;
  eyebrow: string;
  title: string;
  options: Array<{ label: string; value: T }>;
  value: T | null;
  onSelect: (value: T) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.screen}>
      <ProgressRail step={step} />
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.choiceGrid}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(option.value);
              }}
              style={({ pressed }) => [
                styles.choiceCard,
                selected && styles.choiceCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!value}
        onPress={onNext}
        style={({ pressed }) => [styles.primaryButton, !value && styles.disabledButton, pressed && value && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function SignalMap({
  scores,
  onScoresChange,
}: {
  scores: OnboardingScores;
  onScoresChange: (scores: OnboardingScores) => void;
}) {
  const { width } = useWindowDimensions();
  const chartSize = Math.min(Math.max(width - spacing.xl * 2, 280), 350);
  const center = chartSize / 2;
  const radiusPx = chartSize * 0.34;
  const marker = markerFromScores(scores);
  const markerPoint = pointToSvg(marker, center, radiusPx);
  const dominant = dominantAxis(scores);

  const updateFromTouch = (x: number, y: number) => {
    const dx = x - center;
    const dy = y - center;
    const distance = Math.hypot(dx, dy);
    const boundedDistance = Math.min(distance, radiusPx * 0.95);
    const ratio = distance === 0 ? 0 : boundedDistance / distance;
    const nextMarker = {
      x: (dx * ratio) / radiusPx,
      y: (dy * ratio) / radiusPx,
    };
    onScoresChange(scoresFromMarker(nextMarker));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        Haptics.selectionAsync();
        updateFromTouch(event.nativeEvent.locationX, event.nativeEvent.locationY);
      },
      onPanResponderMove: (event) => {
        updateFromTouch(event.nativeEvent.locationX, event.nativeEvent.locationY);
      },
      onPanResponderRelease: () => Haptics.selectionAsync(),
    }),
  ).current;

  return (
    <View>
      <View
        {...panResponder.panHandlers}
        style={[styles.chartStage, { width: chartSize, height: chartSize }]}
        accessibilityRole="adjustable"
        accessibilityLabel={`AMARI signal map. Current strongest axis is ${dominant.label}.`}
      >
        <Svg width={chartSize} height={chartSize}>
          <Polygon
            points={AXES.map((_, index) => {
              const unit = axisUnit(index);
              return `${center + unit.x * radiusPx},${center + unit.y * radiusPx}`;
            }).join(' ')}
            fill="rgba(255,255,255,0.025)"
            stroke="rgba(196,162,101,0.32)"
            strokeWidth={1.2}
          />
          {[0.33, 0.66].map((ring) => (
            <Polygon
              key={ring}
              points={AXES.map((_, index) => {
                const unit = axisUnit(index);
                return `${center + unit.x * radiusPx * ring},${center + unit.y * radiusPx * ring}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
          {AXES.map((axis, index) => {
            const unit = axisUnit(index);
            const end = { x: center + unit.x * radiusPx, y: center + unit.y * radiusPx };
            const label = { x: center + unit.x * (radiusPx + 28), y: center + unit.y * (radiusPx + 28) };
            return (
              <G key={axis.key}>
                <Line
                  x1={center}
                  y1={center}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                />
                <Circle cx={end.x} cy={end.y} r={3.5} fill={axis.accent} />
                <SvgText
                  x={label.x}
                  y={label.y}
                  fill="rgba(255,255,255,0.72)"
                  fontSize={10}
                  fontFamily={typography.mono.regular}
                  textAnchor="middle"
                >
                  {axis.label}
                </SvgText>
              </G>
            );
          })}
          <Polygon
            points={polygonPoints(scores, center, radiusPx)}
            fill="rgba(196,162,101,0.28)"
            stroke={colors.gold}
            strokeWidth={2.4}
          />
          <Polygon
            points={polygonPoints(scores, center, radiusPx * 0.98)}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={0.8}
          />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.emblemHandle,
            {
              left: markerPoint.x - 24,
              top: markerPoint.y - 24,
            },
          ]}
        >
          <View style={styles.emblemHalo} />
          <AmariEmblem size={48} variant="onDark" fill={colors.cream} foreground={colors.black} borderRadius={9} />
        </View>
      </View>
      <Text style={styles.mapCaption}>
        Drag the A across the sharp map, or tune the numbers below.
      </Text>
    </View>
  );
}

function GraphScreen({
  scores,
  setScores,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  scores: OnboardingScores;
  setScores: (scores: OnboardingScores) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const dominant = dominantAxis(scores);

  const setAxisScore = (axis: OnboardingAxis, rawValue: string) => {
    const numeric = Number.parseInt(rawValue.replace(/\D/g, ''), 10);
    const nextValue = Number.isFinite(numeric) ? clamp(numeric) : 0;
    setScores({ ...scores, [axis]: nextValue });
  };

  return (
    <ScrollView
      style={styles.graphScroll}
      contentContainerStyle={styles.graphContent}
      showsVerticalScrollIndicator={false}
    >
      <ProgressRail step={3} />
      <Text style={styles.eyebrow}>Signal map</Text>
      <Text style={styles.title}>Move the A to map your builder energy.</Text>
      <Text style={styles.graphIntro}>
        Current strongest signal: <Text style={styles.graphIntroStrong}>{dominant.label}</Text>
      </Text>

      <SignalMap scores={scores} onScoresChange={setScores} />

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => {
              Haptics.selectionAsync();
              setScores(preset.scores);
            }}
            style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
          >
            <Text style={styles.presetText}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.axisInputs}>
        {AXES.map((axis) => (
          <View key={axis.key} style={styles.axisInputRow}>
            <View style={[styles.axisSwatch, { backgroundColor: axis.accent }]} />
            <Text style={styles.axisInputLabel}>{axis.label}</Text>
            <TextInput
              accessibilityLabel={`${axis.label} score`}
              keyboardType="number-pad"
              value={String(Math.round(scores[axis.key]))}
              onChangeText={(value) => setAxisScore(axis.key, value)}
              maxLength={3}
              style={styles.axisInput}
            />
          </View>
        ))}
      </View>

      <View style={styles.graphActions}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          disabled={isSubmitting}
          onPress={onSubmit}
          style={({ pressed }) => [styles.primaryButton, styles.submitButton, isSubmitting && styles.disabledButton, pressed && !isSubmitting && styles.pressed]}
        >
          {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Enter AMARI</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function PostAuthOnboardingScreen() {
  const router = useRouter();
  const submitOnboarding = useSubmitOnboarding();
  const [step, setStep] = useState(0);
  const [timeFocus, setTimeFocus] = useState<OnboardingTimeFocus | null>(null);
  const [currentStage, setCurrentStage] = useState<OnboardingWorkStage | null>(null);
  const [communityNeed, setCommunityNeed] = useState<OnboardingCommunityNeed | null>(null);
  const [scores, setScores] = useState<OnboardingScores>(DEFAULT_SCORES);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleTimeFocus = (value: OnboardingTimeFocus) => {
    setTimeFocus(value);
    setScores(scoresForTimeFocus(value));
  };

  const handleSubmit = async () => {
    if (!timeFocus || !currentStage || !communityNeed) return;

    try {
      await submitOnboarding.mutateAsync({
        scores,
        timeFocus,
        currentStage,
        communityNeed,
        consentVersion: CONSENT_VERSION,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Signal not saved', 'Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['rgba(196,162,101,0.18)', 'rgba(114,47,55,0.10)', 'rgba(10,10,10,0)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.noiseOverlay} pointerEvents="none" />

      {step === 0 && (
        <ChoiceScreen
          step={0}
          eyebrow="Question one"
          title="Where do you concentrate your time?"
          options={TIME_OPTIONS}
          value={timeFocus}
          onSelect={handleTimeFocus}
          onNext={goNext}
        />
      )}
      {step === 1 && (
        <ChoiceScreen
          step={1}
          eyebrow="Question two"
          title="What stage is your current work?"
          options={STAGE_OPTIONS}
          value={currentStage}
          onSelect={setCurrentStage}
          onNext={goNext}
        />
      )}
      {step === 2 && (
        <ChoiceScreen
          step={2}
          eyebrow="Question three"
          title="What are you looking for from AMARI?"
          options={NEED_OPTIONS}
          value={communityNeed}
          onSelect={setCommunityNeed}
          onNext={goNext}
        />
      )}
      {step === 3 && (
        <GraphScreen
          scores={scores}
          setScores={setScores}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          isSubmitting={submitOnboarding.isPending}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboard,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.018)',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  progressRail: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xxxl,
  },
  progressDot: {
    height: 4,
    width: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressDotActive: {
    backgroundColor: colors.gold,
  },
  eyebrow: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.sandOnDark,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.serif.bold,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.white,
    marginBottom: spacing.xxl,
  },
  choiceGrid: {
    gap: spacing.md,
  },
  choiceCard: {
    minHeight: 58,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  choiceCardSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(196,162,101,0.20)',
  },
  choiceText: {
    fontFamily: typography.body.semiBold,
    fontSize: 17,
    color: 'rgba(255,255,255,0.72)',
  },
  choiceTextSelected: {
    color: colors.white,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  primaryButtonText: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  graphScroll: {
    flex: 1,
  },
  graphContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: 42,
  },
  graphIntro: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.58)',
    marginTop: -spacing.lg,
    marginBottom: spacing.xl,
  },
  graphIntroStrong: {
    color: colors.goldLight,
    fontFamily: typography.body.bold,
  },
  chartStage: {
    alignSelf: 'center',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    overflow: 'hidden',
  },
  emblemHandle: {
    position: 'absolute',
    width: 48,
    height: 48,
  },
  emblemHalo: {
    position: 'absolute',
    left: -8,
    top: -8,
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(196,162,101,0.22)',
  },
  mapCaption: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  presetPill: {
    minHeight: 38,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  presetText: {
    fontFamily: typography.body.semiBold,
    color: colors.white,
    fontSize: 12,
  },
  axisInputs: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.24)',
    overflow: 'hidden',
  },
  axisInputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  axisSwatch: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  axisInputLabel: {
    flex: 1,
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  axisInput: {
    width: 58,
    height: 36,
    borderRadius: radius.md,
    textAlign: 'center',
    fontFamily: typography.mono.medium,
    fontSize: 13,
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  graphActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 0.6,
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  secondaryButtonText: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
  },
  submitButton: {
    flex: 1,
  },
});
