import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { LoginInput, AuthenticatedUser } from '@repo/types';

export const useLoginMutation = () => {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const setMfaChallenge = useAuthStore((state) => state.setMfaChallenge);

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      if ('mfaRequired' in data && data.mfaRequired) {
        setMfaChallenge(data.mfaToken);
      } else {
        setAuthData(data as AuthenticatedUser);
      }
    },
  });
};

export const useVerifyMfaMutation = () => {
  const setAuthData = useAuthStore((state) => state.setAuthData);

  return useMutation({
    mutationFn: ({ mfaToken, code }: { mfaToken: string; code: string }) =>
      authApi.verifyMfaChallenge(mfaToken, code),
    onSuccess: (user) => {
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

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      setStatus('loading');
      try {
        const user = await authApi.getCurrentUser();
        setAuthData(user);
        return user;
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
