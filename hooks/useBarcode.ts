import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useBarcode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.member.barcode,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_barcode_token', {
        p_member_id: user!.id,
      });
      if (error) throw error;
      return data as { token: string; expires_at: string };
    },
    enabled: !!user,
    staleTime: staleTimes.barcode,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
