/**
 * AMARI Mobile Configuration
 *
 * Environment-based configuration for the mobile app.
 * Values are read from app.config.js via Expo's Constants.
 *
 * SECURITY: In production builds, API URL must be HTTPS.
 */

import Constants from 'expo-constants';

// Get environment from Expo config extra
const extra = Constants.expoConfig?.extra || {};

interface Config {
  // API Configuration
  apiBaseUrl: string;

  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get the API base URL based on environment
 *
 * Priority:
 * 1. Expo config extra (app.config.js)
 * 2. Development default (localhost)
 *
 * SECURITY: Validates HTTPS requirement in production
 */
function getApiBaseUrl(): string {
  const isDev = __DEV__;

  // From Expo config (production/staging)
  if (extra.apiBaseUrl) {
    const url = extra.apiBaseUrl as string;

    // SECURITY: Require HTTPS in production - ENFORCED
    if (!isDev && !url.startsWith('https://')) {
      throw new Error(
        'SECURITY: API URL must use HTTPS in production builds. ' +
        'Set API_BASE_URL environment variable with https:// prefix.'
      );
    }

    return url;
  }

  // Development fallback
  if (isDev) {
    // Note: For physical device testing, update this to your machine's IP
    // or use app.config.js to set API_BASE_URL
    return 'http://localhost:3002/api/v1';
  }

  // Production without config - use Railway deployment
  console.warn(
    '[Config] WARNING: API_BASE_URL not explicitly configured.',
    'Using Railway production URL.'
  );

  // Return Railway production URL
  return 'https://amari-api-production.up.railway.app/api/v1';
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

const apiBaseUrl = getApiBaseUrl();

// Validate URL format
if (!isValidUrl(apiBaseUrl)) {
  console.error('[Config] ERROR: Invalid API URL format:', apiBaseUrl);
}

export const config: Config = {
  apiBaseUrl,
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
};

// DEMO MODE: Set to true to bypass backend and use mock data
export const DEMO_MODE = true;

// For debugging - only in development with redacted URL
if (__DEV__) {
  const redactedUrl = config.apiBaseUrl.replace(/\/\/[^/]+/, '//***');
  console.log('[Config] Environment: development');
  console.log('[Config] API Base URL:', redactedUrl);
}
