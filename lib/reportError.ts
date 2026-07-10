// Central error reporting entry point. Routes to Sentry when it's active
// (see lib/sentry.ts), otherwise falls back to console.error with the same
// structured shape. Never throws — this must be safe to call from anywhere,
// including inside other error handlers.

import { captureException, isSentryActive } from './sentry';

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  try {
    if (isSentryActive()) {
      captureException(error, context);
      return;
    }
  } catch {
    // Fall through to console logging below.
  }

  try {
    console.error('[reportError]', { error, ...context });
  } catch {
    // Reporting must never itself throw.
  }
}

/**
 * Routes uncaught JS errors through reportError via React Native's global
 * ErrorUtils. Guards for ErrorUtils' existence, so this is a safe no-op on
 * web (and any environment where it isn't present). Never throws.
 */
export function installGlobalErrorHandler(): void {
  try {
    const globalAny = global as unknown as {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
      };
    };

    const errorUtils = globalAny.ErrorUtils;
    if (!errorUtils || typeof errorUtils.setGlobalHandler !== 'function') {
      return; // Not on React Native (e.g. web) — safe no-op.
    }

    const previousHandler =
      typeof errorUtils.getGlobalHandler === 'function' ? errorUtils.getGlobalHandler() : undefined;

    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      reportError(error, { isFatal, source: 'globalErrorHandler' });
      if (typeof previousHandler === 'function') {
        previousHandler(error, isFatal);
      }
    });
  } catch {
    // Installation must never throw.
  }
}
