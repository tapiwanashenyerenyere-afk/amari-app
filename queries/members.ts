import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useMyProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.member.me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: staleTimes.member,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      bio?: string;
      industry?: string;
      city?: string;
      company?: string;
      title?: string;
      photo_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.member.me });
    },
  });
}
