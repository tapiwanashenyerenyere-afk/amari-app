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
import { Platform } from 'react-native';

type MembershipTier = 'member' | 'silver' | 'platinum' | 'laureate';
type AdminRole = 'owner' | 'admin' | 'editor' | 'door_staff' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  tier: MembershipTier;
  isAdmin: boolean;
  isOwner: boolean;
  adminRole: AdminRole;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  tier: 'member',
  isAdmin: false,
  isOwner: false,
  adminRole: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    tier: 'member',
    isAdmin: false,
    isOwner: false,
    adminRole: null,
    isLoading: true,
  });
  const userMetadata = state.user?.user_metadata;

  function extractAccessFromAppMetadata(session: Session | null): {
    tier: MembershipTier;
    isAdmin: boolean;
    isOwner: boolean;
    adminRole: AdminRole;
  } {
    const appMeta = session?.user?.app_metadata;
    const adminRole = (appMeta?.admin_role as AdminRole) || null;
    const isAdmin = appMeta?.is_admin === true || adminRole !== null;
    return {
      tier: (appMeta?.tier as MembershipTier) || 'member',
      isAdmin,
      isOwner: adminRole === 'owner',
      adminRole,
    };
  }

  const resolveAccessFromSession = useCallback(async (session: Session | null) => {
    const fallback = extractAccessFromAppMetadata(session);

    if (!session?.user?.id) {
      return fallback;
    }

    try {
      const [{ data: member }, { data: adminRoleData, error: adminRoleError }] = await Promise.all([
        supabase
          .from('members')
          .select('tier')
          .eq('id', session.user.id)
          .maybeSingle(),
        (supabase as any).rpc('get_admin_role', { p_member_id: session.user.id }),
      ]);

      const adminRole = adminRoleError ? fallback.adminRole : ((adminRoleData as AdminRole) || null);
      const tier = (member?.tier as MembershipTier | undefined) || fallback.tier;
      const isAdmin = adminRole !== null || fallback.isAdmin;

      return {
        tier,
        isAdmin,
        isOwner: adminRole === 'owner',
        adminRole,
      };
    } catch (error) {
      console.warn('Access resolution fallback:', error);
      return fallback;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const { tier, isAdmin, isOwner, adminRole } = await resolveAccessFromSession(session);
      setState({
        session,
        user: session?.user ?? null,
        tier,
        isAdmin,
        isOwner,
        adminRole,
        isLoading: false,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        const { tier, isAdmin, isOwner, adminRole } = await resolveAccessFromSession(session);
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          tier,
          isAdmin,
          isOwner,
          adminRole,
          isLoading: false,
        }));
      })();

      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      }

      if (event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: queryKeys.corridor.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.aligned.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
        queryClient.invalidateQueries({ queryKey: queryKeys.invites.all });
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveAccessFromSession]);

  // Sync profile data from user_metadata / SecureStore to the members table.
  // Covers cases where the member row exists but has empty fields:
  //   - already_member (returning user with pending code)
  //   - Google sign-in (name from Google, city/industry empty)
  //   - Magic link opened on a different device (no SecureStore, but user_metadata has data)
  const syncProfileData = useCallback(async (
    userId: string,
    pendingData?: {
      fullName?: string;
      city?: string;
      industry?: string;
      currentProject?: string;
      skills?: string[];
      interests?: string[];
    },
  ) => {
    try {
      // Fetch current member row
      const { data: member, error: fetchError } = await supabase
        .from('members')
        .select('full_name, city, industry, current_project, skills, interests')
        .eq('id', userId)
        .single();

      if (fetchError || !member) return;

      const userMeta = userMetadata;
      const metaSkills = Array.isArray(userMeta?.skills) ? (userMeta.skills as string[]) : [];
      const metaInterests = Array.isArray(userMeta?.interests) ? (userMeta.interests as string[]) : [];

      // Build updates only for fields that are empty in the DB but available from sources
      const updates: Record<string, string | string[]> = {};

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

      if (!member.current_project) {
        const currentProject = pendingData?.currentProject || userMeta?.current_project;
        if (currentProject) updates.current_project = currentProject;
      }

      if (!Array.isArray(member.skills) || member.skills.length === 0) {
        const skills = pendingData?.skills?.length ? pendingData.skills : metaSkills;
        if (skills.length) updates.skills = skills;
      }

      if (!Array.isArray(member.interests) || member.interests.length === 0) {
        const interests = pendingData?.interests?.length ? pendingData.interests : metaInterests;
        if (interests.length) updates.interests = interests;
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

  const getPendingInvitePayload = useCallback(async () => {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem('pending_invitation_code');
    }

    return SecureStore.getItemAsync('pending_invitation_code');
  }, []);

  const clearPendingInvitePayload = useCallback(async () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('pending_invitation_code');
      return;
    }

    await SecureStore.deleteItemAsync('pending_invitation_code');
  }, []);

  // Redeem pending invitation code after sign-in
  const redeemingRef = useRef(false);
  useEffect(() => {
    if (!state.user || state.isLoading || redeemingRef.current) return;

    const redeemPendingCode = async () => {
      redeemingRef.current = true;
      try {
        const pending = await getPendingInvitePayload();
        if (!pending) {
          // No pending code — still sync user_metadata to profile in case fields are empty
          await syncProfileData(state.user!.id);
          redeemingRef.current = false;
          return;
        }
        const { code, fullName, city, industry, currentProject, skills, interests } = JSON.parse(pending);
        const profilePayload = { fullName, city, industry, currentProject, skills, interests };
        if (!code) {
          await syncProfileData(state.user!.id, profilePayload);
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
          await syncProfileData(state.user!.id, profilePayload);
          await clearPendingInvitePayload();
          // Refresh session so JWT reflects new tier + admin status
          const { data: refreshed } = await supabase.auth.refreshSession();
          const refreshedSession = refreshed.session ?? state.session;
          const access = await resolveAccessFromSession(refreshedSession);
          setState((prev) => ({
            ...prev,
            session: refreshedSession,
            user: refreshedSession?.user ?? prev.user,
            tier: access.tier,
            isAdmin: access.isAdmin,
            isOwner: access.isOwner,
            adminRole: access.adminRole,
            isLoading: false,
          }));
          // Invalidate profile cache so UI shows the new data immediately
          queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
        } else {
          if (data?.error === 'already_member') {
            // Member exists but might have empty profile fields — sync from SecureStore/user_metadata
            await syncProfileData(state.user!.id, profilePayload);
            await clearPendingInvitePayload();
          } else if (data?.error === 'invalid_or_expired') {
            await clearPendingInvitePayload();
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
  }, [clearPendingInvitePayload, getPendingInvitePayload, resolveAccessFromSession, state.isLoading, state.session, state.user, syncProfileData]);

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
