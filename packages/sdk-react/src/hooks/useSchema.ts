import { useQuery } from '@tanstack/react-query';
import { useCmsClient } from '../provider.js';

import { schemaKeys } from '../constants.js';

export function useSchemas() {
  const client = useCmsClient();
  return useQuery({
    queryKey: schemaKeys.lists(),
    queryFn: () => client.schema.list(),
  });
}

export function useSchema(slug: string) {
  const client = useCmsClient();
  return useQuery({
    queryKey: schemaKeys.detail(slug),
    queryFn: () => client.schema.get(slug),
    enabled: !!slug,
  });
}
