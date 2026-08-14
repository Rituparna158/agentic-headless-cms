import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCmsClient } from '../provider.js';
import type { ListContentEntriesOptions } from '@repo/types';

import { contentKeys } from '../constants.js';

export function useContentList(
  schemaSlug: string,
  options?: ListContentEntriesOptions,
) {
  const client = useCmsClient();
  return useQuery({
    queryKey: contentKeys.list(schemaSlug, options),
    queryFn: () => client.content.list(schemaSlug, options),
  });
}

export function useContentEntry(
  schemaSlug: string,
  entryId: string,
  options?: { locale?: string },
) {
  const client = useCmsClient();
  return useQuery({
    queryKey: contentKeys.detail(schemaSlug, entryId),
    queryFn: () => client.content.findOne(schemaSlug, entryId, options),
    enabled: !!entryId,
  });
}

export function useCreateEntry(schemaSlug: string) {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      client.content.create(schemaSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(schemaSlug),
      });
    },
  });
}

export function useUpdateEntry(schemaSlug: string, entryId: string) {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      client.content.update(schemaSlug, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(schemaSlug),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(schemaSlug, entryId),
      });
    },
  });
}

export function useDeleteEntry(schemaSlug: string) {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => client.content.delete(schemaSlug, entryId),
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(schemaSlug),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(schemaSlug, entryId),
      });
    },
  });
}

export function usePublishEntry(schemaSlug: string) {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      client.content.publish(schemaSlug, entryId),
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(schemaSlug),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(schemaSlug, entryId),
      });
    },
  });
}

export function useUpdateEntryPartial(schemaSlug: string, entryId: string) {
  const client = useCmsClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      client.content.updatePartial(schemaSlug, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(schemaSlug),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(schemaSlug, entryId),
      });
    },
  });
}

export function useContentVersions(
  schemaSlug: string,
  entryId: string,
  options?: { locale?: string },
) {
  const client = useCmsClient();
  return useQuery({
    queryKey: ['content', schemaSlug, entryId, 'versions', options],
    queryFn: () => client.content.versions(schemaSlug, entryId, options),
    enabled: !!entryId,
  });
}
