import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';
import type { Event, EventType } from '@/types/database';

export type EventQueryScope = 'upcoming' | 'past' | 'all';

interface UseEventsOptions {
  scope?: EventQueryScope;
  type?: EventType | 'all';
}

export function useEvents(options: UseEventsOptions = {}) {
  const scope = options.scope ?? 'upcoming';
  const type = options.type ?? 'all';

  return useQuery({
    queryKey: queryKeys.events.list(scope, type),
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from('events')
        .select('*');

      if (scope === 'upcoming') {
        query = query
          .gte('starts_at', now)
          .order('starts_at', { ascending: true });
      } else if (scope === 'past') {
        query = query
          .lt('starts_at', now)
          .order('starts_at', { ascending: false });
      } else {
        query = query.order('starts_at', { ascending: true });
      }

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Event[];
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
