'use client';

import { useState } from 'react';
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

export function SecurityTab() {
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [setupMode, setSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  async function handleStartSetup() {
    setLoading(true);
    setError(null);
    try {
      const data = await enrollMfa();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start MFA setup';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await verifyMfa(code);
      // Re-fetch user details to update mfaEnabled state in frontend
      await hydrate();
      setSetupMode(false);
      setQrCode(null);
      setSecret(null);
      setCode('');
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMsg);
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisableMfa() {
    setDisabling(true);
    setError(null);
    try {
      await disableMfa();
      await hydrate();
      toast.success('Two-factor authentication disabled successfully.');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to disable MFA';
      setError(errorMsg);
      toast.error('Failed to disable MFA.');
    } finally {
      setDisabling(false);
    }
  }

  function handleCancel() {
    setSetupMode(false);
    setQrCode(null);
    setSecret(null);
    setCode('');
    setError(null);
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
                disabled={disabling}
              >
                {disabling && <Loader2 className="mr-2 size-4 animate-spin" />}
                Disable Two-Factor Authentication
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!setupMode ? (
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

                <Button onClick={handleStartSetup} disabled={loading}>
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
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

                  {qrCode && (
                    <div className="bg-white p-3 rounded-lg border w-fit mx-auto md:mx-0">
                      <Image
                        src={qrCode}
                        alt="MFA QR Code"
                        width={192}
                        height={192}
                        className="size-48"
                      />
                    </div>
                  )}

                  {secret && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Key className="size-3.5" />
                        Can&apos;t scan? Use this setup key instead:
                      </p>
                      <code className="block p-2 rounded bg-muted font-mono text-xs select-all break-all">
                        {secret}
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

                  <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="000000"
                        value={code}
                        onChange={(val) => setCode(val.replace(/\D/g, ''))}
                        className="text-center font-mono text-lg tracking-widest"
                        variant="default"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={verifying || code.length !== 6}
                      >
                        {verifying && (
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

        {error && (
          <p role="alert" className="text-destructive text-sm mt-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
