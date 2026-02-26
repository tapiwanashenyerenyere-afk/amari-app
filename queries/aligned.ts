import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useCurrentMatch() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.aligned.current(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aligned_matches')
        .select('*')
        .or(`member_a.eq.${user!.id},member_b.eq.${user!.id}`)
        .in('stage', ['new', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (!data) return null;

      // Get the other member's profile
      const otherId = data.member_a === user!.id ? data.member_b : data.member_a;
      const myDecision = data.member_a === user!.id ? data.a_decision : data.b_decision;

      // Stage determines what info to show
      let otherMember = null;
      if (data.stage === 'revealed' || data.stage === 'accepted') {
        const { data: member } = await supabase
          .from('members')
          .select('id, full_name, photo_url, industry, city, company, title, bio')
          .eq('id', otherId)
          .single();
        otherMember = member;
      } else {
        // New stage: only show limited info
        const { data: member } = await supabase
          .from('members')
          .select('id, industry, city')
          .eq('id', otherId)
          .single();
        otherMember = member;
      }

      return { ...data, otherMember, myDecision };
    },
    enabled: !!user,
    staleTime: staleTimes.aligned,
  });
}

export function useAlignedDecide() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, decision }: { matchId: number; decision: 'accept' | 'pass' }) => {
      const { data, error } = await supabase.rpc('aligned_decide', {
        p_match_id: matchId,
        p_member_id: user!.id,
        p_decision: decision,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aligned.all });
    },
  });
}
