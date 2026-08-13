export const authKeys = {
  me: ['cms', 'auth', 'me'] as const,
};

export const schemaKeys = {
  all: ['cms', 'schema'] as const,
  lists: () => [...schemaKeys.all, 'list'] as const,
  details: () => [...schemaKeys.all, 'detail'] as const,
  detail: (slug: string) => [...schemaKeys.details(), slug] as const,
};

export const contentKeys = {
  all: ['cms', 'content'] as const,
  lists: (schemaSlug: string) =>
    [...contentKeys.all, schemaSlug, 'list'] as const,
  list: (schemaSlug: string, options?: unknown) =>
    [...contentKeys.lists(schemaSlug), options] as const,
  details: (schemaSlug: string) =>
    [...contentKeys.all, schemaSlug, 'detail'] as const,
  detail: (schemaSlug: string, entryId: string) =>
    [...contentKeys.details(schemaSlug), entryId] as const,
};
