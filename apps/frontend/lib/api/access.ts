import type {
  RoleRecord,
  TokenRecord,
  UserRecord,
  BaseQueryOptions,
  PaginatedResult,
} from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';

import { apiFetch, buildQueryString } from '@/lib/api-client';

export function listRoles(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<RoleRecord>> {
  return apiFetch<PaginatedResult<RoleRecord>>(
    `${API_PATHS.ACCESS.ROLES}${buildQueryString(options)}`,
  );
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

export function listUsers(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<UserRecord>> {
  return apiFetch<PaginatedResult<UserRecord>>(
    `${API_PATHS.ACCESS.USERS}${buildQueryString(options)}`,
  );
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

export function listTokens(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<TokenRecord>> {
  return apiFetch<PaginatedResult<TokenRecord>>(
    `${API_PATHS.ACCESS.TOKENS}${buildQueryString(options)}`,
  );
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
