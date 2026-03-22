import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  PropsWithChildren,
} from 'react';
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
  const userMetadata = state.user?.user_metadata;

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

      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      }

      if (event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: queryKeys.corridor.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.aligned.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync profile data from user_metadata / SecureStore to the members table.
  // Covers cases where the member row exists but has empty fields:
  //   - already_member (returning user with pending code)
  //   - Google sign-in (name from Google, city/industry empty)
  //   - Magic link opened on a different device (no SecureStore, but user_metadata has data)
  const syncProfileData = useCallback(async (
    userId: string,
    pendingData?: { fullName?: string; city?: string; industry?: string },
  ) => {
    try {
      // Fetch current member row
      const { data: member, error: fetchError } = await supabase
        .from('members')
        .select('full_name, city, industry')
        .eq('id', userId)
        .single();

      if (fetchError || !member) return;

      const userMeta = userMetadata;

      // Build updates only for fields that are empty in the DB but available from sources
      const updates: Record<string, string> = {};

      if (!member.full_name || member.full_name === 'AMARI Member') {
        const name = pendingData?.fullName || userMeta?.full_name || userMeta?.name;
        if (name) updates.full_name = name;
      }

      if (!member.city) {
        const city = pendingData?.city || userMeta?.city;
        if (city) updates.city = city;
      }

      if (!member.industry) {
        const industry = pendingData?.industry || userMeta?.industry;
        if (industry) updates.industry = industry;
      }

      if (Object.keys(updates).length === 0) return;

      const { error: updateError } = await supabase
        .from('members')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('Profile sync error:', updateError);
      } else {
        // Invalidate cached profile so the UI picks up the new data
        queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
      }
    } catch (err) {
      console.error('Profile sync error:', err);
    }
  }, [userMetadata]);

  // Redeem pending invitation code after sign-in
  const redeemingRef = useRef(false);
  useEffect(() => {
    if (!state.user || state.isLoading || redeemingRef.current) return;

    const redeemPendingCode = async () => {
      redeemingRef.current = true;
      try {
        const pending = await SecureStore.getItemAsync('pending_invitation_code');
        if (!pending) {
          // No pending code — still sync user_metadata to profile in case fields are empty
          await syncProfileData(state.user!.id);
          redeemingRef.current = false;
          return;
        }
        const { code, fullName, city, industry } = JSON.parse(pending);
        if (!code) {
          await syncProfileData(state.user!.id, { fullName, city, industry });
          redeemingRef.current = false;
          return;
        }

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
          // Invalidate profile cache so UI shows the new data immediately
          queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
        } else {
          if (data?.error === 'already_member') {
            // Member exists but might have empty profile fields — sync from SecureStore/user_metadata
            await syncProfileData(state.user!.id, { fullName, city, industry });
            await SecureStore.deleteItemAsync('pending_invitation_code');
          } else if (data?.error === 'invalid_or_expired') {
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
  }, [state.isLoading, state.user, syncProfileData]);

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
  }, [state.user]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
