import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthLayout } from './components/Layout/AuthLayout';
import { AuthGuard } from './components/Guard/AuthGuard';
import { AuthHydrator } from './components/Guard/AuthHydrator';
import { RoleGuard } from './components/Guard/RoleGuard';
import { AdminOrSupportGuard } from './components/Guard/AdminOrSupportGuard';
const LoginPage = React.lazy(() =>
  import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const AccessDeniedPage = React.lazy(() =>
  import('./pages/AccessDenied/AccessDeniedPage').then((m) => ({
    default: m.AccessDeniedPage,
  })),
);
const ForgotPasswordPage = React.lazy(() =>
  import('./pages/ForgotPassword/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = React.lazy(() =>
  import('./pages/ResetPassword/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const AcceptInvitePage = React.lazy(() =>
  import('./pages/AcceptInvite/AcceptInvitePage').then((m) => ({
    default: m.AcceptInvitePage,
  })),
);
const MfaResetCompletePage = React.lazy(() =>
  import('./pages/MfaResetComplete/MfaResetCompletePage').then((m) => ({
    default: m.MfaResetCompletePage,
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
const RolesAccessPage = React.lazy(() =>
  import('./features/access/pages/RolesAccessPage').then((m) => ({
    default: m.RolesAccessPage,
  })),
);
const UsersAccessPage = React.lazy(() =>
  import('./features/access/pages/UsersAccessPage').then((m) => ({
    default: m.UsersAccessPage,
  })),
);
const SecurityPage = React.lazy(() =>
  import('./pages/Security/SecurityPage').then((m) => ({
    default: m.SecurityPage,
  })),
);
const RequestAccessPage = React.lazy(() =>
  import('./pages/RequestAccess/RequestAccessPage').then((m) => ({
    default: m.RequestAccessPage,
  })),
);
const MfaRequestsPage = React.lazy(() =>
  import('./features/access/pages/MfaRequestsPage').then((m) => ({
    default: m.MfaRequestsPage,
  })),
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFound/NotFoundPage').then((m) => ({
    default: m.NotFoundPage,
  })),
);
const GeneralErrorPage = React.lazy(() =>
  import('./pages/GeneralError/GeneralErrorPage').then((m) => ({
    default: m.GeneralErrorPage,
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
    <ErrorBoundary fallback={<GeneralErrorPage />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthHydrator>
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/access-denied" element={<AccessDeniedPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route
                    path="/mfa-reset-complete"
                    element={<MfaResetCompletePage />}
                  />
                  <Route
                    path="/request-access"
                    element={<RequestAccessPage />}
                  />
                </Route>
                {/* Protected Routes */}
                <Route element={<AuthGuard />}>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route
                      element={<RoleGuard requiredCapability="manage_users" />}
                    >
                      <Route path="users" element={<UsersAccessPage />} />
                      <Route path="users/roles" element={<RolesAccessPage />} />
                    </Route>
                    <Route element={<AdminOrSupportGuard />}>
                      <Route
                        path="users/mfa-requests"
                        element={<MfaRequestsPage />}
                      />
                    </Route>
                    <Route path="security" element={<SecurityPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>
                {/* Error Pages */}
                <Route path="/error" element={<GeneralErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthHydrator>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
