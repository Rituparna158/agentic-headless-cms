import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={<div className="flex justify-center p-8">Loading...</div>}
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
