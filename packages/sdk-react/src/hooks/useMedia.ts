import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCmsClient } from '../provider.js';
import type { ListMediaOptions } from '@repo/types';

import { mediaKeys } from '../constants.js';

export function useMediaList(options?: ListMediaOptions) {
  const client = useCmsClient();
  return useQuery({
    queryKey: mediaKeys.list(options),
    queryFn: () => client.media.list(options),
  });
}

export function useMediaEntry(id: string) {
  const client = useCmsClient();
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => client.media.get(id),
    enabled: !!id,
  });
}

export function useDeleteMedia() {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.media.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: mediaKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: mediaKeys.detail(id),
      });
    },
  });
}

export function useDeleteMediaBulk() {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => client.media.deleteBulk(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({
        queryKey: mediaKeys.lists(),
      });
      ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: mediaKeys.detail(id),
        });
      });
    },
  });
}
