import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';
import { TIER_LEVELS } from '@/lib/constants';

interface PulseEditionRecord {
  id: number;
  publish_date: string;
  headline: string;
  stats: Record<string, unknown> | null;
  hero_image_path: string | null;
  summary_content?: unknown;
  full_content?: unknown;
}

async function fetchPulseContentByTier(
  id: number,
  tierLevel: number,
): Promise<Pick<PulseEditionRecord, 'summary_content' | 'full_content'> | null> {
  if (tierLevel >= 3) {
    const { data, error } = await supabase
      .from('pulse_editions')
      .select('full_content, summary_content')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  if (tierLevel >= 2) {
    const { data, error } = await supabase
      .from('pulse_editions')
      .select('summary_content')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  return null;
}

export function useLatestPulse() {
  const { tier } = useAuth();
  const tierLevel = TIER_LEVELS[tier];

  return useQuery({
    queryKey: queryKeys.pulse.latest(),
    queryFn: async (): Promise<PulseEditionRecord> => {
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

      const content = await fetchPulseContentByTier(data.id, tierLevel);

      return { ...data, ...(content ?? {}) } as PulseEditionRecord;
    },
    staleTime: staleTimes.pulse,
  });
}

export function usePulseEdition(id: number) {
  const { tier } = useAuth();
  const tierLevel = TIER_LEVELS[tier];

  return useQuery({
    queryKey: queryKeys.pulse.edition(id),
    queryFn: async (): Promise<PulseEditionRecord> => {
      const { data, error } = await supabase
        .from('pulse_editions')
        .select('id, publish_date, headline, stats, hero_image_path')
        .eq('status', 'published')
        .eq('id', id)
        .single();
      if (error) throw error;

      const content = await fetchPulseContentByTier(id, tierLevel);
      return { ...data, ...(content ?? {}) } as PulseEditionRecord;
    },
    staleTime: staleTimes.pulse,
    enabled: !!id,
  });
}
