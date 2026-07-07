import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ImagePlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../../../lib/theme';
import { AmbientGradient, PressableScale } from '../../../components/v2';
import { hapticOutcome } from '../../../lib/motion';
import { RegionPicker } from '../../../components/aligned/RegionPicker';
import { useCreateProject } from '../../../hooks/useCreateProject';
import type { ProjectCategory, RegionCentroid } from '../../../types/database';

const CATEGORIES: { key: ProjectCategory; label: string; accent: string }[] = [
  { key: 'venture', label: 'Venture', accent: '#C9A962' },
  { key: 'advisory', label: 'Advisory', accent: '#722F37' },
  { key: 'creative', label: 'Creative', accent: '#C9A962' },
  { key: 'impact', label: 'Impact', accent: '#722F37' },
  { key: 'culture', label: 'Culture', accent: '#C9A962' },
  { key: 'health', label: 'Health', accent: '#722F37' },
  { key: 'tech', label: 'Tech', accent: '#C9A962' },
];

const MAX_CHARS = 100;

export default function CreateProjectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pickImage, createProject, loading } = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory | null>(null);
  const [region, setRegion] = useState<RegionCentroid | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');

  const charCount = description.length;

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await pickImage();
    if (uri) setImageUri(uri);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Give your work a name. It sits on the cover.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Describe the work in one strong sentence.');
      return;
    }
    if (!category) {
      Alert.alert('Missing category', 'Select a category for your work.');
      return;
    }
    if (!region) {
      Alert.alert('Missing region', 'Select the region where this work is based.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await createProject({
      name,
      description,
      category,
      regionId: region.id,
      imageUri,
      externalLink: externalLink.trim() || null,
    });

    if (success) {
      hapticOutcome(true);
      Alert.alert(
        'Submitted for review',
        'Your work is with the desk. Once approved it joins the map and the board, and your journal opens for updates.',
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } else {
      hapticOutcome(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New work</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 128, 148) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* The cover is the work. Name is written on it, poster-style. */}
          <View style={styles.coverCard}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} />
            ) : (
              <LinearGradient colors={['#1C1815', '#0F0D0A', '#141210']} style={StyleSheet.absoluteFillObject}>
                <AmbientGradient intensity={0.07} size={260} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={['rgba(10,10,10,0.05)', 'rgba(10,10,10,0.0)', 'rgba(10,10,10,0.82)']}
              style={StyleSheet.absoluteFillObject}
            />

            <Pressable
              onPress={handlePickImage}
              style={styles.coverPick}
              accessibilityRole="button"
              accessibilityLabel={imageUri ? 'Change cover image' : 'Add cover image'}
            >
              <ImagePlus color="rgba(255,255,255,0.85)" size={15} strokeWidth={2} />
              <Text style={styles.coverPickText}>{imageUri ? 'Change cover' : 'Add cover'}</Text>
            </Pressable>

            <View style={styles.coverTitleWrap}>
              <Text style={styles.coverEyebrow}>
                {category ? CATEGORIES.find((c) => c.key === category)?.label.toUpperCase() : 'YOUR WORK'}
              </Text>
              <TextInput
                style={styles.coverTitleInput}
                placeholder="Name the work"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={name}
                onChangeText={setName}
                maxLength={60}
                multiline
              />
            </View>
          </View>

          {/* One strong sentence */}
          <Text style={styles.label}>The one-liner</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="What is this work, in one strong sentence?"
              placeholderTextColor={colors.grayLight}
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, MAX_CHARS))}
              multiline
              maxLength={MAX_CHARS}
            />
            <Text
              style={[styles.charCount, charCount > 85 && styles.charCountWarn]}
            >
              {charCount}/{MAX_CHARS}
            </Text>
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryWrap}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: colors.black, borderColor: colors.black },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat.key);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {isActive && (
                    <View
                      style={[styles.categoryDot, { backgroundColor: cat.accent }]}
                    />
                  )}
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && { color: colors.white },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Region</Text>
          <RegionPicker selectedRegion={region} onSelect={setRegion} />
          <Text style={styles.regionNote}>
            Australia is always stored and displayed at state level for member privacy.
          </Text>

          <Text style={styles.label}>
            External link <Text style={styles.labelHint}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.nameInput}
            placeholder="https://..."
            placeholderTextColor={colors.grayLight}
            value={externalLink}
            onChangeText={setExternalLink}
            keyboardType="url"
            autoCapitalize="none"
          />

          <PressableScale
            disabled={loading}
            onPress={handleSubmit}
            style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Submitting project' : 'Submit for review'}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submitting…' : 'Submit for review'}
            </Text>
          </PressableScale>

          <Text style={styles.reviewNote}>
            The desk reviews every submission before it appears. Once approved, your journal opens for progress updates.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: colors.gray, marginTop: -2 },
  headerTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 20,
    color: colors.black,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },

  coverCard: {
    height: 300,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.cardBase,
  },
  coverPick: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  coverPickText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.white,
  },
  coverTitleWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
  },
  coverEyebrow: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  coverTitleInput: {
    fontFamily: typography.body.bold,
    fontSize: 26,
    lineHeight: 31,
    color: colors.white,
    letterSpacing: -0.4,
    padding: 0,
  },

  label: {
    fontFamily: typography.geo.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.black,
    marginTop: 24,
    marginBottom: 10,
  },
  labelHint: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    letterSpacing: 0,
    textTransform: 'none',
    color: colors.gray,
  },

  nameInput: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.black,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 14,
    minHeight: 96,
  },
  regionNote: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },
  textInput: {
    fontFamily: typography.body.regular,
    fontSize: 16,
    color: colors.black,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.grayLight,
    textAlign: 'right',
    marginTop: 8,
  },
  charCountWarn: {
    color: colors.warning,
  },

  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },

  submitBtn: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.bone,
  },
  reviewNote: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
