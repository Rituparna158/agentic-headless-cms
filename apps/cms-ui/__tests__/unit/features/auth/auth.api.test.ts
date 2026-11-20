import { describe, it, expect, vi, beforeEach } from 'vitest';

const rh = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock('@/api/requestHandler', () => ({ requestHandler: rh }));
vi.mock('@/config/env', () => ({
  env: { VITE_API_URL: 'https://api.test/v1' },
}));

import { authApi } from '../../../../src/features/auth/api/auth.api';

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rh.get.mockResolvedValue({ data: { id: 'u1' } });
    rh.post.mockResolvedValue({ data: { ok: true } });
  });

  it('login posts credentials and returns data', async () => {
    const res = await authApi.login({ email: 'a@b.c', password: 'x' } as never);
    expect(rh.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.c',
      password: 'x',
    });
    expect(res).toEqual({ ok: true });
  });

  it('getCurrentUser forwards the abort signal and a contract schema', async () => {
    const ctrl = new AbortController();
    const res = await authApi.getCurrentUser({ signal: ctrl.signal });
    const [url, cfg] = rh.get.mock.calls[0]!;
    expect(url).toBe('/auth/me');
    expect(cfg.signal).toBe(ctrl.signal);
    expect(cfg.endpointLabel).toBe('authApi.getCurrentUser');
    expect(cfg.schema).toBeDefined();
    expect(res).toEqual({ id: 'u1' });
  });

  it('getCurrentUser works without options', async () => {
    await authApi.getCurrentUser();
    expect(rh.get.mock.calls[0]![1].signal).toBeUndefined();
  });

  it('logout posts and returns nothing', async () => {
    await expect(authApi.logout()).resolves.toBeUndefined();
    expect(rh.post).toHaveBeenCalledWith('/auth/logout');
  });

  it.each([
    [
      'verifyMfaChallenge',
      ['tok', '123456'],
      '/auth/mfa/challenge',
      { mfaToken: 'tok', code: '123456' },
    ],
    ['verifyMfa', ['123456'], '/auth/mfa/verify', { code: '123456' }],
    ['forgotPassword', ['a@b.c'], '/auth/forgot-password', { email: 'a@b.c' }],
    [
      'resetPassword',
      [{ token: 't', password: 'p' }],
      '/auth/reset-password',
      { token: 't', password: 'p' },
    ],
    [
      'requestMfaReset',
      ['a@b.c'],
      '/auth/mfa/reset-request',
      { email: 'a@b.c' },
    ],
    ['completeMfaReset', ['t'], '/auth/mfa/reset-complete', { token: 't' }],
  ] as const)(
    '%s posts to the right endpoint',
    async (name, args, url, body) => {
      const res = await (
        authApi as unknown as Record<
          string,
          (...a: unknown[]) => Promise<unknown>
        >
      )[name]!(...(args as unknown as unknown[]));
      expect(rh.post).toHaveBeenCalledWith(url, body);
      expect(res).toEqual({ ok: true });
    },
  );

  it('enrollMfa and disableMfa post without a body', async () => {
    await authApi.enrollMfa();
    await authApi.disableMfa();
    expect(rh.post).toHaveBeenNthCalledWith(1, '/auth/mfa/enroll');
    expect(rh.post).toHaveBeenNthCalledWith(2, '/auth/mfa/disable');
  });

  it('acceptInvite maps password to newPassword', async () => {
    await authApi.acceptInvite({ token: 't', password: 'p', name: 'N' });
    expect(rh.post).toHaveBeenCalledWith('/auth/accept-invite', {
      token: 't',
      newPassword: 'p',
      name: 'N',
    });
  });

  it('getOidcLoginUrl encodes the redirect and app id', () => {
    const url = authApi.getOidcLoginUrl();
    expect(url).toBe(
      `https://api.test/v1/auth/sso?redirectUrl=${encodeURIComponent(window.location.origin)}&appId=CMS_UI`,
    );
  });
});
