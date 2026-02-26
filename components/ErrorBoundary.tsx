import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, S } from '@/lib/constants';

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
    padding: S._32,
    backgroundColor: C.cream,
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    color: C.textPrimary,
    marginBottom: S._8,
  },
  body: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 15,
    color: C.textTertiary,
    textAlign: 'center',
    marginBottom: S._24,
  },
  button: {
    paddingHorizontal: S._24,
    paddingVertical: S._12,
    backgroundColor: C.burgundy,
  },
  buttonText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 12,
    color: C.cream,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
