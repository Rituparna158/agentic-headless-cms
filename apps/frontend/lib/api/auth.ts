import type { AuthenticatedUser, LoginInput } from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';
import { apiFetch } from '@/lib/api-client';

export function login(
  input: LoginInput,
): Promise<AuthenticatedUser | { mfaRequired: true; mfaToken: string }> {
  return apiFetch<AuthenticatedUser | { mfaRequired: true; mfaToken: string }>(
    API_PATHS.AUTH.LOGIN,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function verifyMfaChallenge(
  mfaToken: string,
  code: string,
): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>(API_PATHS.AUTH.MFA_CHALLENGE, {
    method: 'POST',
    body: JSON.stringify({ mfaToken, code }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>(API_PATHS.AUTH.LOGOUT, { method: 'POST' });
}

export function getCurrentUser(): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>(API_PATHS.AUTH.ME);
}

export function enrollMfa(): Promise<{ secret: string; qrCode: string }> {
  return apiFetch<{ secret: string; qrCode: string }>(
    API_PATHS.AUTH.MFA_ENROLL,
    {
      method: 'POST',
    },
  );
}

export function verifyMfa(code: string): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>(API_PATHS.AUTH.MFA_VERIFY, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function disableMfa(): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>(API_PATHS.AUTH.MFA_DISABLE, {
    method: 'POST',
  });
}
