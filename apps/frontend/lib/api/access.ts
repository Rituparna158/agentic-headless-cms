import type { RoleRecord, TokenRecord, UserRecord } from '@repo/shared-types';

import { apiFetch } from '@/lib/api-client';

export function listRoles(): Promise<RoleRecord[]> {
  return apiFetch<RoleRecord[]>('/api/v1/access/roles');
}

export function createRole(data: Partial<RoleRecord>): Promise<RoleRecord> {
  return apiFetch<RoleRecord>('/api/v1/access/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRole(
  id: string,
  data: Partial<RoleRecord>,
): Promise<RoleRecord> {
  return apiFetch<RoleRecord>(`/api/v1/access/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/access/roles/${id}`, { method: 'DELETE' });
}

export function listUsers(): Promise<UserRecord[]> {
  return apiFetch<UserRecord[]>('/api/v1/access/users');
}

export function inviteUser(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}): Promise<{ message: string; user: UserRecord; inviteUrl?: string }> {
  return apiFetch('/api/v1/access/users/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listTokens(): Promise<TokenRecord[]> {
  return apiFetch<TokenRecord[]>('/api/v1/access/tokens');
}

export function createToken(data: Partial<TokenRecord>): Promise<TokenRecord> {
  return apiFetch<TokenRecord>('/api/v1/access/tokens', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function revokeToken(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/access/tokens/${id}`, { method: 'DELETE' });
}
