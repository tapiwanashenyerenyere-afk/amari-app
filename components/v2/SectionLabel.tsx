import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

interface SectionLabelProps {
  children: string;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.geo.medium,
    fontSize: typography.sizes.sectionLabel,
    letterSpacing: typography.spacing.sectionLabel,
    color: colors.sand,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
});
