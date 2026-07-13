import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoids an immediate refetch-on-mount for data that was just
        // fetched moments ago (e.g. navigating back to a list view) —
        // 30s is a reasonable default for admin-panel data; individual
        // queries can override it once they exist.
        staleTime: 30 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Server: always return a new client — sharing one across requests would
 * leak data between users. Browser: return a stable singleton so
 * navigating between pages doesn't throw away the cache. This is
 * TanStack Query's own recommended pattern for the Next.js App Router.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
