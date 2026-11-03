'use client';

import { useReducer } from 'react';
import Image from 'next/image';
import { ShieldAlert, ShieldCheck, QrCode, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '@repo/shared-ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { useAuthStore } from '@/stores/auth-store';
import { enrollMfa, verifyMfa, disableMfa } from '@/lib/api/auth';

export type MfaStatus =
  | 'idle'
  | 'enrolling'
  | 'setup'
  | 'verifying'
  | 'disabling';

export interface MfaState {
  status: MfaStatus;
  qrCode: string | null;
  secret: string | null;
  code: string;
  error: string | null;
}

export type MfaAction =
  | { type: 'START_ENROLL' }
  | { type: 'ENROLL_SUCCESS'; payload: { qrCode: string; secret: string } }
  | { type: 'ENROLL_FAILURE'; payload: { error: string } }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'START_VERIFY' }
  | { type: 'VERIFY_SUCCESS' }
  | { type: 'VERIFY_FAILURE'; payload: { error: string } }
  | { type: 'START_DISABLE' }
  | { type: 'DISABLE_SUCCESS' }
  | { type: 'DISABLE_FAILURE'; payload: { error: string } }
  | { type: 'CANCEL' };

export const initialMfaState: MfaState = {
  status: 'idle',
  qrCode: null,
  secret: null,
  code: '',
  error: null,
};

export function mfaReducer(state: MfaState, action: MfaAction): MfaState {
  switch (action.type) {
    case 'START_ENROLL':
      return {
        ...state,
        status: 'enrolling',
        error: null,
      };
    case 'ENROLL_SUCCESS':
      return {
        ...state,
        status: 'setup',
        qrCode: action.payload.qrCode,
        secret: action.payload.secret,
        code: '',
        error: null,
      };
    case 'ENROLL_FAILURE':
      return {
        ...state,
        status: 'idle',
        error: action.payload.error,
      };
    case 'SET_CODE':
      return {
        ...state,
        code: action.payload,
      };
    case 'START_VERIFY':
      return {
        ...state,
        status: 'verifying',
        error: null,
      };
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        status: 'idle',
        qrCode: null,
        secret: null,
        code: '',
        error: null,
      };
    case 'VERIFY_FAILURE':
      return {
        ...state,
        status: 'setup',
        error: action.payload.error,
      };
    case 'START_DISABLE':
      return {
        ...state,
        status: 'disabling',
        error: null,
      };
    case 'DISABLE_SUCCESS':
      return {
        ...state,
        status: 'idle',
        error: null,
      };
    case 'DISABLE_FAILURE':
      return {
        ...state,
        status: 'idle',
        error: action.payload.error,
      };
    case 'CANCEL':
      return initialMfaState;
    default:
      return state;
  }
}

export function SecurityTab() {
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [state, dispatch] = useReducer(mfaReducer, initialMfaState);

  const isEnrolling = state.status === 'enrolling';
  const isSetupMode = state.status === 'setup' || state.status === 'verifying';
  const isVerifying = state.status === 'verifying';
  const isDisabling = state.status === 'disabling';

  async function handleStartSetup() {
    dispatch({ type: 'START_ENROLL' });
    try {
      const data = await enrollMfa();
      dispatch({
        type: 'ENROLL_SUCCESS',
        payload: { qrCode: data.qrCode, secret: data.secret },
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start MFA setup';
      dispatch({ type: 'ENROLL_FAILURE', payload: { error: errorMsg } });
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'START_VERIFY' });
    try {
      await verifyMfa(state.code);
      // Re-fetch user details to update mfaEnabled state in frontend
      await hydrate();
      dispatch({ type: 'VERIFY_SUCCESS' });
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Invalid verification code';
      dispatch({ type: 'VERIFY_FAILURE', payload: { error: errorMsg } });
    }
  }

  async function handleDisableMfa() {
    dispatch({ type: 'START_DISABLE' });
    try {
      await disableMfa();
      await hydrate();
      dispatch({ type: 'DISABLE_SUCCESS' });
      toast.success('Two-factor authentication disabled successfully.');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to disable MFA';
      dispatch({ type: 'DISABLE_FAILURE', payload: { error: errorMsg } });
      toast.error('Failed to disable MFA.');
    }
  }

  function handleCancel() {
    dispatch({ type: 'CANCEL' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
        <CardDescription>
          Secure your account by requiring an authenticator code when signing
          in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {user?.mfaEnabled ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
              <ShieldCheck className="size-8 text-primary shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">MFA is Enabled</h4>
                <p className="text-sm text-muted-foreground">
                  Your account is currently protected with two-factor
                  authentication. You will be prompted to enter a verification
                  code from your authenticator app each time you sign in.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="danger"
                onClick={handleDisableMfa}
                disabled={isDisabling}
              >
                {isDisabling && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Disable Two-Factor Authentication
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!isSetupMode ? (
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
                  <ShieldAlert className="size-8 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">MFA is Not Setup</h4>
                    <p className="text-sm text-muted-foreground">
                      Two-factor authentication is currently disabled for your
                      account. We highly recommend enabling it to safeguard your
                      data.
                    </p>
                  </div>
                </div>

                <Button onClick={handleStartSetup} disabled={isEnrolling}>
                  {isEnrolling && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Set up Authenticator
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 p-4 border rounded-lg">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <QrCode className="size-5 text-primary" />
                      1. Scan the QR Code
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code using your authenticator app (such as
                      Google Authenticator, Authy, or 1Password).
                    </p>
                  </div>

                  {state.qrCode && (
                    <div className="bg-white p-3 rounded-lg border w-fit mx-auto md:mx-0">
                      <Image
                        src={state.qrCode}
                        alt="MFA QR Code"
                        width={192}
                        height={192}
                        className="size-48"
                      />
                    </div>
                  )}

                  {state.secret && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Key className="size-3.5" />
                        Can&apos;t scan? Use this setup key instead:
                      </p>
                      <code className="block p-2 rounded bg-muted font-mono text-xs select-all break-all">
                        {state.secret}
                      </code>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base">2. Verify Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit verification code generated by your app
                      to complete setup.
                    </p>
                  </div>

                  <form
                    method="POST"
                    onSubmit={handleVerify}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Input
                        placeholder="000000"
                        value={state.code}
                        onChange={(val: string) =>
                          dispatch({
                            type: 'SET_CODE',
                            payload: val.replace(/\D/g, ''),
                          })
                        }
                        className="text-center font-mono text-lg tracking-widest"
                        variant="default"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isVerifying || state.code.length !== 6}
                      >
                        {isVerifying && (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Verify & Enable
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {state.error && (
          <p role="alert" className="text-destructive text-sm mt-2">
            {state.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
