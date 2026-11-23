import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { isUserAdmin } from '../../features/access/constants/access.constants';
import { userCan } from '@/lib/capabilities';

export const AdminOrSupportGuard = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const isAdminOrSupport =
    isUserAdmin(user.roles) ||
    user.roles?.some((roleName: string) =>
      ['admin', 'support', 'super_admin', 'administrator'].includes(
        roleName.toLowerCase().trim(),
      ),
    ) ||
    userCan(user, 'manage_settings') ||
    userCan(user, 'manage_users');

  if (!isAdminOrSupport) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
