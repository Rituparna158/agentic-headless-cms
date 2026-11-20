import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  verifyMfaChallenge: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock('../../../../src/features/auth/api/auth.api', () => ({ authApi: api }));

import { useAuthStore } from '../../../../src/features/auth/store/auth.store';
import {
  useLoginMutation,
  useVerifyMfaMutation,
  useLogoutMutation,
  useHydrateAuth,
} from '../../../../src/features/auth/hooks/useAuthMutations';

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const user = { id: 'u1', email: 'a@b.c', roles: ['admin'] } as never;

describe('auth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuthStore.getState().clearAuth();
    useAuthStore.setState({ status: 'idle' });
  });

  it('login stores the user on success', async () => {
    api.login.mockResolvedValue(user);
    const { result } = renderHook(() => useLoginMutation(), { wrapper });
    await act(() =>
      result.current.mutateAsync({ email: 'a', password: 'b' } as never),
    );
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(client.getQueryData(['currentUser'])).toEqual(user);
  });

  it('login switches to the MFA challenge when required', async () => {
    api.login.mockResolvedValue({ mfaRequired: true, mfaToken: 'tok' });
    const { result } = renderHook(() => useLoginMutation(), { wrapper });
    await act(() => result.current.mutateAsync({} as never));
    expect(useAuthStore.getState()).toMatchObject({
      status: 'mfa_challenge_required',
      mfaToken: 'tok',
    });
  });

  it('verify MFA authenticates the user', async () => {
    api.verifyMfaChallenge.mockResolvedValue(user);
    const { result } = renderHook(() => useVerifyMfaMutation(), { wrapper });
    await act(() => result.current.mutateAsync({ mfaToken: 't', code: '1' }));
    expect(api.verifyMfaChallenge).toHaveBeenCalledWith('t', '1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout clears local state on success and on failure', async () => {
    api.logout.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLogoutMutation(), { wrapper });
    useAuthStore.getState().setAuthData(user);
    await act(() => result.current.mutateAsync());
    expect(useAuthStore.getState().status).toBe('unauthenticated');

    useAuthStore.getState().setAuthData(user);
    api.logout.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.mutateAsync().catch(() => undefined);
    });
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('hydrate authenticates when /me succeeds', async () => {
    api.getCurrentUser.mockResolvedValue(user);
    renderHook(() => useHydrateAuth(), { wrapper });
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('authenticated'),
    );
    expect(api.getCurrentUser).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it('hydrate unauthenticates when /me fails', async () => {
    api.getCurrentUser.mockRejectedValue(new Error('401'));
    renderHook(() => useHydrateAuth(), { wrapper });
    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('unauthenticated'),
    );
  });

  it('hydrate does not fetch once the status is settled', () => {
    useAuthStore.setState({ status: 'authenticated' });
    renderHook(() => useHydrateAuth(), { wrapper });
    expect(api.getCurrentUser).not.toHaveBeenCalled();
  });
});
