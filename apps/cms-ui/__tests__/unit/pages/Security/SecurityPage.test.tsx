import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityPage } from '../../../../src/pages/Security/SecurityPage';
import { useAuthStore } from '../../../../src/features/auth/store/auth.store';
import { authApi } from '../../../../src/features/auth/api/auth.api';

vi.mock('../../../../src/features/auth/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../../src/features/auth/api/auth.api', () => ({
  authApi: {
    enrollMfa: vi.fn(),
    verifyMfa: vi.fn(),
    disableMfa: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    refetchQueries: vi.fn().mockResolvedValue(undefined),
  }),
  useQuery: () => ({ data: undefined, isLoading: false }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  keepPreviousData: vi.fn(),
}));

const mockUser = { id: 'u1', mfaEnabled: false };

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: mockUser } as never),
    );
  });

  it('renders only 2 tabs: MFA Reset Requests and My 2FA Settings', () => {
    render(<SecurityPage />);
    expect(
      screen.getByRole('button', { name: /MFA Reset Requests/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /My 2FA Settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /User Roles & Permissions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Audit Logs History/i }),
    ).not.toBeInTheDocument();
  });

  it('switches between tabs on click in standalone mode', () => {
    render(<SecurityPage />);
    // By default, MFA tab is active and shows MFA requests
    expect(screen.queryByText('MFA is Not Set Up')).not.toBeInTheDocument();

    // Click My 2FA Settings tab
    fireEvent.click(screen.getByRole('button', { name: /My 2FA Settings/i }));
    expect(screen.getByText('MFA is Not Set Up')).toBeInTheDocument();

    // Click MFA Reset Requests tab again
    fireEvent.click(
      screen.getByRole('button', { name: /MFA Reset Requests/i }),
    );
    expect(screen.queryByText('MFA is Not Set Up')).not.toBeInTheDocument();
  });

  it('switches between tabs on click in router mode', () => {
    render(
      <MemoryRouter initialEntries={['/security']}>
        <SecurityPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText('MFA is Not Set Up')).not.toBeInTheDocument();

    // Click My 2FA Settings
    fireEvent.click(screen.getByRole('button', { name: /My 2FA Settings/i }));
    expect(screen.getByText('MFA is Not Set Up')).toBeInTheDocument();
  });

  it('renders MFA setup section when MFA is not enabled in My 2FA Settings tab', () => {
    render(
      <MemoryRouter initialEntries={['/security?tab=my_mfa']}>
        <SecurityPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('MFA is Not Set Up')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add MFA Integration/i }),
    ).toBeInTheDocument();
  });

  it('shows enroll flow with QR code and secret after starting setup', async () => {
    vi.mocked(authApi.enrollMfa).mockResolvedValue({
      secret: 'SECRET123',
      qrCode: 'data:image/png;base64,qr',
    } as never);
    render(
      <MemoryRouter initialEntries={['/security?tab=my_mfa']}>
        <SecurityPage />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Add MFA Integration/i }),
    );
    await waitFor(() => {
      expect(screen.getByText('SECRET123')).toBeInTheDocument();
    });
    expect(screen.getByAltText('MFA QR Code')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Verify & Enable/i }),
    ).toBeInTheDocument();
  });

  it('shows remove MFA section when MFA is enabled in My 2FA Settings tab', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { ...mockUser, mfaEnabled: true } } as never),
    );
    render(
      <MemoryRouter initialEntries={['/security?tab=my_mfa']}>
        <SecurityPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('MFA is Enabled')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Remove MFA Integration/i }),
    ).toBeInTheDocument();
  });

  it('calls disableMfa and refetches user when removing MFA', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { ...mockUser, mfaEnabled: true } } as never),
    );
    vi.mocked(authApi.disableMfa).mockResolvedValue({
      id: 'u1',
      mfaEnabled: false,
    } as never);
    render(
      <MemoryRouter initialEntries={['/security?tab=my_mfa']}>
        <SecurityPage />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Remove MFA Integration/i }),
    );
    await waitFor(() => {
      expect(authApi.disableMfa).toHaveBeenCalled();
    });
  });
});
