import { Suspense } from 'react';
import { Metadata } from 'next';
import { MfaResetCompleteForm } from '@/components/auth/mfa-reset-complete-form';

export const metadata: Metadata = {
  title: 'Complete MFA Reset | Agentic CMS',
  description: 'Complete your MFA reset request.',
};

export default function MfaResetCompletePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Complete MFA Reset
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border border-border">
          <Suspense
            fallback={<div className="p-4 text-center">Loading...</div>}
          >
            <MfaResetCompleteForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
