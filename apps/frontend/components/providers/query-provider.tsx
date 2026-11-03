'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { env } from '@/lib/env';

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState (not useMemo) guarantees the client is only created once per
  // component instance, even under React Strict Mode's double-invoke —
  // useMemo isn't guaranteed to skip re-running for a given render.
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
