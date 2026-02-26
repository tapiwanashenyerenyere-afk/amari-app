import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useCorridorOpportunities(type?: string) {
  return useQuery({
    queryKey: queryKeys.corridor.list(type),
    queryFn: async () => {
      let query = supabase
        .from('corridor_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.corridor,
  });
}

export function useCorridorDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.corridor.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corridor_opportunities')
        .select('*, corridor_interests(count)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.corridor,
    enabled: !!id,
  });
}

export function useExpressInterest() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, message }: { opportunityId: number; message?: string }) => {
      const { data, error } = await supabase
        .from('corridor_interests')
        .insert({
          opportunity_id: opportunityId,
          member_id: user!.id,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.corridor.all });
    },
  });
}
