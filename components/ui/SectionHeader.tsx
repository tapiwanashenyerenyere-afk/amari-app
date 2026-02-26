import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  delay?: number;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  delay = 0,
}: SectionHeaderProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
      style={styles.container}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={handlePress}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <ChevronRight size={14} color={COLORS.warmGray} strokeWidth={2} />
        </Pressable>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 18,
    color: COLORS.charcoal,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: COLORS.warmGray,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  actionLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: COLORS.warmGray,
    letterSpacing: 0.5,
  },
});
