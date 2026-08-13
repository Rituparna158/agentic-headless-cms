import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const AuthLayout = () => {
  const status = useAuthStore((state) => state.status);

  // If the user is already authenticated, don't let them see the login page
  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
};
