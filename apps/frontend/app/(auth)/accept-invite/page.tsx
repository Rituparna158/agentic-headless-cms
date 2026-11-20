import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

export const metadata: Metadata = {
  title: 'Activate Account — Headless CMS',
};

export default function AcceptInvitePage() {
  return (
    <div className="w-full max-w-md p-4 animate-in fade-in-50 duration-200">
      <Suspense
        fallback={
          <div className="text-center text-sm text-muted-foreground p-8">
            Loading...
          </div>
        }
      >
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
