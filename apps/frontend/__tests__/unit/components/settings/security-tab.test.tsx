import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

import {
  SecurityTab,
  mfaReducer,
  initialMfaState,
  type MfaState,
} from '@/components/settings/security-tab';
import { useAuthStore } from '@/stores/auth-store';

const { mockEnrollMfa, mockVerifyMfa, mockDisableMfa, mockHydrate } =
  vi.hoisted(() => ({
    mockEnrollMfa: vi.fn(),
    mockVerifyMfa: vi.fn(),
    mockDisableMfa: vi.fn(),
    mockHydrate: vi.fn(),
  }));

vi.mock('@/lib/api/auth', () => ({
  enrollMfa: mockEnrollMfa,
  verifyMfa: mockVerifyMfa,
  disableMfa: mockDisableMfa,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('mfaReducer (pure state machine)', () => {
  it('returns initial state on unknown action', () => {
    // @ts-expect-error testing unknown action fallback
    expect(mfaReducer(initialMfaState, { type: 'UNKNOWN' })).toEqual(
      initialMfaState,
    );
  });

  it('handles START_ENROLL transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      error: 'previous error',
    };
    const nextState = mfaReducer(prevState, { type: 'START_ENROLL' });
    expect(nextState).toEqual({
      status: 'enrolling',
      qrCode: null,
      secret: null,
      code: '',
      error: null,
    });
  });

  it('handles ENROLL_SUCCESS transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'enrolling',
    };
    const nextState = mfaReducer(prevState, {
      type: 'ENROLL_SUCCESS',
      payload: {
        qrCode: 'data:image/png;base64,123',
        secret: 'MFA_SECRET_123',
      },
    });
    expect(nextState).toEqual({
      status: 'setup',
      qrCode: 'data:image/png;base64,123',
      secret: 'MFA_SECRET_123',
      code: '',
      error: null,
    });
  });

  it('handles ENROLL_FAILURE transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'enrolling',
    };
    const nextState = mfaReducer(prevState, {
      type: 'ENROLL_FAILURE',
      payload: { error: 'Failed to start MFA setup' },
    });
    expect(nextState).toEqual({
      status: 'idle',
      qrCode: null,
      secret: null,
      code: '',
      error: 'Failed to start MFA setup',
    });
  });

  it('handles SET_CODE action', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'setup',
    };
    const nextState = mfaReducer(prevState, {
      type: 'SET_CODE',
      payload: '123456',
    });
    expect(nextState.code).toBe('123456');
  });

  it('handles START_VERIFY transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'setup',
      code: '123456',
      error: 'previous error',
    };
    const nextState = mfaReducer(prevState, { type: 'START_VERIFY' });
    expect(nextState.status).toBe('verifying');
    expect(nextState.error).toBeNull();
  });

  it('handles VERIFY_SUCCESS transition and resets to idle', () => {
    const prevState: MfaState = {
      status: 'verifying',
      qrCode: 'data:image/png;base64,123',
      secret: 'MFA_SECRET_123',
      code: '123456',
      error: null,
    };
    const nextState = mfaReducer(prevState, { type: 'VERIFY_SUCCESS' });
    expect(nextState).toEqual(initialMfaState);
  });

  it('handles VERIFY_FAILURE transition and keeps setup state for retry', () => {
    const prevState: MfaState = {
      status: 'verifying',
      qrCode: 'data:image/png;base64,123',
      secret: 'MFA_SECRET_123',
      code: '123456',
      error: null,
    };
    const nextState = mfaReducer(prevState, {
      type: 'VERIFY_FAILURE',
      payload: { error: 'Invalid verification code' },
    });
    expect(nextState.status).toBe('setup');
    expect(nextState.qrCode).toBe('data:image/png;base64,123');
    expect(nextState.secret).toBe('MFA_SECRET_123');
    expect(nextState.error).toBe('Invalid verification code');
  });

  it('handles START_DISABLE transition', () => {
    const nextState = mfaReducer(initialMfaState, { type: 'START_DISABLE' });
    expect(nextState.status).toBe('disabling');
    expect(nextState.error).toBeNull();
  });

  it('handles DISABLE_SUCCESS transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'disabling',
    };
    const nextState = mfaReducer(prevState, { type: 'DISABLE_SUCCESS' });
    expect(nextState).toEqual(initialMfaState);
  });

  it('handles DISABLE_FAILURE transition', () => {
    const prevState: MfaState = {
      ...initialMfaState,
      status: 'disabling',
    };
    const nextState = mfaReducer(prevState, {
      type: 'DISABLE_FAILURE',
      payload: { error: 'Failed to disable MFA' },
    });
    expect(nextState.status).toBe('idle');
    expect(nextState.error).toBe('Failed to disable MFA');
  });

  it('handles CANCEL action and restores initial state', () => {
    const prevState: MfaState = {
      status: 'setup',
      qrCode: 'data:image/png;base64,123',
      secret: 'MFA_SECRET_123',
      code: '123',
      error: 'err',
    };
    const nextState = mfaReducer(prevState, { type: 'CANCEL' });
    expect(nextState).toEqual(initialMfaState);
  });
});

function mockUser(mfaEnabled: boolean) {
  return {
    id: 'u1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['admin'],
    permissions: [],
    mfaEnabled,
  };
}

describe('SecurityTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unconfigured state when MFA is disabled', () => {
    useAuthStore.setState({
      user: mockUser(false),
      hydrate: mockHydrate,
    });

    render(<SecurityTab />);

    expect(screen.getByText('MFA is Not Setup')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /set up authenticator/i }),
    ).toBeInTheDocument();
  });

  it('handles full MFA setup flow with enrollment, code entry, and verification', async () => {
    useAuthStore.setState({
      user: mockUser(false),
      hydrate: mockHydrate,
    });

    mockEnrollMfa.mockResolvedValueOnce({
      qrCode: 'data:image/png;base64,fake-qr-code',
      secret: 'ABCDEF123456',
    });
    mockVerifyMfa.mockResolvedValueOnce({ success: true });
    mockHydrate.mockResolvedValueOnce(undefined);

    render(<SecurityTab />);

    const setupBtn = screen.getByRole('button', {
      name: /set up authenticator/i,
    });
    fireEvent.click(setupBtn);

    expect(mockEnrollMfa).toHaveBeenCalled();

    // Verify QR code and secret are displayed
    expect(await screen.findByAltText('MFA QR Code')).toBeInTheDocument();
    expect(screen.getByText('ABCDEF123456')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });

    const verifyBtn = screen.getByRole('button', { name: /verify & enable/i });
    expect(verifyBtn).not.toBeDisabled();
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifyMfa).toHaveBeenCalledWith('123456');
      expect(mockHydrate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Two-factor authentication enabled successfully!',
      );
    });
  });

  it('shows error message when verifyMfa rejects', async () => {
    useAuthStore.setState({
      user: mockUser(false),
      hydrate: mockHydrate,
    });

    mockEnrollMfa.mockResolvedValueOnce({
      qrCode: 'data:image/png;base64,fake-qr-code',
      secret: 'ABCDEF123456',
    });
    mockVerifyMfa.mockRejectedValueOnce(new Error('Invalid verification code'));

    render(<SecurityTab />);

    fireEvent.click(
      screen.getByRole('button', { name: /set up authenticator/i }),
    );
    expect(await screen.findByAltText('MFA QR Code')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '999999' } });

    fireEvent.click(screen.getByRole('button', { name: /verify & enable/i }));

    expect(
      await screen.findByText('Invalid verification code'),
    ).toBeInTheDocument();
    // Setup form remains visible
    expect(screen.getByAltText('MFA QR Code')).toBeInTheDocument();
  });

  it('cancels MFA setup when Cancel is clicked', async () => {
    useAuthStore.setState({
      user: mockUser(false),
      hydrate: mockHydrate,
    });

    mockEnrollMfa.mockResolvedValueOnce({
      qrCode: 'data:image/png;base64,fake-qr-code',
      secret: 'ABCDEF123456',
    });

    render(<SecurityTab />);

    fireEvent.click(
      screen.getByRole('button', { name: /set up authenticator/i }),
    );
    expect(await screen.findByAltText('MFA QR Code')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('MFA is Not Setup')).toBeInTheDocument();
    expect(screen.queryByAltText('MFA QR Code')).not.toBeInTheDocument();
  });

  it('renders enabled state and allows disabling MFA', async () => {
    useAuthStore.setState({
      user: mockUser(true),
      hydrate: mockHydrate,
    });

    mockDisableMfa.mockResolvedValueOnce(undefined);
    mockHydrate.mockResolvedValueOnce(undefined);

    render(<SecurityTab />);

    expect(screen.getByText('MFA is Enabled')).toBeInTheDocument();
    const disableBtn = screen.getByRole('button', {
      name: /disable two-factor authentication/i,
    });
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(mockDisableMfa).toHaveBeenCalled();
      expect(mockHydrate).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Two-factor authentication disabled successfully.',
      );
    });
  });

  it('handles error when disabling MFA fails', async () => {
    useAuthStore.setState({
      user: mockUser(true),
      hydrate: mockHydrate,
    });

    mockDisableMfa.mockRejectedValueOnce(new Error('Network error on disable'));

    render(<SecurityTab />);

    const disableBtn = screen.getByRole('button', {
      name: /disable two-factor authentication/i,
    });
    fireEvent.click(disableBtn);

    expect(
      await screen.findByText('Network error on disable'),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to disable MFA.');
  });
});
