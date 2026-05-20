import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '@/lib/theme';

interface EditFieldModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  label: string;
  currentValue: string;
  placeholder?: string;
  multiline?: boolean;
  isSaving?: boolean;
}

export function EditFieldModal({
  visible,
  onClose,
  onSave,
  label,
  currentValue,
  placeholder,
  multiline = false,
  isSaving = false,
}: EditFieldModalProps) {
  const [value, setValue] = useState(currentValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(currentValue);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, currentValue]);

  const handleSave = () => {
    if (value.trim() === currentValue) {
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(value.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.content}>
            {/* Grip bar */}
            <View style={styles.handle} />

            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Input */}
            <TextInput
              ref={inputRef}
              style={[styles.input, multiline && styles.inputMultiline]}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
              placeholderTextColor={colors.grayLight}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              selectionColor={colors.sand}
              autoCapitalize="sentences"
              returnKeyType={multiline ? 'default' : 'done'}
              onSubmitEditing={multiline ? undefined : handleSave}
            />

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                onPress={onClose}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.bone,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.xxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    color: colors.sand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  input: {
    fontFamily: typography.serif.regular,
    fontSize: 17,
    color: colors.black,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 52,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  cancelText: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.sand,
  },
  saveText: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },
});
