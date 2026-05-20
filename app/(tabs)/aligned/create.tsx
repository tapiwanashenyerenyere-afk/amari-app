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
import { colors, typography, spacing, radius, TIER_LEVELS } from '../../../lib/theme';
import { useCreateTile } from '../../../hooks/useCreateTile';
import { useAuth } from '../../../providers/AuthProvider';

const PROJECT_TAG_OPTIONS = [
  'AI/ML', 'Fintech', 'HealthTech', 'EdTech', 'CleanTech',
  'Culture', 'E-Commerce', 'Legal', 'Marketing', 'Data Science',
  'Operations', 'Engineering', 'Design', 'Community',
];

const INTEREST_TAG_OPTIONS = [
  'Ethics', 'Investing', 'Climate', 'Policy', 'Design',
  'Culture', 'Mentorship', 'Startups', 'Wellness', 'Advocacy',
  'Community', 'Technology',
];

const VISIBILITY_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'silver', label: 'Silver' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'laureate', label: 'Laureate' },
] as const;

export default function CreateTileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tier } = useAuth();
  const { pickImage, createTile, loading } = useCreateTile();

  const [tileType, setTileType] = useState<'project' | 'interest'>('project');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contactEnabled, setContactEnabled] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<Array<'member' | 'silver' | 'platinum' | 'laureate'>>([
    'platinum',
    'laureate',
  ]);

  const tagOptions = tileType === 'project' ? PROJECT_TAG_OPTIONS : INTEREST_TAG_OPTIONS;
  const charCount = description.length;
  const maxChars = 150;
  const canCreate = (TIER_LEVELS[tier as keyof typeof TIER_LEVELS] ?? 0) >= TIER_LEVELS.silver;

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 4
        ? [...prev, tag]
        : prev
    );
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await pickImage();
    if (uri) setImageUri(uri);
  };

  const toggleVisibility = (value: 'member' | 'silver' | 'platinum' | 'laureate') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVisibility((prev) =>
      prev.includes(value)
        ? prev.filter((tierValue) => tierValue !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Describe what you are building or what you care about.');
      return;
    }
    if (selectedTags.length === 0) {
      Alert.alert('Missing tags', 'Select at least one tag.');
      return;
    }
    if (tileType === 'project' && !location.trim()) {
      Alert.alert('Missing location', 'Add a city, region, or Remote so members can see where this project is based.');
      return;
    }
    if (selectedVisibility.length === 0) {
      Alert.alert('Missing audience', 'Select at least one membership level that can view this tile.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await createTile({
      type: tileType,
      description,
      tags: selectedTags,
      location,
      visibilityTiers: selectedVisibility,
      contactEnabled,
      imageUri,
    });

    if (result.success) {
      const message = result.moderationStatus === 'pending'
        ? 'Your tile has been submitted for approval. You will see it on your profile once it is reviewed.'
        : 'Your tile is now live in Aligned for the memberships you selected.';
      Alert.alert('Tile created', message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (!canCreate) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Tile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.gateWrap}>
          <Text style={styles.gateTitle}>Aligned publishing opens from Silver membership.</Text>
          <Text style={styles.gateCopy}>
            You can explore Aligned on your current membership, but publishing a project or interest requires Silver, Platinum, or Laureate access.
          </Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>New Tile</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Type selector */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeBtn, tileType === 'project' && styles.typeBtnActive]}
              onPress={() => {
                setTileType('project');
                setSelectedTags([]);
                setContactEnabled(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select project type"
            >
              <Text
                style={[styles.typeBtnText, tileType === 'project' && styles.typeBtnTextActive]}
              >
                Project
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeBtn, tileType === 'interest' && styles.typeBtnActive]}
              onPress={() => {
                setTileType('interest');
                setSelectedTags([]);
                setContactEnabled(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select interest type"
            >
              <Text
                style={[styles.typeBtnText, tileType === 'interest' && styles.typeBtnTextActive]}
              >
                Interest
              </Text>
            </Pressable>
          </View>

          <View style={styles.publishNote}>
            <Text style={styles.publishNoteTitle}>
              {tileType === 'project' ? 'Project publishing is reviewed' : 'Interest tiles build your match graph'}
            </Text>
            <Text style={styles.publishNoteCopy}>
              {tileType === 'project'
                ? 'AMARI reviews projects before they appear in Aligned. Once approved, your selected tiers can discover it, tap Align, and contact you by email if you allow it.'
                : 'Interests help members find shared context. They also give Aligned better signals for future recommendations.'}
            </Text>
          </View>

          {/* Image upload */}
          <Text style={styles.label}>
            Image <Text style={styles.labelHint}>(optional)</Text>
          </Text>
          <Pressable style={styles.imageUpload} onPress={handlePickImage} accessibilityRole="button" accessibilityLabel="Upload image">
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <LinearGradient
                colors={['#1C1815', '#111111']}
                style={styles.imagePlaceholder}
              >
                <Text style={styles.imagePlaceholderIcon}>+</Text>
                <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
              </LinearGradient>
            )}
          </Pressable>

          {/* Description */}
          <Text style={styles.label}>
            {tileType === 'project' ? 'What are you building?' : 'What do you care about?'}
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={
                tileType === 'project'
                  ? 'One sentence about your project...'
                  : 'One sentence about what interests you...'
              }
              placeholderTextColor={colors.grayLight}
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, maxChars))}
              multiline
              maxLength={maxChars}
            />
            <Text style={[styles.charCount, charCount > 130 && styles.charCountWarn]}>
              {charCount}/{maxChars}
            </Text>
          </View>

          <Text style={styles.label}>
            Location <Text style={styles.labelHint}>{tileType === 'project' ? '(required for map)' : '(optional)'}</Text>
          </Text>
          <View style={styles.locationInputWrap}>
            <TextInput
              style={styles.locationInput}
              placeholder={tileType === 'project' ? 'Melbourne, Lagos, Remote...' : 'Melbourne, Global, Remote...'}
              placeholderTextColor={colors.grayLight}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Tags */}
          <Text style={styles.label}>
            Tags <Text style={styles.labelHint}>(up to 4)</Text>
          </Text>
          <View style={styles.tagsWrap}>
            {tagOptions.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.tagPill, active && styles.tagPillActive]}
                  onPress={() => toggleTag(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`${active ? 'Remove' : 'Add'} ${tag} tag`}
                >
                  <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            Who can see this? <Text style={styles.labelHint}>(choose one or more)</Text>
          </Text>
          <View style={styles.tagsWrap}>
            {VISIBILITY_OPTIONS.map((option) => {
              const active = selectedVisibility.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  style={[styles.tagPill, active && styles.tagPillActive]}
                  onPress={() => toggleVisibility(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`${active ? 'Remove' : 'Add'} ${option.label} audience`}
                >
                  <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tileType === 'project' ? (
            <>
              <Text style={styles.label}>
                Email Contact <Text style={styles.labelHint}>(required choice)</Text>
              </Text>
              <View style={styles.consentCard}>
                <Text style={styles.consentTitle}>Do you want members to contact you about this project?</Text>
                <Text style={styles.consentCopy}>
                  If enabled, AMARI will open the member&apos;s installed email app such as Gmail, Outlook, Yahoo, or Apple Mail. There will be no in-app messaging for this project.
                </Text>
                <View style={styles.typeRow}>
                  <Pressable
                    style={[styles.typeBtn, !contactEnabled && styles.typeBtnActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setContactEnabled(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Do not allow email contact for this project"
                  >
                    <Text style={[styles.typeBtnText, !contactEnabled && styles.typeBtnTextActive]}>
                      Not Yet
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.typeBtn, contactEnabled && styles.typeBtnActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setContactEnabled(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Allow email contact for this project"
                  >
                    <Text style={[styles.typeBtnText, contactEnabled && styles.typeBtnTextActive]}>
                      Yes, Allow Email
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Creating tile' : 'Create tile'}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Creating...' : 'Create Tile'}
            </Text>
          </Pressable>
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  gateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
  },
  gateTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    color: colors.black,
    lineHeight: 32,
  },
  gateCopy: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    marginTop: 10,
  },

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
  publishNote: {
    marginTop: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.white,
    padding: 16,
    gap: 6,
  },
  publishNoteTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.black,
    lineHeight: 19,
  },
  publishNoteCopy: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
  },
  consentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.white,
    padding: 16,
    gap: 10,
  },
  consentTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  consentCopy: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
  },

  // Type selector
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  typeBtnText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.gray,
  },
  typeBtnTextActive: {
    color: colors.bone,
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

  // Text input
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: 14,
    minHeight: 100,
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
  locationInputWrap: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  locationInput: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.black,
    padding: 14,
  },

  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: 'transparent',
  },
  tagPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  tagPillText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
  tagPillTextActive: {
    color: colors.bone,
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
});
