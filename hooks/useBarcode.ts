import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useBarcode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['member', 'barcode', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_barcode_token');
      if (error) throw error;
      const result = data as { token: string; expires_at: string };
      if (!result?.token || !result?.expires_at) {
        throw new Error('Invalid barcode response: missing token or expires_at');
      }
      return result;
    },
    enabled: !!user,
    staleTime: staleTimes.barcode,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
