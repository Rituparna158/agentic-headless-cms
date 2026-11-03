import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthHydrator } from '../../../../src/components/Guard/AuthHydrator';
import {
  useAuthStore,
  AuthState,
} from '../../../../src/features/auth/store/auth.store';
import { useHydrateAuth } from '../../../../src/features/auth/hooks/useAuthMutations';

vi.mock('../../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../../src/features/auth/hooks/useAuthMutations', () => ({
  useHydrateAuth: vi.fn(),
}));

describe('AuthHydrator', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHydrateAuth).mockReturnValue({
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useHydrateAuth>);
  });

  it('calls refetch when status is idle', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ status: 'idle' } as unknown as AuthState),
    );
    render(
      <AuthHydrator>
        <div>Children</div>
      </AuthHydrator>,
    );
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('does not call refetch when status is authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ status: 'authenticated' } as unknown as AuthState),
    );
    render(
      <AuthHydrator>
        <div>Children</div>
      </AuthHydrator>,
    );
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
