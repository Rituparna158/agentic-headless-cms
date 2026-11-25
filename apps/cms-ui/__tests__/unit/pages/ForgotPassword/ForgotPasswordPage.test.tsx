import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { ForgotPasswordPage } from '@/pages/ForgotPassword/ForgotPasswordPage';
import { authApi } from '@/features/auth/api/auth.api';

vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  it('renders email input and submits password reset request', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({
      message: 'Reset email sent',
    });

    const { container } = render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const submitBtn = screen.getByRole('button', {
      name: /send reset link/i,
    });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
