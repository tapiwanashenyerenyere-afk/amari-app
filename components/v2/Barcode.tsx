import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

interface BarcodeProps {
  memberId: string;
}

const BAR_PATTERN = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 3, 1, 2, 1, 3, 2, 1, 1];

export function Barcode({ memberId }: BarcodeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {BAR_PATTERN.map((width, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width,
                backgroundColor: i % 5 === 2 ? colors.sand : colors.grayGhost,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.id}>{memberId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 1.5,
    height: 24,
    marginBottom: 2,
  },
  bar: {
    height: '100%',
    borderRadius: 1,
  },
  id: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.grayLight,
    textAlign: 'center',
  },
});
