import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@/lib/theme';

interface Props { children: React.ReactNode; screen?: string; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.screen}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            We've been notified and are looking into it.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.buttonText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.bone,
  },
  title: {
    fontFamily: typography.geo.bold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.serif.regular,
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  button: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.sand,
    borderRadius: radius.md,
  },
  buttonText: {
    fontFamily: typography.geo.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
