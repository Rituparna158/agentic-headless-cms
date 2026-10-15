import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlugins,
  getPlugin,
  updatePluginStatus,
  updatePluginConfig,
  type PluginSummary,
} from '@/lib/api/plugins';
import { toast } from 'sonner';

export const PLUGINS_QUERY_KEY = ['plugins'] as const;

export function usePlugins(options?: { unmask?: boolean }) {
  return useQuery({
    queryKey: [...PLUGINS_QUERY_KEY, options?.unmask ?? false],
    queryFn: () => getPlugins(options),
  });
}

export function usePlugin(id: string, options?: { unmask?: boolean }) {
  return useQuery({
    queryKey: ['plugin', id, options?.unmask ?? false],
    queryFn: () => getPlugin(id, options),
    enabled: Boolean(id),
  });
}

export function useTogglePluginStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      updatePluginStatus(id, isEnabled),
    onMutate: async ({ id, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: PLUGINS_QUERY_KEY });

      const previousQueries = queryClient.getQueriesData<PluginSummary[]>({
        queryKey: PLUGINS_QUERY_KEY,
      });

      queryClient.setQueriesData<PluginSummary[]>(
        { queryKey: PLUGINS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return old.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                isEnabled,
                status: isEnabled
                  ? p.status === 'error'
                    ? 'error'
                    : 'active'
                  : 'disabled',
              };
            }
            return p;
          });
        },
      );

      return { previousQueries };
    },
    onError: (err: Error | { message?: string }, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(
        err?.message || `Failed to update status for ${variables.id}`,
      );
    },
    onSuccess: (updatedPlugin) => {
      toast.success(
        `Plugin "${updatedPlugin.name || updatedPlugin.id}" ${
          updatedPlugin.isEnabled ? 'enabled' : 'disabled'
        }`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PLUGINS_QUERY_KEY });
    },
  });
}

export function useUpdatePluginConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      config,
    }: {
      id: string;
      config: Record<string, unknown>;
    }) => updatePluginConfig(id, config),
    onMutate: async ({ id, config }) => {
      await queryClient.cancelQueries({ queryKey: PLUGINS_QUERY_KEY });
      const previousQueries = queryClient.getQueriesData<PluginSummary[]>({
        queryKey: PLUGINS_QUERY_KEY,
      });

      queryClient.setQueriesData<PluginSummary[]>(
        { queryKey: PLUGINS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return old.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                config: { ...p.config, ...config },
              };
            }
            return p;
          });
        },
      );

      return { previousQueries };
    },
    onError: (err: Error | { message?: string }, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(
        err?.message || `Failed to update configuration for ${variables.id}`,
      );
    },
    onSuccess: (updatedPlugin) => {
      toast.success(
        `Configuration for "${updatedPlugin.name || updatedPlugin.id}" saved`,
      );
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: PLUGINS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['plugin', variables.id] });
    },
  });
}
