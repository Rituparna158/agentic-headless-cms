import { requestHandler } from '../../../api/requestHandler';
import { ENDPOINTS } from '../../../api/endpoints';
import type { AuthenticatedUser, LoginInput } from '@repo/types';
import { env } from '../../../config/env';
export const authApi = {
  // Logs a user in with credentials.

  login: async (payload: LoginInput) => {
    const res = await requestHandler.post<
      AuthenticatedUser | { mfaRequired: true; mfaToken: string }
    >(ENDPOINTS.AUTH.LOGIN, payload);
    return res.data;
  },

  // Fetches the currently authenticated user.
  getCurrentUser: async () => {
    const res = await requestHandler.get<AuthenticatedUser>(ENDPOINTS.AUTH.ME);
    return res.data;
  },

  // Logs out the user.
  logout: async () => {
    await requestHandler.post<void>(ENDPOINTS.AUTH.LOGOUT);
  },

  // Verifies an MFA challenge.
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

  // Starts MFA enrollment and returns the secret + QR code.
  enrollMfa: async () => {
    const res = await requestHandler.post<{ secret: string; qrCode: string }>(
      ENDPOINTS.AUTH.MFA_ENROLL,
    );
    return res.data;
  },

  // Verifies an MFA setup code and enables MFA for the user.
  verifyMfa: async (code: string) => {
    const res = await requestHandler.post<AuthenticatedUser>(
      ENDPOINTS.AUTH.MFA_VERIFY,
      { code },
    );
    return res.data;
  },

  // Disables MFA for the user.
  disableMfa: async () => {
    const res = await requestHandler.post<AuthenticatedUser>(
      ENDPOINTS.AUTH.MFA_DISABLE,
    );
    return res.data;
  },

  // Retrieves the URL for OIDC/SSO Login flow.
  // This handles the redirect flow.
  getOidcLoginUrl: () => {
    return `${env.VITE_API_URL}${ENDPOINTS.AUTH.SSO}?redirectUrl=${encodeURIComponent(window.location.origin)}&appId=CMS_UI`;
  },

  // Requests a password reset link.
  forgotPassword: async (email: string) => {
    const res = await requestHandler.post<{ message: string }>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
    );
    return res.data;
  },

  // Resets the password using a token.
  resetPassword: async (payload: { token: string; password: string }) => {
    const res = await requestHandler.post<{ success: boolean }>(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      payload,
    );
    return res.data;
  },

  // Accepts an invitation and sets the initial password.
  acceptInvite: async (payload: {
    token: string;
    password: string;
    name: string;
  }) => {
    const res = await requestHandler.post<{ success: boolean }>(
      ENDPOINTS.AUTH.ACCEPT_INVITE,
      {
        token: payload.token,
        newPassword: payload.password,
        name: payload.name,
      },
    );
    return res.data;
  },
  /**
   * Requests an MFA reset for a user who lost access to their authenticator.
   */
  requestMfaReset: async (email: string) => {
    const res = await requestHandler.post<{
      success: boolean;
      message?: string;
    }>(ENDPOINTS.AUTH.MFA_RESET_REQUEST, { email });
    return res.data;
  },
  /**
   * Completes an approved MFA reset using the emailed token.
   */
  completeMfaReset: async (token: string) => {
    const res = await requestHandler.post<{
      success: boolean;
      message?: string;
    }>(ENDPOINTS.AUTH.MFA_RESET_COMPLETE, { token });
    return res.data;
  },
};
