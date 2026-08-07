import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import * as authApi from '@/lib/api/auth';

const mockPush = vi.fn();
const mockSearchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

vi.mock('@/lib/api/auth', () => ({
  resetPassword: vi.fn(),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('valid-token-123');
  });

  it('renders an invalid link message when no token is present', () => {
    mockSearchParamsGet.mockReturnValue(null);
    render(<ResetPasswordForm />);
    expect(
      screen.getByText(
        'Invalid password reset link. No token found in the URL.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
  });

  it('renders the password field and submit button when token is present', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reset Password/i }),
    ).toBeInTheDocument();
  });

  it('shows validation errors for invalid password', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    const passwordInput = screen.getByLabelText('New Password');
    await user.type(passwordInput, 'short'); // too short

    const submitBtn = screen.getByRole('button', { name: /Reset Password/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
  });

  it('submits the form successfully and displays success message', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue({
      message: 'Password successfully reset.',
    });

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    const passwordInput = screen.getByLabelText('New Password');
    await user.type(passwordInput, 'validPassword123');

    const submitBtn = screen.getByRole('button', { name: /Reset Password/i });
    await user.click(submitBtn);

    expect(authApi.resetPassword).toHaveBeenCalledWith(
      'valid-token-123',
      'validPassword123',
    );
    expect(
      await screen.findByText('Your password has been successfully reset.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Sign In Now/i }),
    ).toBeInTheDocument();
  });

  it('displays API errors when submission fails', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValue(
      new Error('Reset token has expired'),
    );

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    const passwordInput = screen.getByLabelText('New Password');
    await user.type(passwordInput, 'validPassword123');

    const submitBtn = screen.getByRole('button', { name: /Reset Password/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText('Reset token has expired'),
    ).toBeInTheDocument();
  });
});
