import { useAuthStore } from '@/stores/auth-store';
import { hasPermission } from '@repo/utils/rbac';

export function useHasPermission(
  action: string,
  schemaId?: string | null,
): boolean {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return false;
  }

  const isAdmin = user.roles?.some((role) =>
    ['admin', 'super_admin'].includes(role.toLowerCase()),
  );
  if (isAdmin) {
    return true;
  }

  if (!user.permissions) {
    return false;
  }

  return hasPermission(user.permissions, action, schemaId ?? undefined);
}
