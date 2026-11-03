export const MEDIA_QUERY_KEYS = {
  all: ['media'] as const,
  infinite: (params?: { folderId?: string; search?: string }) =>
    ['media', 'infinite', params] as const,
  folders: (parentFolderId?: string) =>
    ['media-folders', { parentFolderId }] as const,
};
