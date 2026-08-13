import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from '../../../../src/components/Guard/AuthGuard';
import {
  useAuthStore,
  AuthState,
} from '../../../../src/features/auth/store/auth.store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('AuthGuard', () => {
  it('shows loading state when status is idle', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ status: 'idle' } as unknown as AuthState),
    );
    render(<AuthGuard />);
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ status: 'unauthenticated' } as unknown as AuthState),
    );
    render(
      <MemoryRouter initialEntries={['/guarded']}>
        <Routes>
          <Route path="/guarded" element={<AuthGuard />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ status: 'authenticated' } as unknown as AuthState),
    );
    render(
      <MemoryRouter initialEntries={['/guarded']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/guarded" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
