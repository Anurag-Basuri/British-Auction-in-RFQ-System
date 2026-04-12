'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../lib/api-error';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Auctions change rapidly, 30s is a safe default before background refetch
            staleTime: 30 * 1000,
            retry: (failureCount, error) => {
              // Don't retry validation or auth errors natively
              if (error instanceof ApiError && (error.isUnauthorized || error.isValidation)) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
