import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { mediaApi } from '../api/media.api';
import type { CreateMediaFolderInput } from '../types/media.types';
import { MEDIA_QUERY_KEYS } from '../constants/media.constants';

export function useInfiniteMedia(params?: {
  folderId?: string;
  search?: string;
  pageSize?: number;
}) {
  const pageSize = params?.pageSize || 24;

  return useInfiniteQuery({
    queryKey: MEDIA_QUERY_KEYS.infinite({
      folderId: params?.folderId,
      search: params?.search,
    }),
    queryFn: ({ pageParam = 1, signal }) =>
      mediaApi.listMedia(
        {
          page: pageParam as number,
          pageSize,
          folderId: params?.folderId,
        },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pageCount } = lastPage.meta.pagination;
      return page < pageCount ? page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
}

export function useMediaFolders(parentFolderId?: string) {
  return useQuery({
    queryKey: MEDIA_QUERY_KEYS.folders(parentFolderId),
    queryFn: ({ signal }) => mediaApi.listFolders(parentFolderId, { signal }),
    staleTime: 60 * 1000,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      options,
    }: {
      file: File;
      options?: {
        altText?: string;
        folderId?: string;
        onProgress?: (percent: number) => void;
      };
    }) => mediaApi.uploadMedia(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEYS.all });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEYS.all });
    },
  });
}

export function useDeleteBulkMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => mediaApi.deleteBulkMedia(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEYS.all });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMediaFolderInput) => mediaApi.createFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEYS.all });
    },
  });
}
