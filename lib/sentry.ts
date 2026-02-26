// Sentry monitoring — install @sentry/react-native when ready
// npx expo install @sentry/react-native

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      profilesSampleRate: 0.1,
      environment: __DEV__ ? 'development' : 'production',
      enabled: !__DEV__,
    });
  } catch {
    console.log('Sentry not installed — monitoring disabled');
  }
}
