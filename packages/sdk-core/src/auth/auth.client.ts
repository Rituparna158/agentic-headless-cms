import type { HttpTransport } from '../transport/http.js';
import type { ApiResponse, LoginResult } from '../types/index.js';
import type { LoginInput, AuthenticatedUser } from '@repo/types';

export class AuthClient {
  private apiToken: string | undefined;
  private transport?: HttpTransport;

  constructor(apiToken?: string) {
    this.apiToken = apiToken;
  }

  /**
   * Internal method to inject transport after instantiation.
   */
  public setTransport(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Retrieves the current token for API authentication.
   */
  public getToken(): string | undefined {
    return this.apiToken;
  }

  /**
   * Sets or updates the token manually (e.g. API Tokens).
   */
  public setToken(token: string | undefined) {
    this.apiToken = token;
  }

  /**
   * Logs in a user. Uses HttpTransport to set a cookie.
   */
  public async login(credentials: LoginInput): Promise<LoginResult> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    const res = await this.transport.request<ApiResponse<LoginResult>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
    );
    return res.data;
  }

  /**
   * Logs out the user, clearing the backend cookie.
   */
  public async logout(): Promise<void> {
    this.apiToken = undefined;
    if (this.transport) {
      await this.transport.request<void>('/auth/logout', {
        method: 'POST',
      });
    }
  }

  /**
   * Retrieves the currently logged-in user profile.
   */
  public async me(): Promise<AuthenticatedUser> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    const res =
      await this.transport.request<ApiResponse<AuthenticatedUser>>('/auth/me');
    return res.data;
  }
}
