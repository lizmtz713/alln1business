import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const STALE_TIME = 30 * 1000;
const GC_TIME = 10 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
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
