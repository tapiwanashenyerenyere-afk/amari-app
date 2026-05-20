import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

interface AvatarStackProps {
  initials: string[];
  extra?: number;
  size?: number;
  borderColor?: string;
}

export function AvatarStack({ initials, extra, size = 20, borderColor = '#111' }: AvatarStackProps) {
  return (
    <View style={styles.stack}>
      {initials.map((letter, i) => (
        <View
          key={i}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor,
              marginLeft: i > 0 ? -(size * 0.3) : 0,
              zIndex: initials.length - i,
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.35 }]}>{letter}</Text>
        </View>
      ))}
      {extra !== undefined && extra > 0 && (
        <View
          style={[
            styles.avatar,
            styles.extraAvatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor,
              marginLeft: -(size * 0.3),
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.35 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: typography.body.regular,
    color: 'rgba(255,255,255,0.4)',
  },
  extraAvatar: {
    backgroundColor: 'rgba(160,133,107,0.12)',
  },
  extraText: {
    fontFamily: typography.body.regular,
    color: colors.sand,
  },
});
