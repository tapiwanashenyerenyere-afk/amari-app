import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { queryKeys } from '../lib/queryClient';

// Express interest in an opportunity
export function useExpressInterest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: number) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('corridor_interests')
        .insert({ member_id: user.id, opportunity_id: opportunityId });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint — already expressed
          return { alreadyExpressed: true };
        }
        throw error;
      }
      return { alreadyExpressed: false };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['corridor-activity'] });
      queryClient.invalidateQueries({ queryKey: ['corridor-interest-check'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.corridor.all });
    },
    onError: (err: Error) => {
      Alert.alert('Error', 'Could not express interest. Please try again.');
      console.error('Express interest error:', err);
    },
  });
}

// Get current user's corridor activity
export function useCorridorActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corridor-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('corridor_interests')
        .select(`
          id,
          status,
          expressed_at,
          opportunity:corridor_opportunities (
            id, title, type, closing_date, min_tier
          )
        `)
        .eq('member_id', user.id)
        .order('expressed_at', { ascending: false });

      if (error) throw error;

      // Supabase returns joined rows; normalize opportunity from array to single object
      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        opportunity: Array.isArray(row.opportunity) ? row.opportunity[0] ?? null : row.opportunity ?? null,
      }));
    },
    enabled: !!user?.id,
  });
}

// Check if user already expressed interest in a specific opportunity
export function useHasExpressedInterest(opportunityId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corridor-interest-check', user?.id, opportunityId],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data } = await supabase
        .from('corridor_interests')
        .select('id')
        .eq('member_id', user.id)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      return !!data;
    },
    enabled: !!user?.id,
  });
}
