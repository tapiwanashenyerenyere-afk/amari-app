import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../lib/theme';

interface TagProps {
  children: string;
  variant?: 'sand' | 'ghost';
}

export function Tag({ children, variant = 'sand' }: TagProps) {
  return (
    <Text style={[styles.tag, variant === 'sand' ? styles.sand : styles.ghost]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 4,
  },
  sand: {
    color: colors.sand,
    backgroundColor: colors.sandLight,
  },
  ghost: {
    color: colors.gray,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});
