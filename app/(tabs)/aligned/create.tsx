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
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../../../lib/theme';
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
      Alert.alert('Missing name', 'Give your project a name.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Describe your project in one sentence.');
      return;
    }
    if (!category) {
      Alert.alert('Missing category', 'Select a category for your project.');
      return;
    }
    if (!region) {
      Alert.alert('Missing region', 'Select the region where your project is based.');
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
      Alert.alert(
        'Project submitted',
        'Your project is pending review. It will appear on the map once approved.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
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
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Project</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image upload */}
          <Text style={styles.label}>
            Cover image <Text style={styles.labelHint}>(optional)</Text>
          </Text>
          <Pressable
            style={styles.imageUpload}
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Upload cover image"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <LinearGradient
                colors={['#1C1815', '#111111']}
                style={styles.imagePlaceholder}
              >
                <Text style={styles.imagePlaceholderIcon}>+</Text>
                <Text style={styles.imagePlaceholderText}>Tap to add</Text>
              </LinearGradient>
            )}
          </Pressable>

          {/* Project name */}
          <Text style={styles.label}>Project name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Diaspora Capital Fund"
            placeholderTextColor={colors.grayLight}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="One sentence about your project..."
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

          {/* Category */}
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

          {/* Region */}
          <Text style={styles.label}>Region</Text>
          <RegionPicker selectedRegion={region} onSelect={setRegion} />
          <Text style={styles.regionNote}>
            Australia is always stored and displayed at state level for member privacy.
          </Text>

          {/* External link */}
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

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Submitting project' : 'Submit for review'}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Submitting...' : 'Submit for Review'}
            </Text>
          </Pressable>

          <Text style={styles.reviewNote}>
            Projects are reviewed before appearing on the map. You will be
            notified once approved.
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },

  // Labels
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

  // Image upload
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePlaceholderIcon: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
  },
  imagePlaceholderText: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },

  // Name input
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

  // Text input
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 14,
    minHeight: 80,
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
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
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

  // Category
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

  // Submit
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
