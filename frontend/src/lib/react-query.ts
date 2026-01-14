import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - data is considered fresh for 30s
      gcTime: 1000 * 60 * 5, // 5 minutes - keep unused data in cache for 5 min
      retry: 1,
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchInterval: false, // No automatic polling by default (can be overridden per query)
    },
    mutations: {
      retry: 0,
    },
  },
});
