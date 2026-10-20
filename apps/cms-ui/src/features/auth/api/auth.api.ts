import { z } from 'zod';
import type { AuthenticatedUser, LoginInput } from '@repo/types';
import { requestHandler } from '@/api/requestHandler';
import { ENDPOINTS } from '@/api/endpoints';
import { env } from '@/config/env';
import { authenticatedUserContractSchema } from '../validate/auth.validate';

export { authenticatedUserContractSchema };

export const authApi = {
  login: async (payload: LoginInput) => {
    const res = await requestHandler.post<
      AuthenticatedUser | { mfaRequired: true; mfaToken: string }
    >(ENDPOINTS.AUTH.LOGIN, payload);
    return res.data;
  },

  getCurrentUser: async (options?: { signal?: AbortSignal }) => {
    const res = await requestHandler.get<AuthenticatedUser>(ENDPOINTS.AUTH.ME, {
      signal: options?.signal,
      schema:
        authenticatedUserContractSchema as unknown as z.ZodType<AuthenticatedUser>,
      endpointLabel: 'authApi.getCurrentUser',
    });
    return res.data;
  },

  logout: async () => {
    await requestHandler.post<void>(ENDPOINTS.AUTH.LOGOUT);
  },

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

  enrollMfa: async () => {
    const res = await requestHandler.post<{ secret: string; qrCode: string }>(
      ENDPOINTS.AUTH.MFA_ENROLL,
    );
    return res.data;
  },

  verifyMfa: async (code: string) => {
    const res = await requestHandler.post<AuthenticatedUser>(
      ENDPOINTS.AUTH.MFA_VERIFY,
      { code },
    );
    return res.data;
  },

  disableMfa: async () => {
    const res = await requestHandler.post<AuthenticatedUser>(
      ENDPOINTS.AUTH.MFA_DISABLE,
    );
    return res.data;
  },

  getOidcLoginUrl: () => {
    return `${env.VITE_API_URL}${ENDPOINTS.AUTH.SSO}?redirectUrl=${encodeURIComponent(window.location.origin)}&appId=CMS_UI`;
  },

  forgotPassword: async (email: string) => {
    const res = await requestHandler.post<{ message: string }>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
    );
    return res.data;
  },

  resetPassword: async (payload: { token: string; password: string }) => {
    const res = await requestHandler.post<{ success: boolean }>(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      payload,
    );
    return res.data;
  },

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

  requestMfaReset: async (email: string) => {
    const res = await requestHandler.post<{
      success: boolean;
      message?: string;
    }>(ENDPOINTS.AUTH.MFA_RESET_REQUEST, { email });
    return res.data;
  },

  completeMfaReset: async (token: string) => {
    const res = await requestHandler.post<{
      success: boolean;
      message?: string;
    }>(ENDPOINTS.AUTH.MFA_RESET_COMPLETE, { token });
    return res.data;
  },
};
