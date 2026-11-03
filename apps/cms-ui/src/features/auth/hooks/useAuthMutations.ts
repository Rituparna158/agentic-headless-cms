import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { LoginInput, AuthenticatedUser } from '@repo/types';

export const useLoginMutation = () => {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const setMfaChallenge = useAuthStore((state) => state.setMfaChallenge);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      if ('mfaRequired' in data && data.mfaRequired) {
        setMfaChallenge(data.mfaToken);
      } else {
        queryClient.setQueryData(['currentUser'], data);
        setAuthData(data as AuthenticatedUser);
      }
    },
  });
};

export const useVerifyMfaMutation = () => {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mfaToken, code }: { mfaToken: string; code: string }) =>
      authApi.verifyMfaChallenge(mfaToken, code),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      setAuthData(user);
    },
  });
};

export const useLogoutMutation = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
    onError: () => {
      // Even if it fails (e.g. network error), we should probably clear local state
      clearAuth();
      queryClient.clear();
    },
  });
};

export const useHydrateAuth = () => {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setStatus = useAuthStore((state) => state.setStatus);
  const status = useAuthStore((state) => state.status);

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: ({ signal }) => authApi.getCurrentUser({ signal }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: status === 'idle',
  });

  useEffect(() => {
    if (query.isLoading || (status === 'idle' && query.isFetching)) {
      setStatus('loading');
    } else if (query.isSuccess && query.data) {
      setAuthData(query.data);
    } else if (query.isError) {
      clearAuth();
    }
  }, [
    query.isLoading,
    query.isFetching,
    query.isSuccess,
    query.isError,
    query.data,
    status,
    setAuthData,
    clearAuth,
    setStatus,
  ]);

  return query;
};
