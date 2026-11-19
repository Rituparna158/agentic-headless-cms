import { isUserAdmin } from '@/features/access/constants/access.constants';
import type { Capability, Perm, UserLike } from './types/capabilities.types';
import { LEGACY_CAPABILITIES as LEGACY } from './constants/capabilities.constants';

export type { Capability, Perm, UserLike };
export { LEGACY };

/**
 * What the signed-in user may do (optionally on one website). The server
 * checks the same rules, so hiding a button here is a convenience; the real
 * protection is on the API.
 */
export function userCan(
  user: UserLike | null | undefined,
  wanted: Capability | Capability[] | string | string[],
  siteId?: string | null,
): boolean {
  if (!user) return false;
  if (isUserAdmin(user.roles)) return true;
  const caps: string[] = Array.isArray(wanted) ? wanted : [wanted];
  const perms = user.permissions ?? [];
  const inScope = (p: Perm) => !siteId || !p.schemaId || p.schemaId === siteId;
  const grants = (p: Perm) => {
    if (p.action === '*') return true;
    const c = p.condition?.capability as string | undefined;
    if (c) return caps.includes(c);
    return (LEGACY[p.action] ?? []).some((x) => caps.includes(x));
  };
  if (perms.some((p) => p.effect === 'deny' && inScope(p) && grants(p)))
    return false;
  return perms.some(
    (p) => (p.effect ?? 'allow') === 'allow' && inScope(p) && grants(p),
  );
}
