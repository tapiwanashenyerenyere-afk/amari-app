import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

export const queryKeys = {
  pulse: {
    all: ['pulse'] as const,
    latest: () => [...queryKeys.pulse.all, 'latest'] as const,
    edition: (id: number) => [...queryKeys.pulse.all, id] as const,
  },
  events: {
    all: ['events'] as const,
    list: (type?: string) => [...queryKeys.events.all, 'list', type] as const,
    detail: (id: number) => [...queryKeys.events.all, id] as const,
    myRsvps: () => [...queryKeys.events.all, 'my-rsvps'] as const,
  },
  corridor: {
    all: ['corridor'] as const,
    list: (type?: string) => [...queryKeys.corridor.all, 'list', type] as const,
    detail: (id: number) => [...queryKeys.corridor.all, id] as const,
  },
  aligned: {
    all: ['aligned'] as const,
    current: () => [...queryKeys.aligned.all, 'current'] as const,
    match: (id: number) => [...queryKeys.aligned.all, id] as const,
  },
  cityPresence: {
    all: ['city-presence'] as const,
    active: (city?: string) => [...queryKeys.cityPresence.all, 'active', city] as const,
  },
  member: {
    me: ['member', 'me'] as const,
    barcode: ['member', 'barcode'] as const,
  },
};

export const staleTimes = {
  pulse: 10 * 60 * 1000,
  events: 5 * 60 * 1000,
  corridor: 5 * 60 * 1000,
  aligned: 30 * 1000,
  cityPresence: 60 * 1000,
  barcode: 12 * 60 * 60 * 1000,
  member: 5 * 60 * 1000,
};
