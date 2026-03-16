import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from './TabIcons';
import { colors, typography } from '../../lib/theme';

interface InfoRowProps {
  label: string;
  value: string;
  rightElement?: 'chevron' | 'toggle' | React.ReactNode;
  isLast?: boolean;
}

export function InfoRow({ label, value, rightElement = 'chevron', isLast }: InfoRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.border]}>
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {rightElement === 'chevron' && <ChevronRight color="#DDDDDD" />}
      {rightElement === 'toggle' && (
        <View style={styles.toggle} accessibilityRole="switch" accessibilityLabel={`${label} toggle`} accessibilityState={{ checked: true }}>
          <View style={styles.toggleThumb} />
        </View>
      )}
      {rightElement !== 'chevron' && rightElement !== 'toggle' && rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  left: {
    flex: 1,
  },
  label: {
    fontFamily: typography.geo.medium,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sand,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
