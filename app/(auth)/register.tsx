import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string; inviter: string }>();

  const [form, setForm] = useState({
    name: '',
    email: '',
    building: '', // What I'm building
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit registration to API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to main app after successful registration
      router.replace('/(tabs)');
    } catch (err) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Invite confirmation */}
          <View style={styles.inviteConfirm}>
            <View style={styles.checkBadge}>
              <Check size={16} color={COLORS.charcoal} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.inviteText}>Invite code verified</Text>
              <Text style={styles.inviterText}>Invited by {params.inviter}</Text>
            </View>
          </View>

          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>
            Complete your profile to join.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                placeholder="Enter your name"
                placeholderTextColor="rgba(248, 246, 243, 0.3)"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                placeholder="you@email.com"
                placeholderTextColor="rgba(248, 246, 243, 0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* What I'm Building */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>WHAT ARE YOU BUILDING? (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.building}
                onChangeText={(v) => updateField('building', v)}
                placeholder="Tell us about your work, projects, or ambitions..."
                placeholderTextColor="rgba(248, 246, 243, 0.3)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Submit error */}
          {errors.submit && (
            <Text style={styles.submitError}>{errors.submit}</Text>
          )}

          {/* Submit button */}
          <Pressable
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel="Complete registration"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.charcoal} />
            ) : (
              <Text style={styles.submitButtonText}>JOIN AMARI</Text>
            )}
          </Pressable>

          <Text style={styles.termsText}>
            Excellence. Community. Legacy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  inviteConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    marginBottom: 32,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#10b981',
  },
  inviterText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: 'rgba(248, 246, 243, 0.6)',
    marginTop: 2,
  },
  title: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: 'rgba(248, 246, 243, 0.6)',
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(248, 246, 243, 0.5)',
  },
  input: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 246, 243, 0.2)',
    paddingVertical: 12,
  },
  inputError: {
    borderBottomColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 246, 243, 0.2)',
    paddingHorizontal: 12,
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#ef4444',
  },
  submitError: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: COLORS.cream,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.charcoal,
  },
  termsText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: 'rgba(248, 246, 243, 0.4)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
