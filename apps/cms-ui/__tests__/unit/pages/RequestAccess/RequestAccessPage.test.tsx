import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestAccessPage } from '../../../../src/pages/RequestAccess/RequestAccessPage';
import { authApi } from '../../../../src/features/auth/api/auth.api';

vi.mock('../../../../src/features/auth/api/auth.api', () => ({
  authApi: {
    requestMfaReset: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <RequestAccessPage />
    </MemoryRouter>,
  );

describe('RequestAccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the request form', () => {
    renderPage();
    expect(
      screen.getByText('Lost Access to Your Authenticator?'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Request Access/i }),
    ).toBeInTheDocument();
  });

  it('submits the reset request with the entered email', async () => {
    vi.mocked(authApi.requestMfaReset).mockResolvedValue({
      success: true,
    } as never);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request Access/i }));
    await waitFor(() => {
      expect(authApi.requestMfaReset).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('shows confirmation after a successful request', async () => {
    vi.mocked(authApi.requestMfaReset).mockResolvedValue({
      success: true,
    } as never);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request Access/i }));
    await waitFor(() => {
      expect(screen.getByText('Request Submitted')).toBeInTheDocument();
    });
  });

  it('shows an error message when the request fails', async () => {
    vi.mocked(authApi.requestMfaReset).mockRejectedValue(
      new Error('Request failed'),
    );
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request Access/i }));
    await waitFor(() => {
      expect(screen.getByText('Request failed')).toBeInTheDocument();
    });
  });
});
