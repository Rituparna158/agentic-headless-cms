import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            CMS UI Application
          </h1>
          <p className="text-gray-600">Enterprise React 19 + Vite Setup</p>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
