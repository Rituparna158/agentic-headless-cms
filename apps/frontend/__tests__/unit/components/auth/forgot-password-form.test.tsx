import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import * as authApi from '@/lib/api/auth';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api/auth', () => ({
  requestPasswordReset: vi.fn(),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email field and submit button', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Send Reset Link/i }),
    ).toBeInTheDocument();
  });

  it('shows validation errors for invalid email', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const submitBtn = screen.getByRole('button', { name: /Send Reset Link/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('submits the form successfully and displays success message', async () => {
    vi.mocked(authApi.requestPasswordReset).mockResolvedValue({
      message: 'If the email exists, a password reset link has been sent.',
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');

    const submitBtn = screen.getByRole('button', { name: /Send Reset Link/i });
    await user.click(submitBtn);

    expect(authApi.requestPasswordReset).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(
      await screen.findByText(
        'If the email exists, a password reset link has been sent.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Return to Sign In/i }),
    ).toBeInTheDocument();
  });

  it('displays API errors when submission fails', async () => {
    vi.mocked(authApi.requestPasswordReset).mockRejectedValue(
      new Error('Rate limit exceeded'),
    );

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');

    const submitBtn = screen.getByRole('button', { name: /Send Reset Link/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Rate limit exceeded')).toBeInTheDocument();
  });
});
