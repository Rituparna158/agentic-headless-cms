import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const AuthLayout = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // If the user is already authenticated, don't let them see the login page
  if (status === 'authenticated') {
    if (user && user.roles.length === 0) {
      if (location.pathname !== '/access-denied') {
        return (
          <Navigate
            to="/access-denied?message=Your account has been created successfully, but you do not have any roles assigned yet."
            replace
          />
        );
      }
      // Let them stay on /access-denied to view the message
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
};
