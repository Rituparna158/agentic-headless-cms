import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const AuthGuard = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm font-medium">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" replace />;
  }

  if (user && user.roles.length === 0) {
    return (
      <Navigate
        to="/access-denied?message=Your account has been created successfully, but you do not have any roles assigned yet."
        replace
      />
    );
  }

  // If authenticated, render the child routes (e.g., DashboardLayout)
  return <Outlet />;
};
