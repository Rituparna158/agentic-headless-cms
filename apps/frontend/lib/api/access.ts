import { apiFetch } from '@/lib/api-client';

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionRecord[];
}

export interface PermissionRecord {
  id: string;
  roleId: string;
  schemaId: string | null;
  action: 'read' | 'create' | 'update' | 'delete' | 'publish' | '*';
  effect: 'allow' | 'deny';
  fields: string[] | null;
  condition: Record<string, unknown> | null;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: string;
  createdAt: string;
}

export interface TokenRecord {
  id: string;
  name: string;
  type: string;
  scopes: string[];
  roleId?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  rawToken?: string; // only present on creation
}

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
