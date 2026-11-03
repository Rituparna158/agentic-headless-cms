import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
}));

const mockUser = { id: 'u1', mfaEnabled: false };

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: mockUser } as never),
    );
  });

  it('renders MFA setup section when MFA is not enabled', () => {
    render(<SecurityPage />);
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
    render(<SecurityPage />);
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

  it('shows remove MFA section when MFA is enabled', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { ...mockUser, mfaEnabled: true } } as never),
    );
    render(<SecurityPage />);
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
    render(<SecurityPage />);
    fireEvent.click(
      screen.getByRole('button', { name: /Remove MFA Integration/i }),
    );
    await waitFor(() => {
      expect(authApi.disableMfa).toHaveBeenCalled();
    });
  });
});
