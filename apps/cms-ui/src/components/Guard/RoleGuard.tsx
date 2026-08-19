import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
interface RoleGuardProps {
  requiredCapability?: string;
  redirectTo?: string;
}
export const RoleGuard = ({
  requiredCapability,
  redirectTo = '/',
}: RoleGuardProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Super admins bypass capability checks
  const isSuperAdmin = user.roles?.some((roleName: string) =>
    roleName.toLowerCase().includes('admin'),
  );
  if (isSuperAdmin) {
    return <Outlet />;
  }
  if (requiredCapability) {
    // Check if user has the specific capability
    const hasCapability = user.permissions?.some(
      (p) => p.condition?.capability === requiredCapability,
    );
    if (!hasCapability) {
      return <Navigate to={redirectTo} replace />;
    }
  }
  return <Outlet />;
};
