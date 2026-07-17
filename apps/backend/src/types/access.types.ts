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
  isSystem?: boolean;
  permissions?: PermissionData[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: PermissionData[];
}

export interface CreateTokenInput {
  name: string;
  type?: 'user' | 'agent';
  roleId?: string;
  scopes?: unknown;
}
