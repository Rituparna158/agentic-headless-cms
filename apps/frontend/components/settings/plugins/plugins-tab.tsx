'use client';

import React, { useState, useMemo } from 'react';
import {
  Input,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  EmptyStateIllustration,
  EmptyStateHeading,
  EmptyStateDesc,
  EmptyStateActions,
} from '@repo/shared-ui';
import { usePlugins, useTogglePluginStatus } from '@/hooks/use-plugins';
import { useAuthStore } from '@/stores/auth-store';
import { PluginCard } from './plugin-card';
import { PluginConfigDrawer } from './plugin-config-drawer';
import type { PluginSummary } from '@/lib/api/plugins';
import {
  Search,
  RotateCw,
  Blocks,
  FilterX,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export function PluginsTab() {
  const [search, setSearch] = useState('');
  const [activeDrawerPlugin, setActiveDrawerPlugin] =
    useState<PluginSummary | null>(null);

  const {
    data: plugins = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePlugins();

  const toggleStatusMutation = useTogglePluginStatus();

  const user = useAuthStore((state) => state.user);
  const isAdmin =
    user?.roles?.some((r) => r === 'admin' || r === 'super_admin') ?? false;

  // Filter plugins based on search query
  const filteredPlugins = useMemo(() => {
    if (!search.trim()) return plugins;
    const q = search.toLowerCase();
    return plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.hooks?.some((h) => h.toLowerCase().includes(q)),
    );
  }, [plugins, search]);

  const activeCount = useMemo(
    () => plugins.filter((p) => p.isEnabled).length,
    [plugins],
  );

  const handleToggle = (id: string, isEnabled: boolean) => {
    toggleStatusMutation.mutate({ id, isEnabled });
  };

  const handleConfigure = (plugin: PluginSummary) => {
    setActiveDrawerPlugin(plugin);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Plugin Management
            </h2>
            <Badge variant="purple" size="sm" className="font-medium">
              {activeCount} Active / {plugins.length} Installed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Inspect active extensions, subscribed lifecycle hooks, exposed HTTP
            routes, and secrets.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              variant="default"
              value={search}
              onChange={(val: string) => setSearch(val)}
              className="h-9 pl-9 text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 p-0"
            title="Refresh plugins"
          >
            <RotateCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin text-primary' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Non-Admin Warning Notice */}
      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-500">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            You are viewing plugins with read-only permissions. Modifying plugin
            configurations or toggling statuses requires an administrator role.
          </span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {(error as Error)?.message || 'Failed to load installed plugins.'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State: No plugins installed */}
      {!isLoading && !isError && plugins.length === 0 && (
        <EmptyState variant="minimal" tilt={false} className="py-12">
          <EmptyStateIllustration icon={Blocks} accent="primary" />
          <EmptyStateHeading title="No plugins installed" />
          <EmptyStateDesc description="Extend your CMS functionality by dropping custom or community plugins into the /plugins directory." />
          <EmptyStateActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Scan for Plugins
            </Button>
          </EmptyStateActions>
        </EmptyState>
      )}

      {/* Empty State: Search filter yielded 0 results */}
      {!isLoading &&
        !isError &&
        plugins.length > 0 &&
        filteredPlugins.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-12 text-center">
            <FilterX className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <h3 className="text-sm font-semibold text-foreground">
              No matching plugins found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              We couldn't find any plugin matching &quot;{search}&quot;. Try
              adjusting your keywords.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
              className="mt-3 text-xs"
            >
              Clear Filter
            </Button>
          </div>
        )}

      {/* Plugin Cards Grid */}
      {!isLoading && !isError && filteredPlugins.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              isAdmin={isAdmin}
              isToggling={
                toggleStatusMutation.isPending &&
                toggleStatusMutation.variables?.id === plugin.id
              }
              onToggle={handleToggle}
              onConfigure={handleConfigure}
            />
          ))}
        </div>
      )}

      {/* Plugin Configuration Drawer */}
      <PluginConfigDrawer
        plugin={activeDrawerPlugin}
        isOpen={Boolean(activeDrawerPlugin)}
        isAdmin={isAdmin}
        onClose={() => setActiveDrawerPlugin(null)}
      />
    </div>
  );
}
