import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
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
