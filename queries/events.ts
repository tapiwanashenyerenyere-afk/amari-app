import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export function useEvents(type?: string) {
  return useQuery({
    queryKey: queryKeys.events.list(type),
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.events,
  });
}

export function useEventDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_rsvps(count)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: staleTimes.events,
    enabled: !!id,
  });
}

export function useMyRsvps() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.events.myRsvps(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*, events(*)')
        .eq('member_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: staleTimes.events,
  });
}

export function useRsvpToEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const { data, error } = await supabase.rpc('rsvp_to_event', {
        p_event_id: eventId,
        p_member_id: user!.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
