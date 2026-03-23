import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export type InviteTierGrant = 'member' | 'silver' | 'platinum';

export interface MonthlyInviteRecord {
  id: number;
  code: string;
  code_prefix: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  tier_grant: InviteTierGrant;
  issued_at: string | null;
  used_at: string | null;
}

export interface MonthlyInviteStatus {
  success: boolean;
  eligible: boolean;
  tier: 'member' | 'silver' | 'platinum' | 'laureate';
  quota_total: number;
  quota_used: number;
  remaining: number;
  month_key: string;
  should_show_announcement: boolean;
  allowed_tiers: InviteTierGrant[];
  invites: MonthlyInviteRecord[];
}

export interface CreateMonthlyInviteInput {
  recipientName: string;
  recipientEmail: string;
  tierGrant: InviteTierGrant;
}

export function useMonthlyInviteStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.invites.status(),
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_monthly_invite_status');
      if (error) {
        throw error;
      }
      return (data ?? null) as MonthlyInviteStatus | null;
    },
    enabled: !!user,
    staleTime: staleTimes.invites,
  });
}

export function useAcknowledgeMonthlyInviteAnnouncement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('acknowledge_monthly_invite_announcement');
      if (error) {
        throw error;
      }
      return data as { success: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.invites.all });
    },
  });
}

export function useCreateMonthlyInvite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMonthlyInviteInput) => {
      const { data, error } = await (supabase as any).rpc('create_monthly_invite', {
        p_recipient_name: input.recipientName,
        p_recipient_email: input.recipientEmail,
        p_tier: input.tierGrant,
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error ?? 'Could not create invite');
      }

      return data as {
        success: true;
        code: string;
        recipient_name: string;
        recipient_email: string;
        tier_grant: InviteTierGrant;
        remaining: number;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.invites.all });
    },
  });
}
