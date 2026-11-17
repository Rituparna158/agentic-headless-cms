import { HttpTransport, ApiResponse } from '@mindfiredigital/sdk-core';
import type {
  UserRecord,
  RoleRecord,
  TokenRecord,
  PaginatedResult,
  BaseQueryOptions,
} from '@repo/types';

export interface TokenMfaOptions {
  /** 6-digit authenticator TOTP code required for token creation and revocation. */
  mfaCode?: string;
}

function buildMfaRequestOptions(options?: TokenMfaOptions) {
  return options?.mfaCode ? { headers: { 'x-mfa-code': options.mfaCode } } : {};
}

export class AdminModule {
  constructor(private transport: HttpTransport) {}

  public async listUsers(
    options?: BaseQueryOptions,
  ): Promise<PaginatedResult<UserRecord>> {
    const res = await this.transport.request<
      ApiResponse<PaginatedResult<UserRecord>>
    >('/access/users', {
      params:
        (options as Record<string, string | number | boolean | undefined>) ||
        {},
    });
    return res.data;
  }

  public async inviteUser(
    email: string,
    roleId: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{
    message: string;
    user: { id: string; email: string; status: string };
    inviteUrl?: string;
  }> {
    const res = await this.transport.request<
      ApiResponse<{
        message: string;
        user: { id: string; email: string; status: string };
        inviteUrl?: string;
      }>
    >('/access/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, roleId, firstName, lastName }),
    });
    return res.data;
  }

  public async listRoles(
    options?: BaseQueryOptions,
  ): Promise<PaginatedResult<RoleRecord>> {
    const res = await this.transport.request<
      ApiResponse<PaginatedResult<RoleRecord>>
    >('/access/roles', {
      params:
        (options as Record<string, string | number | boolean | undefined>) ||
        {},
    });
    return res.data;
  }

  public async listTokens(
    options?: BaseQueryOptions,
  ): Promise<PaginatedResult<TokenRecord>> {
    const res = await this.transport.request<
      ApiResponse<PaginatedResult<TokenRecord>>
    >('/access/tokens', {
      params:
        (options as Record<string, string | number | boolean | undefined>) ||
        {},
    });
    return res.data;
  }

  public async createToken(
    name: string,
    type?: 'user' | 'agent',
    roleId?: string,
    scopes?: unknown,
    options?: TokenMfaOptions,
  ): Promise<TokenRecord> {
    const res = await this.transport.request<ApiResponse<TokenRecord>>(
      '/access/tokens',
      {
        method: 'POST',
        body: JSON.stringify({ name, type, roleId, scopes }),
        ...buildMfaRequestOptions(options),
      },
    );
    return res.data;
  }

  public async revokeToken(
    tokenId: string,
    options?: TokenMfaOptions,
  ): Promise<{ success: boolean }> {
    const res = await this.transport.request<ApiResponse<{ success: boolean }>>(
      `/access/tokens/${tokenId}`,
      {
        method: 'DELETE',
        ...buildMfaRequestOptions(options),
      },
    );
    return res.data;
  }
}
