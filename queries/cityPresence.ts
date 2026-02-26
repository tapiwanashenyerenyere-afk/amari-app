import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useActiveCityPresence(city?: string) {
  return useQuery({
    queryKey: queryKeys.cityPresence.active(city),
    queryFn: async () => {
      let query = supabase
        .from('city_presence')
        .select('*, members(full_name, photo_url, industry, title)')
        .eq('is_active', true);

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.cityPresence,
    refetchInterval: 60 * 1000, // Poll every 60 seconds
  });
}

export function useTogglePresence() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ city, isActive }: { city: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('city_presence')
        .upsert({
          member_id: user!.id,
          city,
          is_active: isActive,
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cityPresence.all });
    },
  });
}
