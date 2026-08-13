import React, { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useHydrateAuth } from '../../features/auth/hooks/useAuthMutations';

export const AuthHydrator = ({ children }: { children: React.ReactNode }) => {
  const status = useAuthStore((state) => state.status);
  const { refetch } = useHydrateAuth();

  useEffect(() => {
    if (status === 'idle') {
      void refetch();
    }
  }, [refetch, status]);

  return <>{children}</>;
};
