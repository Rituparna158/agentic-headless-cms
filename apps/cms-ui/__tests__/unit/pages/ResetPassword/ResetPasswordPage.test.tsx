import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { ResetPasswordPage } from '@/pages/ResetPassword/ResetPasswordPage';
import { authApi } from '@/features/auth/api/auth.api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=test-reset-token')],
  };
});

vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  it('renders form and submits new password when token is present', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ success: true });

    const { container } = render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText('Enter new password');
    const submitBtn = screen.getByRole('button', {
      name: /reset password/i,
    });

    fireEvent.change(passwordInput, {
      target: { value: 'NewSecurePassword123!' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'test-reset-token',
        password: 'NewSecurePassword123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
