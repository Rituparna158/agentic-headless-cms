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
} from '@repo/shared-ui';
import { Button, Input, Typography } from '@repo/shared-ui';
import { toast } from 'sonner';
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
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Invalid Link</CardTitle>
          <CardDescription className="text-center text-red-500">
            This invitation link is invalid or missing the token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Set your password
        </CardTitle>
        <CardDescription className="text-center">
          Please set a password to activate your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password">
              <Typography variant="label" className="block mb-1">
                New Password
              </Typography>
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(val) => setPassword(val)}
              variant="default"
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword">
              <Typography variant="label" className="block mb-1">
                Confirm Password
              </Typography>
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(val) => setConfirmPassword(val)}
              variant="default"
              placeholder="Confirm new password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Activating...' : 'Activate Account'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
