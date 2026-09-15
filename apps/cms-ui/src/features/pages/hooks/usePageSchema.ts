import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '../api/pages.api';

export function usePageSchema() {
  return useQuery({
    queryKey: ['schema', 'page'],
    queryFn: () => pagesApi.ensurePageSchema(),
    staleTime: Infinity,
    retry: false,
  });
}
