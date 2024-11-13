'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AppQueryClientProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1 * 1_000,
            refetchOnMount: true,
            refetchOnWindowFocus: false
          }
        }
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default AppQueryClientProvider;
