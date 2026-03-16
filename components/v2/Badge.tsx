import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

interface BadgeProps {
  children: string;
}

export function Badge({ children }: BadgeProps) {
  return <Text style={styles.badge}>{children}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: colors.black,
    color: colors.white,
    fontFamily: typography.geo.medium,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.5,
    overflow: 'hidden',
  },
});
