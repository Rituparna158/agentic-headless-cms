export type PermissionData = {
  schemaId: string | null;
  action: 'read' | 'create' | 'update' | 'delete' | 'publish' | '*';
  effect?: 'allow' | 'deny';
  fields?: unknown;
  condition?: unknown;
};

export interface CreateRoleInput {
  name: string;
  description?: string;
  mfaRequired?: boolean;
  isSystem?: boolean;
  permissions?: PermissionData[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  mfaRequired?: boolean;
  permissions?: PermissionData[];
}

export interface CreateTokenInput {
  name: string;
  type?: 'user' | 'agent';
  roleId?: string;
  scopes?: unknown;
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

export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  mfaRequired: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionRecord[];
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

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  mfaEnabled: boolean;
  permissions?: { action: string; schemaId: string | null; effect: string }[];
}
