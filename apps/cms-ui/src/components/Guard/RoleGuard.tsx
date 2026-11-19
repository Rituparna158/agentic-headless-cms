import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useSiteAccess } from '@/hooks/useCan';
import { userCan } from '@/lib/capabilities';
import { RoleGuardProps } from './types';

/** Inside a website: permissions are checked for that website. */
const SiteRoleGuard = ({
  siteId,
  requiredCapability,
  redirectTo = '/',
}: RoleGuardProps & { siteId: string }) => {
  const { can, ready } = useSiteAccess(siteId);
  if (!ready) return null;
  if (requiredCapability && !can(requiredCapability)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};

export const RoleGuard = ({
  requiredCapability,
  redirectTo = '/',
}: RoleGuardProps) => {
  const user = useAuthStore((state) => state.user);
  const { siteId } = useParams<{ siteId: string }>();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (siteId) {
    return (
      <SiteRoleGuard
        siteId={siteId}
        requiredCapability={requiredCapability}
        redirectTo={redirectTo}
      />
    );
  }
  // Administrators pass; everyone else needs the capability
  if (requiredCapability && !userCan(user, requiredCapability)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};
