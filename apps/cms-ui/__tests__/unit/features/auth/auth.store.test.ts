import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { AuthenticatedUser } from '@repo/types';

describe('useAuthStore', () => {
  const dummyUser: AuthenticatedUser = {
    id: 'user-456',
    email: 'editor@agentic-cms.com',
    firstName: 'Jane',
    lastName: 'Editor',
    roles: ['editor'],
    mfaEnabled: false,
    permissions: [],
  };

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initializes with default unauthenticated/idle state', () => {
    useAuthStore.setState({ user: null, status: 'idle', mfaToken: null });
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.mfaToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates state upon calling setAuthData', () => {
    useAuthStore.getState().setAuthData(dummyUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(dummyUser);
    expect(state.status).toBe('authenticated');
    expect(state.mfaToken).toBeNull();
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets mfa challenge state via setMfaChallenge', () => {
    useAuthStore.getState().setMfaChallenge('challenge-token-123');
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe('mfa_challenge_required');
    expect(state.mfaToken).toBe('challenge-token-123');
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets arbitrary status via setStatus', () => {
    useAuthStore.getState().setStatus('loading');
    expect(useAuthStore.getState().status).toBe('loading');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clears all user credentials on clearAuth', () => {
    useAuthStore.getState().setAuthData(dummyUser);
    expect(useAuthStore.getState().user).not.toBeNull();

    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
    expect(state.mfaToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
