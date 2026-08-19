export type ApplicationType = 'CMS_UI' | 'HEADLESS_CMS';
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'manage';
export type PermissionEffect = 'allow' | 'deny';
export interface RolePermission {
  id?: string;
  roleId?: string;
  schemaId: string | null;
  action: PermissionAction;
  effect: PermissionEffect;
  condition?: Record<string, unknown> | null;
}
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    };
  };
}
export interface Role {
  id: string;
  name: string;
  application: ApplicationType;
  description: string | null;
  mfaRequired: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface RoleWithPermissions extends Role {
  permissions: RolePermission[];
}
export interface CreateRolePayload {
  name: string;
  application: ApplicationType;
  description?: string;
  mfaRequired?: boolean;
  permissions?: Omit<RolePermission, 'id' | 'roleId'>[];
}
export type UpdateRolePayload = Partial<CreateRolePayload>;
export interface Schema {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublishable: boolean;
}
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  roles: Role[];
  mfaEnabled: boolean;
  createdAt: string;
}
export interface InviteUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
}
