import type { PluginDefinition, AdminUiExtensions } from '@repo/plugin-sdk';
import type { Router } from 'express';

export type PluginStatus = 'active' | 'error' | 'disabled';

export interface LoadedPlugin {
  definition: PluginDefinition;
  status: PluginStatus;
  loadedAt: Date;
  error?: string;
  routesCount: number;
  hooksCount: number;
  router?: Router;
  config?: Record<string, unknown>;
  isEnabled?: boolean;
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
  routes: Array<{
    method: string;
    path: string;
  }>;
  hooks: string[];
  uiExtensions?: AdminUiExtensions;
}

export interface HookExecutionStats {
  totalDispatched: number;
  totalErrors: number;
}
