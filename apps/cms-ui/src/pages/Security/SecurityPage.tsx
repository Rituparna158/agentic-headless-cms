import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  QrCode,
  Key,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Fingerprint,
  ScanLine,
  RefreshCcw,
  Shield,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Typography,
} from '@repo/shared-ui';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { authApi } from '../../features/auth/api/auth.api';

export const SecurityPage = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [setupMode, setSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const refreshUser = async () => {
    await queryClient.refetchQueries({ queryKey: ['currentUser'] });
  };

  async function handleStartSetup() {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.enrollMfa();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start MFA setup',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await authApi.verifyMfa(code);
      await refreshUser();
      setSetupMode(false);
      setQrCode(null);
      setSecret(null);
      setCode('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid verification code',
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisableMfa() {
    setDisabling(true);
    setError(null);
    try {
      await authApi.disableMfa();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
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

  async function handleCopySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Fingerprint className="size-5 text-primary" />
            </div>
            <div>
              <Typography variant="h2" className="tracking-tight">
                Security
              </Typography>
              <Typography variant="body" className="text-muted-foreground mt-1">
                Manage authentication and protect your account.
              </Typography>
            </div>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              user?.mfaEnabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                user?.mfaEnabled ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {user?.mfaEnabled ? 'MFA Active' : 'MFA Not Set Up'}
          </div>
        </div>

        {/* Expanded MFA Management Card */}
        <Card className="overflow-hidden">
          <CardHeader variant="spacious">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
                <CardDescription className="max-w-2xl">
                  Add an extra layer of security by requiring a one-time code
                  from your authenticator app whenever you sign in.
                </CardDescription>
              </div>
              <div
                className={`hidden shrink-0 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${
                  user?.mfaEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : 'border-muted bg-muted/60 text-muted-foreground'
                }`}
              >
                {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </CardHeader>
          <CardContent variant="spacious" className="space-y-8">
            {user?.mfaEnabled ? (
              <EnabledView
                email={user.email}
                disabling={disabling}
                onDisable={handleDisableMfa}
              />
            ) : setupMode && qrCode && secret ? (
              <SetupView
                qrCode={qrCode}
                secret={secret}
                copied={copied}
                code={code}
                setCode={setCode}
                verifying={verifying}
                onVerify={handleVerify}
                onCancel={handleCancel}
                onCopy={handleCopySecret}
              />
            ) : (
              <DisabledView loading={loading} onSetup={handleStartSetup} />
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to use MFA */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle size="md">How to use MFA</CardTitle>
            <CardDescription>
              A quick overview of what happens once MFA is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 sm:grid-cols-3">
              <StepCard
                number={1}
                icon={<ScanLine className="size-4" />}
                title="Scan & pair"
                description="Scan the QR code with your authenticator app to link your account."
              />
              <StepCard
                number={2}
                icon={<RefreshCcw className="size-4" />}
                title="Get a code"
                description="Your app generates a fresh 6-digit code that changes every 30 seconds."
              />
              <StepCard
                number={3}
                icon={<Shield className="size-4" />}
                title="Verify & unlock"
                description="Enter the code at sign-in to confirm it's really you and gain access."
              />
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="relative rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <span className="text-2xl font-semibold text-muted-foreground/40">
          {number}
        </span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </li>
  );
}

function EnabledView({
  email,
  disabling,
  onDisable,
}: {
  email: string;
  disabling: boolean;
  onDisable: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-emerald-500/15 p-3.5">
            <ShieldCheck className="size-7 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">MFA is Enabled</h4>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Your account is protected with two-factor authentication. You will
              be asked for a verification code from your authenticator app each
              time you sign in.
            </p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DetailTile
          icon={<BadgeCheck className="size-4" />}
          label="Status"
          value="Active"
          tone="emerald"
        />
        <DetailTile
          icon={<QrCode className="size-4" />}
          label="Method"
          value="Authenticator app"
        />
        <DetailTile
          icon={<Clock className="size-4" />}
          label="Protected account"
          value={email}
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Removing MFA weakens your account security and makes it easier for
          unauthorized users to sign in. This action applies immediately and
          cannot be undone.
        </p>
        <div className="mt-5">
          <Button variant="danger" onClick={onDisable} disabled={disabling}>
            {disabling && <Loader2 className="size-4 animate-spin" />}
            Remove MFA Integration
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'emerald';
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div
        className={`mb-3 w-fit rounded-lg p-2 ${
          tone === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-600'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function DisabledView({
  loading,
  onSetup,
}: {
  loading: boolean;
  onSetup: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="rounded-full bg-amber-500/15 p-3.5">
          <ShieldAlert className="size-7 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">MFA is Not Set Up</h4>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Two-factor authentication is currently disabled for your account. We
            strongly recommend enabling it to safeguard your data.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-muted-foreground">
            Enabling MFA only takes about a minute. You&apos;ll scan a QR code
            with your authenticator app and confirm a one-time code.
          </p>
          <Button onClick={onSetup} disabled={loading} size="lg">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Add MFA Integration
          </Button>
        </div>
      </div>
    </div>
  );
}

function SetupView({
  qrCode,
  secret,
  copied,
  code,
  setCode,
  verifying,
  onVerify,
  onCancel,
  onCopy,
}: {
  qrCode: string;
  secret: string;
  copied: boolean;
  code: string;
  setCode: (value: string) => void;
  verifying: boolean;
  onVerify: (e: React.FormEvent) => void;
  onCancel: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Open your authenticator app and follow the two steps below. The setup
          key and QR code are shown only once, so save them before continuing.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Step 1 */}
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Scan the QR Code
              </h4>
              <p className="text-xs text-muted-foreground">
                Use your authenticator app&apos;s scan feature.
              </p>
            </div>
          </div>

          <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-4 shadow-sm">
            <img
              src={qrCode}
              alt="MFA QR Code"
              width={208}
              height={208}
              className="size-52"
            />
          </div>

          <div className="mt-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Key className="size-3.5" />
              Can&apos;t scan? Use this setup key:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                {secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onCopy}
                aria-label="Copy setup key"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Verify Setup
              </h4>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code to finish enabling MFA.
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-5">
            <QrCode className="size-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Authenticator App
            </span>
          </div>

          <form onSubmit={onVerify} className="mt-6 space-y-5">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full rounded-xl border border-input bg-background px-4 py-4 text-center font-mono text-2xl tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="flex-1"
              >
                {verifying && <Loader2 className="size-4 animate-spin" />}
                Verify & Enable
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={verifying}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
