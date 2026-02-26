import { create } from 'zustand';
import type { MembershipTier } from '@/lib/constants';

interface AuthStore {
  memberId: string | null;
  tier: MembershipTier;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setAuth: (memberId: string, tier: MembershipTier, isAdmin: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  memberId: null,
  tier: 'member',
  isAdmin: false,
  isAuthenticated: false,
  setAuth: (memberId, tier, isAdmin) =>
    set({ memberId, tier, isAdmin, isAuthenticated: true }),
  clear: () =>
    set({ memberId: null, tier: 'member', isAdmin: false, isAuthenticated: false }),
}));
