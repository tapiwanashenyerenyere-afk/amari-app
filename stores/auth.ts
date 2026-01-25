// AMARI Auth Store
// Manages authentication state using Zustand

import { create } from 'zustand';
import { api, MemberProfile } from '../lib/api';

interface AuthState {
  token: string | null;
  member: MemberProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, member: MemberProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  member: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (token: string, member: MemberProfile) => {
    api.setToken(token);
    set({ token, member, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    api.setToken(null);
    set({ token: null, member: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;

    try {
      set({ isLoading: true });
      api.setToken(token);
      const member = await api.getProfile();
      set({ member, isAuthenticated: true });
    } catch (e) {
      // Token might be expired
      set({ token: null, member: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
