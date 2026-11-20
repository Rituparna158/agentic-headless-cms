'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Typography,
} from '@repo/shared-ui';
import { toast } from 'sonner';
import { KeyRound, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid invitation link');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(API_PATHS.AUTH.ACCEPT_INVITE, {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });

      toast.success('Password set successfully. You can now log in.');
      router.push('/login');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Failed to accept invitation';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full border-border/80 shadow-md">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="size-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-1 border border-destructive/20">
            <AlertCircle className="size-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Invalid Link
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            This invitation link is invalid or missing the token. Please contact
            your administrator for a new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => router.push('/login')}
          >
            <ArrowLeft className="size-4" />
            <span>Go to Login</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/80 shadow-md">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1 border border-primary/20">
          <KeyRound className="size-5" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Set your password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Please set a password to activate your account.
        </CardDescription>
      </CardHeader>

      <form method="POST" onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="password">
              <Typography
                variant="label"
                className="block text-xs font-medium text-foreground cursor-pointer"
              >
                New Password
              </Typography>
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(val: string) => setPassword(val)}
              variant="default"
              placeholder="Enter at least 8 characters"
              showPasswordToggle={true}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-muted-foreground">
              Must be at least 8 characters long.
            </p>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="confirmPassword">
              <Typography
                variant="label"
                className="block text-xs font-medium text-foreground cursor-pointer"
              >
                Confirm Password
              </Typography>
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(val: string) => setConfirmPassword(val)}
              variant="default"
              placeholder="Re-enter your password"
              showPasswordToggle={true}
              autoComplete="new-password"
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
            disabled={isSubmitting || !password || !confirmPassword}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Activating Account...</span>
              </>
            ) : (
              <span>Activate Account</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
