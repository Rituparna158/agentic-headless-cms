import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCmsClient } from '../provider.js';
import type { LoginInput } from '@repo/types';

import { authKeys } from '../constants.js';

export function useAuth() {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  const { data: user, status } = useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const token = client.auth.getToken();
      if (!token) return null;
      return { token };
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => client.auth.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => client.auth.logout(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  return {
    user,
    status,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
