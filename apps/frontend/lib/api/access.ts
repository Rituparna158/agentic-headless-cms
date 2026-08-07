import type { RoleRecord, TokenRecord, UserRecord } from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';

import { apiFetch } from '@/lib/api-client';

export function listRoles(): Promise<RoleRecord[]> {
  return apiFetch<RoleRecord[]>(API_PATHS.ACCESS.ROLES);
}

export function createRole(data: Partial<RoleRecord>): Promise<RoleRecord> {
  return apiFetch<RoleRecord>(API_PATHS.ACCESS.ROLES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRole(
  id: string,
  data: Partial<RoleRecord>,
): Promise<RoleRecord> {
  return apiFetch<RoleRecord>(API_PATHS.ACCESS.ROLE(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.ACCESS.ROLE(id), { method: 'DELETE' });
}

export function listUsers(): Promise<UserRecord[]> {
  return apiFetch<UserRecord[]>(API_PATHS.ACCESS.USERS);
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.ACCESS.USER(id), { method: 'DELETE' });
}

export function updateUserRole(id: string, roleId: string): Promise<void> {
  return apiFetch<void>(API_PATHS.ACCESS.USER_ROLE(id), {
    method: 'PATCH',
    body: JSON.stringify({ roleId }),
  });
}

export function inviteUser(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}): Promise<{ message: string; user: UserRecord; inviteUrl?: string }> {
  return apiFetch(API_PATHS.ACCESS.INVITE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listTokens(): Promise<TokenRecord[]> {
  return apiFetch<TokenRecord[]>(API_PATHS.ACCESS.TOKENS);
}

export function createToken(data: Partial<TokenRecord>): Promise<TokenRecord> {
  return apiFetch<TokenRecord>(API_PATHS.ACCESS.TOKENS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function revokeToken(id: string): Promise<void> {
  return apiFetch<void>(API_PATHS.ACCESS.TOKEN(id), { method: 'DELETE' });
}
