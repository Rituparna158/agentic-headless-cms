import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

export const AdminOrSupportGuard = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const isAdminOrSupport = user.roles?.some((roleName: string) =>
    ['admin', 'support'].includes(roleName.toLowerCase()),
  );
  if (!isAdminOrSupport) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
