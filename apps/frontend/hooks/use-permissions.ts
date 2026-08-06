import { useAuthStore } from '@/stores/auth-store';
import { hasPermission } from '@repo/utils/rbac';

export function useHasPermission(action: string, schemaId?: string | null): boolean {
  const user = useAuthStore((state) => state.user);

  if (!user || !user.permissions) {
    return false;
  }

  return hasPermission(user.permissions, action, schemaId ?? undefined);
}
