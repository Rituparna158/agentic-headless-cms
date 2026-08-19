import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Role,
  RoleWithPermissions,
  CreateRolePayload,
  UpdateRolePayload,
  Schema,
  PaginatedResponse,
  User,
  InviteUserPayload,
} from '../types/access.types';
export const accessApi = {
  // Roles
  getRoles: async () => {
    return requestHandler.get<PaginatedResponse<Role>>(ENDPOINTS.ACCESS.ROLES);
  },
  getRole: async (id: string) => {
    return requestHandler.get<RoleWithPermissions>(
      `${ENDPOINTS.ACCESS.ROLES}/${id}`,
    );
  },
  createRole: async (payload: CreateRolePayload) => {
    return requestHandler.post<RoleWithPermissions>(
      ENDPOINTS.ACCESS.ROLES,
      payload,
    );
  },
  updateRole: async (id: string, payload: UpdateRolePayload) => {
    return requestHandler.put<RoleWithPermissions>(
      `${ENDPOINTS.ACCESS.ROLES}/${id}`,
      payload,
    );
  },
  deleteRole: async (id: string) => {
    return requestHandler.delete<{ success: boolean }>(
      `${ENDPOINTS.ACCESS.ROLES}/${id}`,
    );
  },
  // Schemas (for permissions grid)
  getSchemas: async () => {
    return requestHandler.get<PaginatedResponse<Schema>>(
      `${ENDPOINTS.SCHEMAS.BASE}`,
    );
  },
  // Users
  getUsers: async () => {
    return requestHandler.get<PaginatedResponse<User>>(ENDPOINTS.ACCESS.USERS);
  },
  inviteUser: async (payload: InviteUserPayload) => {
    return requestHandler.post<{
      message: string;
      user: User;
      inviteUrl?: string;
    }>(`${ENDPOINTS.ACCESS.USERS}/invite`, payload);
  },
  deleteUser: async (id: string) => {
    return requestHandler.delete<{ success: boolean }>(
      `${ENDPOINTS.ACCESS.USERS}/${id}`,
    );
  },
  updateUserRole: async (id: string, roleId: string) => {
    return requestHandler.patch<{ success: boolean }>(
      `${ENDPOINTS.ACCESS.USERS}/${id}/role`,
      { roleId },
    );
  },
};
