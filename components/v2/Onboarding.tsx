import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, radius, spacing } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { AmariEmblem } from './AmariEmblem';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Constellation Dot ──────────────────────────────────
function ConstellationDot({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const r = 32 + Math.random() * 22;
  const size = 2 + Math.random() * 2.5;
  const duration = 1000 + Math.random() * 1200;

  return (
    <MotiView
      from={{ opacity: 0.25 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration,
        delay: index * 100,
        loop: true,
        repeatReverse: true,
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        left: 60 + Math.cos(angle) * r,
        top: 60 + Math.sin(angle) * r,
      }}
    />
  );
}

// ─── Step Components ────────────────────────────────────

function Step0() {
  const dots = Array.from({ length: 14 }, (_, i) => i);
  return (
    <View style={[stepStyles.center, { backgroundColor: colors.void }]}>
      <View style={{ position: 'relative', width: 120, height: 120 }}>
        {dots.map((i) => (
          <ConstellationDot key={i} index={i} total={14} />
        ))}
      </View>
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700, delay: 1000 }}
        style={{ marginTop: 32 }}
      >
        <Text style={stepStyles.initiating}>INITIATING</Text>
      </MotiView>
    </View>
  );
}

function Step1() {
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    lineWidth.value = withDelay(500, withTiming(32, { duration: 400, easing: Easing.ease }));
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
    height: 1,
    backgroundColor: colors.sand,
    alignSelf: 'center',
  }));

  return (
    <View style={[stepStyles.center, { backgroundColor: colors.onboard }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(160,133,107,0.07)', 'transparent']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 100 }}
      >
        <AmariEmblem variant="onDark" size={80} />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 300 }}
        style={{ marginTop: 22 }}
      >
        <Text style={stepStyles.amariWord}>AMARI</Text>
      </MotiView>
      <Animated.View style={[lineStyle, { marginTop: 16 }]} />
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 800 }}
        style={{ marginTop: 16 }}
      >
        <Text style={stepStyles.forAlchemists}>FOR THE ALCHEMISTS</Text>
      </MotiView>
    </View>
  );
}

function Step2() {
  return (
    <View style={[stepStyles.center, { backgroundColor: colors.onboard }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(160,133,107,0.05)', 'transparent']}
          start={{ x: 0.3, y: 0.35 }}
          end={{ x: 0.7, y: 0.65 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 100 }}
        style={{ width: '100%', paddingHorizontal: 32 }}
      >
        <Text style={stepStyles.manifesto}>
          A private{'\n'}collective for{'\n'}the{' '}
          <Text style={{ color: colors.sand }}>paradigm-{'\n'}shifters</Text>
        </Text>
        <Text style={stepStyles.manifestoSub}>
          The builders. The operators.{'\n'}The troublemakers. The ones who{'\n'}define what comes
          next.
        </Text>
      </MotiView>
    </View>
  );
}

const FEATURES = [
  { letter: 'P', name: 'The Pulse', desc: 'Weekly editorial intelligence' },
  { letter: 'A', name: 'Aligned', desc: 'Where two paths find their intersection' },
  { letter: 'E', name: 'Events', desc: 'From intimate dinners to the Annual Gala' },
  { letter: 'C', name: 'The Corridor', desc: 'Where opportunity is exchanged behind closed doors' },
];

function Step3() {
  return (
    <View style={[stepStyles.topAligned, { backgroundColor: colors.onboard }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(160,133,107,0.04)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={{ width: '100%', paddingHorizontal: 32 }}>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
        >
          <Text style={stepStyles.whatAwaits}>What awaits</Text>
        </MotiView>
        {FEATURES.map((f, i) => (
          <MotiView
            key={f.letter}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 + i * 120 }}
            style={stepStyles.featureRow}
          >
            <View style={stepStyles.featureIcon}>
              <Text style={stepStyles.featureLetter}>{f.letter}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stepStyles.featureName}>{f.name}</Text>
              <Text style={stepStyles.featureDesc}>{f.desc}</Text>
            </View>
          </MotiView>
        ))}
      </View>
    </View>
  );
}

interface Step4Props {
  onEnter: (validatedCode: string) => void;
  onSignIn: () => void;
}

function Step4({ onEnter, onSignIn }: Step4Props) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleValidate = async () => {
    if (code.length < 4) {
      setError('Please enter a valid invite code');
      return;
    }

    setError('');
    setIsValidating(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_code', {
        p_code: code.toUpperCase(),
      });

      if (rpcError) throw rpcError;

      if (data?.error === 'rate_limited') {
        setError('Too many attempts. Please wait an hour.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!data?.valid) {
        setError('Invalid or expired invitation code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsValid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        onEnter(code.toUpperCase());
      }, 600);
    } catch (err) {
      console.error('Validation failed:', err);
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <View style={[stepStyles.center, { backgroundColor: colors.onboard }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(160,133,107,0.05)', 'transparent']}
          start={{ x: 0.5, y: 0.55 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={{ width: '100%', paddingHorizontal: 32 }}>
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
        >
          <Text style={stepStyles.inviteTitle}>You've been invited</Text>
          <Text style={stepStyles.inviteSub}>Enter your code to join the collective.</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          style={{ marginBottom: 28 }}
        >
          <TextInput
            ref={inputRef}
            style={[
              stepStyles.codeFullInput,
              isValid && { borderColor: colors.sand },
              error ? { borderColor: colors.error } : null,
            ]}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              setError('');
              setIsValid(false);
            }}
            placeholder="AMARI-XXXX-XXX"
            placeholderTextColor="rgba(255,255,255,0.15)"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error ? (
            <Text style={stepStyles.errorText}>{error}</Text>
          ) : isValid ? (
            <Text style={stepStyles.successText}>Code verified</Text>
          ) : null}
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleValidate();
            }}
            disabled={isValidating || isValid || code.length < 4}
            style={({ pressed }) => [
              stepStyles.enterBtn,
              (isValidating || isValid || code.length < 4) && { opacity: 0.6 },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={stepStyles.enterBtnText}>
                {isValid ? 'Verified' : 'Enter the Convergence'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={onSignIn} style={{ marginTop: 14 }}>
            <Text style={stepStyles.signInText}>
              Already a member? <Text style={{ color: colors.sand }}>Sign in</Text>
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </View>
  );
}

// ─── Main Onboarding Component ──────────────────────────

interface OnboardingProps {
  onComplete: (validatedCode: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  // Auto-advance Step 0 after 2.2 seconds
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => setCurrentStep(1), 2200);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete('');
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={obStyles.container}>
      {/* Step content */}
      {currentStep === 0 && <Step0 />}
      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
      {currentStep === 3 && <Step3 />}
      {currentStep === 4 && <Step4 onEnter={onComplete} onSignIn={() => onComplete('')} />}

      {/* Navigation footer (hidden on step 0 and step 4) */}
      {currentStep > 0 && !isLastStep && (
        <View style={obStyles.footer}>
          {/* Dots */}
          <View style={obStyles.dots}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                style={[
                  obStyles.dot,
                  i === currentStep && obStyles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Continue button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [obStyles.continueBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={obStyles.continueBtnText}>Continue</Text>
          </Pressable>

          {/* Skip */}
          <Pressable onPress={handleSkip}>
            <Text style={obStyles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const stepStyles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  topAligned: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 100,
    padding: 0,
  },
  initiating: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.1)',
    letterSpacing: 4,
  },
  amariWord: {
    fontFamily: typography.geo.semiBold,
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 8,
    textAlign: 'center',
  },
  forAlchemists: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    color: colors.sandOnDark,
    letterSpacing: 4,
    textAlign: 'center',
  },
  manifesto: {
    fontFamily: typography.serif.medium,
    fontSize: 36,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 43,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  manifestoSub: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 24,
    marginTop: 18,
    textAlign: 'left',
  },
  whatAwaits: {
    fontFamily: typography.serif.medium,
    fontSize: 26,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(160,133,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureLetter: {
    fontFamily: typography.serif.medium,
    fontSize: 17,
    color: colors.sandOnDark,
    fontWeight: '500',
  },
  featureName: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  featureDesc: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    lineHeight: 17,
  },
  inviteTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  inviteSub: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 28,
  },
  codeFullInput: {
    fontFamily: typography.body.medium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 4,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.xl,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.success,
    marginTop: 8,
    textAlign: 'center',
  },
  enterBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.sand,
    alignItems: 'center',
  },
  enterBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
  signInText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },
});

const obStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
    zIndex: 55,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.sand,
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.sand,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
  skipText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
  },
});
