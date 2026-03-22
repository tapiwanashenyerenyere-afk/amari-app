import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';

export type EventFilter = 'upcoming' | 'vibes' | 'dinner' | 'talk' | 'gala';

export function useEvents(filter: EventFilter = 'upcoming') {
  return useQuery({
    queryKey: queryKeys.events.list(filter),
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      if (filter !== 'upcoming') {
        query = query.eq('type', filter);
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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const { data, error } = await supabase.rpc('rsvp_to_event', {
        p_event_id: eventId,
      });
      if (error) throw error;
      return data;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
