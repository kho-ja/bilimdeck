/**
 * React Query client configuration
 * Provides caching, background refetching, and state management for API calls
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus (useful for keeping data fresh)
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
    },
  },
});
