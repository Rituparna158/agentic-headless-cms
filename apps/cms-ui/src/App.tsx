import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthLayout } from './components/Layout/AuthLayout';
import { AuthGuard } from './components/Guard/AuthGuard';
import { AuthHydrator } from './components/Guard/AuthHydrator';

const LoginPage = React.lazy(() =>
  import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const AccessDeniedPage = React.lazy(() =>
  import('./pages/AccessDenied/AccessDeniedPage').then((m) => ({
    default: m.AccessDeniedPage,
  })),
);
const DashboardLayout = React.lazy(() =>
  import('./components/Layout/DashboardLayout').then((m) => ({
    default: m.DashboardLayout,
  })),
);
const DashboardHome = React.lazy(() =>
  import('./pages/Dashboard/DashboardHome').then((m) => ({
    default: m.DashboardHome,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const FullPageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthHydrator>
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/access-denied" element={<AccessDeniedPage />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<AuthGuard />}>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AuthHydrator>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
