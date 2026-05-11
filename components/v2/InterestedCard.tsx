import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, typography } from '@/lib/theme';

interface InterestedCardProps {
  category: string;
  title: string;
  author: string;
  notifyLabel?: string;
  onPress?: () => void;
}

export function InterestedCard({
  category,
  title,
  author,
  notifyLabel = 'Notifications on',
  onPress,
}: InterestedCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open ${title}` : undefined}
    >
      <View style={styles.iconWrap}>
        <Svg width={18} height={22} viewBox="0 0 18 22" fill="none" color={colors.gold}>
          <Path
            d="M1 1h16v20l-8-4.5L1 21V1z"
            stroke="currentColor"
            strokeWidth={1.2}
            fill="rgba(196,162,101,0.1)"
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{category.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.author}>{author}</Text>
        <Text style={styles.notify}>{notifyLabel.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: colors.cream,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: colors.warm,
    borderColor: 'rgba(196,162,101,0.12)',
  },
  iconWrap: {
    opacity: 0.35,
  },
  content: {
    flex: 1,
  },
  category: {
    marginBottom: 2,
    fontFamily: typography.mono.regular,
    fontSize: 7,
    color: colors.goldDark,
    letterSpacing: 2,
    opacity: 0.62,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.black,
  },
  author: {
    marginTop: 3,
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: 'rgba(0,0,0,0.48)',
  },
  notify: {
    marginTop: 2,
    fontFamily: typography.mono.regular,
    fontSize: 7,
    color: colors.goldDark,
    letterSpacing: 1,
    opacity: 0.55,
  },
});
