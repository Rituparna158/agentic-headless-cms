import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { AcceptInvitePage } from '@/pages/AcceptInvite/AcceptInvitePage';
import { authApi } from '@/features/auth/api/auth.api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=test-invite-token')],
  };
});

vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    acceptInvite: vi.fn(),
  },
}));

describe('AcceptInvitePage', () => {
  it('validates password matching and accepts invite', async () => {
    vi.mocked(authApi.acceptInvite).mockResolvedValueOnce({ success: true });

    const { container } = render(
      <BrowserRouter>
        <AcceptInvitePage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Accept Invitation')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('Jane Doe');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    const confirmInput = screen.getByPlaceholderText('Confirm password');
    const submitBtn = screen.getByRole('button', {
      name: /activate account/i,
    });

    fireEvent.change(nameInput, { target: { value: 'Alex Smith' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.acceptInvite).toHaveBeenCalledWith({
        token: 'test-invite-token',
        password: 'Password123!',
        name: 'Alex Smith',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
