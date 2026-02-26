/**
 * AMARI Auth Store
 *
 * SECURITY: Uses Zustand for state management with expo-secure-store
 * for encrypted token persistence across app restarts.
 */

import { create } from 'zustand';
import { api, MemberProfile } from '../lib/api';
import {
  storeAuthToken,
  getAuthToken,
  clearAuthToken,
} from '../lib/secureStorage';

interface AuthState {
  token: string | null;
  member: MemberProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // True after initial hydration attempt

  // Actions
  setAuth: (token: string, member: MemberProfile, expiresAt: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  member: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * Set authentication state and persist token securely
   */
  setAuth: async (token: string, member: MemberProfile, expiresAt: string) => {
    // Update API client
    api.setToken(token);

    // Update store state
    set({ token, member, isAuthenticated: true });

    // SECURITY: Persist token in secure storage
    await storeAuthToken(token, expiresAt);
  },

  /**
   * Log out and clear all auth state
   */
  logout: async () => {
    try {
      // Call API logout (invalidates server-side session)
      await api.logout();
    } catch (e) {
      // Ignore logout API errors - continue with local cleanup
    }

    // Clear API client token
    api.setToken(null);

    // Clear secure storage
    await clearAuthToken();

    // Clear store state
    set({
      token: null,
      member: null,
      isAuthenticated: false,
    });
  },

  /**
   * Refresh the current user's profile from the API
   */
  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;

    try {
      set({ isLoading: true });
      api.setToken(token);
      const member = await api.getProfile();
      set({ member, isAuthenticated: true });
    } catch (e) {
      // Token might be expired or invalid
      // Clear auth state to trigger re-login
      await get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Hydrate auth state from secure storage on app launch
   *
   * SECURITY: Called once at app startup to restore session
   * from encrypted device storage.
   */
  hydrate: async () => {
    // Prevent multiple hydration attempts
    if (get().isInitialized) return;

    try {
      set({ isLoading: true });

      // Retrieve stored token
      const stored = await getAuthToken();

      if (!stored) {
        // No stored token - user needs to log in
        set({ isInitialized: true, isLoading: false });
        return;
      }

      // Set token in API client
      api.setToken(stored.token);

      // Validate token by fetching profile
      try {
        const member = await api.getProfile();
        set({
          token: stored.token,
          member,
          isAuthenticated: true,
          isInitialized: true,
        });
      } catch (e) {
        // Token is invalid or expired
        await clearAuthToken();
        api.setToken(null);
        set({ isInitialized: true });
      }
    } catch (e) {
      console.error('[AuthStore] Hydration failed:', e);
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));
