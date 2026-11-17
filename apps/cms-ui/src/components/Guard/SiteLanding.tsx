import { Navigate, useParams } from 'react-router-dom';
import { useSiteAccess } from '@/hooks/useCan';
import { SITE_LANDING_SECTIONS as SECTIONS } from './constants/siteLanding.constants';

export function SiteLanding() {
  const { siteId } = useParams<{ siteId: string }>();
  const { can, ready } = useSiteAccess(siteId);
  if (!ready) return null;
  const target = SECTIONS.find((s) => can(s.caps));
  return <Navigate to={target?.path ?? '/access-denied'} replace />;
}
