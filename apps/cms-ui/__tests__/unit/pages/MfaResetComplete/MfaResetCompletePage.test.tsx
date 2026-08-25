import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MfaResetCompletePage } from '../../../../src/pages/MfaResetComplete/MfaResetCompletePage';
import { authApi } from '../../../../src/features/auth/api/auth.api';

vi.mock('../../../../src/features/auth/api/auth.api', () => ({
  authApi: {
    completeMfaReset: vi.fn(),
  },
}));

const renderPage = (token: string | null) =>
  render(
    <MemoryRouter
      initialEntries={[`/mfa-reset-complete${token ? `?token=${token}` : ''}`]}
    >
      <Routes>
        <Route path="/mfa-reset-complete" element={<MfaResetCompletePage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('MfaResetCompletePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invalid request when no token is present', () => {
    renderPage(null);
    expect(screen.getByText('Invalid Request')).toBeInTheDocument();
  });

  it('completes the reset with the token from the URL', async () => {
    vi.mocked(authApi.completeMfaReset).mockResolvedValue({
      success: true,
    } as never);
    renderPage('valid-token');
    fireEvent.click(
      screen.getByRole('button', { name: /Complete MFA Reset/i }),
    );
    await waitFor(() => {
      expect(authApi.completeMfaReset).toHaveBeenCalledWith('valid-token');
    });
    expect(screen.getByText('Reset Complete')).toBeInTheDocument();
  });

  it('shows an error when the reset fails', async () => {
    vi.mocked(authApi.completeMfaReset).mockRejectedValue(
      new Error('Token expired'),
    );
    renderPage('expired-token');
    fireEvent.click(
      screen.getByRole('button', { name: /Complete MFA Reset/i }),
    );
    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });
  });
});
