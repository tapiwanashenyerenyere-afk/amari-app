/**
 * AMARI Secure Storage
 *
 * SECURITY: Uses expo-secure-store for encrypted token storage.
 * Tokens are stored in the device's secure enclave (Keychain on iOS,
 * Keystore on Android) and are NOT accessible to other apps.
 *
 * On web, falls back to localStorage (less secure, but functional).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage keys - prefixed to avoid collisions
const KEYS = {
  AUTH_TOKEN: 'amari_auth_token',
  TOKEN_EXPIRES_AT: 'amari_token_expires',
} as const;

// Platform check - SecureStore doesn't work on web
const isWeb = Platform.OS === 'web';

// Web storage helpers (fallback for web platform)
const webStorage = {
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  deleteItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

/**
 * Store the authentication token securely
 *
 * @param token - The session token from the API
 * @param expiresAt - ISO string of token expiration
 */
export async function storeAuthToken(
  token: string,
  expiresAt: string
): Promise<void> {
  try {
    if (isWeb) {
      webStorage.setItem(KEYS.AUTH_TOKEN, token);
      webStorage.setItem(KEYS.TOKEN_EXPIRES_AT, expiresAt);
    } else {
      await Promise.all([
        SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token),
        SecureStore.setItemAsync(KEYS.TOKEN_EXPIRES_AT, expiresAt),
      ]);
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to store auth token:', error);
    // Don't throw - app can function without persistence
  }
}

/**
 * Retrieve the stored authentication token
 *
 * @returns The token and expiration, or null if not stored/expired
 */
export async function getAuthToken(): Promise<{
  token: string;
  expiresAt: string;
} | null> {
  try {
    let token: string | null;
    let expiresAt: string | null;

    if (isWeb) {
      token = webStorage.getItem(KEYS.AUTH_TOKEN);
      expiresAt = webStorage.getItem(KEYS.TOKEN_EXPIRES_AT);
    } else {
      [token, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(KEYS.TOKEN_EXPIRES_AT),
      ]);
    }

    if (!token || !expiresAt) {
      return null;
    }

    // Check if token has expired
    const expiration = new Date(expiresAt);
    if (expiration <= new Date()) {
      // Token expired - clean up
      await clearAuthToken();
      return null;
    }

    return { token, expiresAt };
  } catch (error) {
    console.error('[SecureStorage] Failed to retrieve auth token:', error);
    return null;
  }
}

/**
 * Clear the stored authentication token
 * Called on logout or when token is invalidated
 */
export async function clearAuthToken(): Promise<void> {
  try {
    if (isWeb) {
      webStorage.deleteItem(KEYS.AUTH_TOKEN);
      webStorage.deleteItem(KEYS.TOKEN_EXPIRES_AT);
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(KEYS.TOKEN_EXPIRES_AT),
      ]);
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to clear auth token:', error);
    // Don't throw - continue with logout even if clear fails
  }
}

/**
 * Check if secure storage is available on this device
 */
export async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    if (isWeb) {
      // On web, we use localStorage which is always available
      return typeof window !== 'undefined' && !!window.localStorage;
    }
    // Expo SecureStore throws on web, so this is a good availability check
    const testKey = '__amari_secure_test__';
    await SecureStore.setItemAsync(testKey, 'test');
    await SecureStore.deleteItemAsync(testKey);
    return true;
  } catch {
    return false;
  }
}
