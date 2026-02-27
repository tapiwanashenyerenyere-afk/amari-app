import { createContext, useContext, useEffect, useRef, useState, PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { queryClient, queryKeys } from '@/lib/queryClient';

type MembershipTier = 'member' | 'silver' | 'platinum' | 'laureate';

interface AuthState {
  session: Session | null;
  user: User | null;
  tier: MembershipTier;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null, user: null, tier: 'member', isAdmin: false, isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    session: null, user: null, tier: 'member', isAdmin: false, isLoading: true,
  });

  function extractTierFromSession(session: Session | null): { tier: MembershipTier; isAdmin: boolean } {
    const appMeta = session?.user?.app_metadata;
    return {
      tier: (appMeta?.tier as MembershipTier) || 'member',
      isAdmin: appMeta?.is_admin === true,
    };
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const { tier, isAdmin } = extractTierFromSession(session);
      setState({ session, user: session?.user ?? null, tier, isAdmin, isLoading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const { tier, isAdmin } = extractTierFromSession(session);
      setState(prev => ({ ...prev, session, user: session?.user ?? null, tier, isAdmin, isLoading: false }));

      if (event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: queryKeys.corridor.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.aligned.all });
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redeem pending invitation code after sign-in
  const redeemingRef = useRef(false);
  useEffect(() => {
    if (!state.user || state.isLoading || redeemingRef.current) return;

    const redeemPendingCode = async () => {
      try {
        const pending = await SecureStore.getItemAsync('pending_invitation_code');
        if (!pending) return;

        redeemingRef.current = true;
        const { code, fullName, city, industry } = JSON.parse(pending);
        if (!code) return;

        const { data, error } = await supabase.rpc('redeem_invitation_code', {
          p_code: code,
          p_user_id: state.user!.id,
          p_full_name: fullName || state.user!.user_metadata?.full_name || 'AMARI Member',
          p_email: state.user!.email!,
          p_city: city || null,
          p_industry: industry || null,
        });

        if (error) {
          console.error('Code redemption RPC error:', error);
          return;
        }

        if (data?.success) {
          await SecureStore.deleteItemAsync('pending_invitation_code');
          // Refresh session so JWT reflects new tier + admin status
          await supabase.auth.refreshSession();
        } else {
          if (data?.error === 'already_member' || data?.error === 'invalid_or_expired') {
            await SecureStore.deleteItemAsync('pending_invitation_code');
          }
          console.warn('Code redemption failed:', data?.error);
        }
      } catch (err) {
        console.error('Code redemption error:', err);
      } finally {
        redeemingRef.current = false;
      }
    };

    redeemPendingCode();
  }, [state.user?.id, state.isLoading]);

  // Listen for tier change notifications via Supabase Realtime
  useEffect(() => {
    if (!state.user) return;

    const channel = supabase
      .channel('tier-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `member_id=eq.${state.user.id}`,
        },
        async (payload: any) => {
          if (payload.new.type === 'tier_change') {
            await supabase.auth.refreshSession();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.user?.id]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
