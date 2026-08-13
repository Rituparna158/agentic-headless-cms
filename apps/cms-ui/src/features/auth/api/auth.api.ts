import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import type { AuthenticatedUser, LoginInput } from '@repo/types';
import { env } from '../../../config/env';

export const authApi = {
  /**
   * Logs a user in with credentials.
   */
  login: async (payload: LoginInput) => {
    const res = await requestHandler.post<
      AuthenticatedUser | { mfaRequired: true; mfaToken: string }
    >(ENDPOINTS.AUTH.LOGIN, payload);
    return res.data;
  },

  /**
   * Fetches the currently authenticated user.
   */
  getCurrentUser: async () => {
    const res = await requestHandler.get<AuthenticatedUser>(ENDPOINTS.AUTH.ME);
    return res.data;
  },

  /**
   * Logs out the user.
   */
  logout: async () => {
    await requestHandler.post<void>(ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Verifies an MFA challenge.
   */
  verifyMfaChallenge: async (mfaToken: string, code: string) => {
    const res = await requestHandler.post<AuthenticatedUser>(
      ENDPOINTS.AUTH.MFA_CHALLENGE,
      {
        mfaToken,
        code,
      },
    );
    return res.data;
  },

  /**
   * Retrieves the URL for OIDC/SSO Login flow.
   * This handles the redirect flow.
   */
  getOidcLoginUrl: () => {
    return `${env.VITE_API_URL}${ENDPOINTS.AUTH.SSO}?redirectUrl=${encodeURIComponent(window.location.origin)}&appId=CMS_UI`;
  },
};
