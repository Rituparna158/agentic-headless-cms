export class AuthClient {
  private apiToken: string | undefined;

  constructor(apiToken?: string) {
    this.apiToken = apiToken;
  }

  /**
   * Retrieves the current token for API authentication.
   */
  public getToken(): string | undefined {
    return this.apiToken;
  }

  /**
   * Sets or updates the token (e.g. after login or token refresh).
   */
  public setToken(token: string | undefined) {
    this.apiToken = token;
  }
}
