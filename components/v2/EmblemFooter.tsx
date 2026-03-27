import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@/lib/theme';
import { AmariEmblem } from './AmariEmblem';

export function EmblemFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.emblemWrap}>
        <AmariEmblem size={42} variant="light" borderRadius={6} />
      </View>
      <Text style={styles.wordmark}>AMARI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  emblemWrap: {
    opacity: 0.12,
  },
  wordmark: {
    marginTop: 10,
    fontFamily: typography.body.semiBold,
    fontSize: 9,
    color: 'rgba(0,0,0,0.08)',
    letterSpacing: 4,
  },
});
