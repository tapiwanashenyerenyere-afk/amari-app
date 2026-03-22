import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';
import type { MembershipTier } from '@/types/db-helpers';

export interface AlignedDiscoveryTile {
  id: string;
  type: 'project' | 'interest';
  description: string;
  tags: string[];
  location: string | null;
  image_url: string | null;
  image_path: string | null;
  owner_tier: MembershipTier;
  created_at: string;
}

export interface AlignedConnection {
  id: string;
  connected_at: string;
  matched_via: 'project' | 'interest';
  other_member_id: string;
  full_name: string;
  title: string | null;
  company: string | null;
  city: string | null;
  photo_url: string | null;
  tier: MembershipTier;
}

export interface AlignedRevealMember {
  id: string;
  full_name: string;
  title: string | null;
  company: string | null;
  city: string | null;
  photo_url: string | null;
  tier: MembershipTier;
}

export interface AlignedInterestResult {
  success: boolean;
  already_expressed: boolean;
  mutual: boolean;
  connection_id: string | null;
  revealed_member: AlignedRevealMember | null;
  error?: string;
}

export function useAlignedDiscoveryTiles(type: 'project' | 'interest') {
  return useQuery({
    queryKey: queryKeys.aligned.discovery(type),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('aligned_discovery_tiles', {
        p_type: type,
      });

      if (error) {
        throw error;
      }

      return (data ?? []) as AlignedDiscoveryTile[];
    },
    staleTime: staleTimes.aligned,
  });
}

export function useAlignedConnections(limit = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.aligned.connections(limit),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_aligned_connections', {
        p_limit: limit,
      });

      if (error) {
        throw error;
      }

      return (data ?? []) as AlignedConnection[];
    },
    enabled: !!user,
    staleTime: staleTimes.aligned,
  });
}

export function useExpressAlignedInterest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tileId: string) => {
      const { data, error } = await supabase.rpc('aligned_express_interest', {
        p_tile_id: tileId,
      });

      if (error) {
        throw error;
      }

      const result = (data ?? {}) as Partial<AlignedInterestResult>;
      if (!result.success) {
        throw new Error(result.error ?? 'Could not express interest');
      }

      return {
        success: true,
        already_expressed: !!result.already_expressed,
        mutual: !!result.mutual,
        connection_id: result.connection_id ?? null,
        revealed_member: result.revealed_member ?? null,
      } satisfies AlignedInterestResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aligned.all });
    },
  });
}

export function useSkipAlignedTile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tileId: string) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('aligned_skips')
        .insert({ user_id: user.id, tile_id: tileId });

      if (error && error.code !== '23505') {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aligned.all });
    },
  });
}
