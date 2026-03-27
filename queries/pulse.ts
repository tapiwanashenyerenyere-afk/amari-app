import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import type { PulseEdition } from '@/types/database';

export function useLatestPulse() {
  return useQuery({
    queryKey: queryKeys.pulse.latest(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pulse_feed', { p_limit: 1 });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as PulseEdition | null;
    },
    staleTime: staleTimes.pulse,
  });
}

export function usePulseEdition(id: number) {
  return useQuery({
    queryKey: queryKeys.pulse.edition(id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pulse_edition', { p_id: id });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as PulseEdition | null;
    },
    staleTime: staleTimes.pulse,
    enabled: !!id,
  });
}

export function usePulseFeed(limit = 8) {
  return useQuery({
    queryKey: queryKeys.pulse.feed(limit),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pulse_feed', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as PulseEdition[];
    },
    staleTime: staleTimes.pulse,
  });
}

export function usePulseMapSummary() {
  return useQuery({
    queryKey: queryKeys.pulse.mapSummary(),
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: totalCount, error: totalError }, { count: newCount, error: newError }] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('created_at', weekAgo),
      ]);

      if (totalError) throw totalError;
      if (newError) throw newError;

      return {
        total: totalCount ?? 0,
        newThisWeek: newCount ?? 0,
      };
    },
    staleTime: staleTimes.pulse,
  });
}
