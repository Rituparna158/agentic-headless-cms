import { apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';

export type PluginStatus = 'active' | 'error' | 'disabled';

export interface PluginRoute {
  method: string;
  path: string;
}

export interface PluginSummary {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  status: PluginStatus;
  isEnabled: boolean;
  config: Record<string, unknown>;
  loadedAt: string;
  error?: string;
  routes: PluginRoute[];
  hooks: string[];
  uiExtensions?: {
    settingsTab?: boolean;
    customViews?: Array<{ title: string; path: string }>;
  };
}

export async function getPlugins(options?: {
  unmask?: boolean;
}): Promise<PluginSummary[]> {
  const qs = options?.unmask ? '?unmask=true' : '';
  const result = await apiFetch<PluginSummary[]>(API_PATHS.PLUGINS.BASE(qs));
  return result ?? [];
}

export function getPlugin(
  id: string,
  options?: { unmask?: boolean },
): Promise<PluginSummary> {
  const qs = options?.unmask ? '?unmask=true' : '';
  return apiFetch<PluginSummary>(API_PATHS.PLUGINS.BY_ID(id, qs));
}

export function updatePluginStatus(
  id: string,
  isEnabled: boolean,
): Promise<PluginSummary> {
  return apiFetch<PluginSummary>(API_PATHS.PLUGINS.STATUS(id), {
    method: 'PATCH',
    body: JSON.stringify({ isEnabled }),
  });
}

export function updatePluginConfig(
  id: string,
  config: Record<string, unknown>,
): Promise<PluginSummary> {
  return apiFetch<PluginSummary>(API_PATHS.PLUGINS.CONFIG(id), {
    method: 'PUT',
    body: JSON.stringify({ config }),
  });
}
