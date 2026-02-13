import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/** 5 min: list/detail screens load instantly on revisit from cache */
const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: GC_TIME_MS,
            retry: (failureCount, error) => {
              const msg = String(error);
              if (/network|fetch failed|offline/i.test(msg)) return failureCount < 1;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
