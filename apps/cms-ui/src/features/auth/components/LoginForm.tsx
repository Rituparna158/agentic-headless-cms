import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { CredentialsForm } from './CredentialsForm';
import { MfaChallengeForm } from './MfaChallengeForm';
import { useEffect } from 'react';
export function LoginForm() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/');
    }
  }, [status, navigate]);

  const [searchParams] = useSearchParams();
  const urlError = searchParams.get('error');

  if (status === 'mfa_challenge_required') {
    return <MfaChallengeForm />;
  }

  return (
    <div className="space-y-4">
      {urlError && (
        <div className="mb-4">
          <p
            role="alert"
            className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20"
          >
            {urlError}
          </p>
        </div>
      )}
      <CredentialsForm />
    </div>
  );
}
