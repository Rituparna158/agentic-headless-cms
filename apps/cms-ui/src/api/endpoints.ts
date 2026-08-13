/**
 * Centralized API Endpoints
 * All backend routes should be mapped here to avoid hardcoded strings.
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    ACCEPT_INVITE: '/auth/accept-invite',
    SSO: '/auth/sso',
    SSO_CALLBACK: '/auth/sso/callback',
    MFA_ENROLL: '/auth/mfa/enroll',
    MFA_VERIFY: '/auth/mfa/verify',
    MFA_CHALLENGE: '/auth/mfa/challenge',
    MFA_DISABLE: '/auth/mfa/disable',
    MFA_RESET_REQUEST: '/auth/mfa/reset-request',
    MFA_RESET_COMPLETE: '/auth/mfa/reset-complete',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
} as const;
