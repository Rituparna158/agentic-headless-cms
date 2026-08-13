import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { CredentialsForm } from './CredentialsForm';
import { MfaChallengeForm } from './MfaChallengeForm';

export function LoginForm() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/');
    }
  }, [status, navigate]);

  if (status === 'mfa_challenge_required') {
    return <MfaChallengeForm />;
  }

  return <CredentialsForm />;
}
