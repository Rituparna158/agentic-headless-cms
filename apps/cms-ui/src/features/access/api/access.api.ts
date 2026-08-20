import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import { buildQueryString, TableQueryParams } from '../../../api/queryParams';
import {
  Role,
  RoleWithPermissions,
  CreateRolePayload,
  UpdateRolePayload,
  Schema,
  PaginatedResponse,
  User,
  InviteUserPayload,
  MfaRequestRecord,
  MfaRequestFilter,
} from '../types/access.types';
export const accessApi = {
  // Roles
  getRoles: async (options: TableQueryParams = {}) => {
    return requestHandler.get<PaginatedResponse<Role>>(
      `${ENDPOINTS.ACCESS.ROLES}${buildQueryString(options)}`,
    );
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
  getUsers: async (options: TableQueryParams = {}) => {
    return requestHandler.get<PaginatedResponse<User>>(
      `${ENDPOINTS.ACCESS.USERS}${buildQueryString(options)}`,
    );
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
  // MFA reset requests
  getMfaRequests: async (
    status?: MfaRequestFilter,
    options: TableQueryParams = {},
  ) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (options.page && options.page > 1)
      params.append('page', String(options.page));
    if (options.pageSize) params.append('pageSize', String(options.pageSize));
    if (options.sort) params.append('sort', options.sort);
    if (options.search) params.append('search', options.search);
    const qs = params.toString();
    return requestHandler.get<PaginatedResponse<MfaRequestRecord>>(
      `${ENDPOINTS.ACCESS.MFA_REQUESTS}${qs ? `?${qs}` : ''}`,
    );
  },
  approveMfaRequest: async (id: string) => {
    return requestHandler.post<{ success: boolean }>(
      `${ENDPOINTS.ACCESS.MFA_REQUESTS}/${id}/approve`,
    );
  },
  rejectMfaRequest: async (id: string) => {
    return requestHandler.post<{ success: boolean }>(
      `${ENDPOINTS.ACCESS.MFA_REQUESTS}/${id}/reject`,
    );
  },
};
