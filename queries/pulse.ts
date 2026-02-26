import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';
import { TIER_LEVELS } from '@/lib/constants';

export function useLatestPulse() {
  const { tier } = useAuth();
  const tierLevel = TIER_LEVELS[tier];

  return useQuery({
    queryKey: queryKeys.pulse.latest(),
    queryFn: async () => {
      // All members see headline; silver+ sees summary; platinum+ sees full
      let query = supabase
        .from('pulse_editions')
        .select('id, publish_date, headline, stats, hero_image_path')
        .eq('status', 'published')
        .order('publish_date', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await query;
      if (error) throw error;

      // Fetch tier-specific content separately
      let content = null;
      if (tierLevel >= 3) {
        // Platinum+: full content
        const { data: full } = await supabase
          .from('pulse_editions')
          .select('full_content, summary_content')
          .eq('id', data.id)
          .single();
        content = full;
      } else if (tierLevel >= 2) {
        // Silver: summary only
        const { data: summary } = await supabase
          .from('pulse_editions')
          .select('summary_content')
          .eq('id', data.id)
          .single();
        content = summary;
      }

      return { ...data, ...content };
    },
    staleTime: staleTimes.pulse,
  });
}

export function usePulseEdition(id: number) {
  return useQuery({
    queryKey: queryKeys.pulse.edition(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulse_editions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.pulse,
    enabled: !!id,
  });
}
