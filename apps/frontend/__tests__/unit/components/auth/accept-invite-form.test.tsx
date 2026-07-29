import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

const {
  mockPush,
  mockApiFetch,
  mockToastSuccess,
  mockToastError,
  mockSearchParamsGet,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockApiFetch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockSearchParamsGet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mockApiFetch,
}));

describe('AcceptInviteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue('a-valid-token');
  });

  it('shows an invalid-link card when there is no token', () => {
    mockSearchParamsGet.mockReturnValue(null);
    render(<AcceptInviteForm />);

    expect(screen.getByText('Invalid Link')).toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
  });

  it('renders the password fields when a token is present', () => {
    render(<AcceptInviteForm />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows an error and does not submit when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<AcceptInviteForm />);

    await user.type(screen.getByLabelText('New Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Activate Account' }));

    expect(mockToastError).toHaveBeenCalledWith('Passwords do not match');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('shows an error and does not submit when the password is too short', async () => {
    const user = userEvent.setup();
    render(<AcceptInviteForm />);

    await user.type(screen.getByLabelText('New Password'), 'short12');
    await user.type(screen.getByLabelText('Confirm Password'), 'short12');
    await user.click(screen.getByRole('button', { name: 'Activate Account' }));

    expect(mockToastError).toHaveBeenCalledWith(
      'Password must be at least 8 characters long',
    );
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('submits the token and password, then redirects to login on success', async () => {
    mockApiFetch.mockResolvedValue({ message: 'Password set successfully' });
    const user = userEvent.setup();
    render(<AcceptInviteForm />);

    await user.type(
      screen.getByLabelText('New Password'),
      'a-strong-password-123',
    );
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'a-strong-password-123',
    );
    await user.click(screen.getByRole('button', { name: 'Activate Account' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({
        token: 'a-valid-token',
        newPassword: 'a-strong-password-123',
      }),
    });
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('shows the backend error message and does not redirect on failure', async () => {
    mockApiFetch.mockRejectedValue(
      new Error('Invalid or expired invitation token'),
    );
    const user = userEvent.setup();
    render(<AcceptInviteForm />);

    await user.type(
      screen.getByLabelText('New Password'),
      'a-strong-password-123',
    );
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'a-strong-password-123',
    );
    await user.click(screen.getByRole('button', { name: 'Activate Account' }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Invalid or expired invitation token',
      ),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
