'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Switch,
  Button,
  Tooltip,
} from '@repo/shared-ui';
import type { PluginSummary } from '@/lib/api/plugins';
import {
  Blocks,
  Network,
  Zap,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PluginCardProps {
  plugin: PluginSummary;
  isAdmin: boolean;
  isToggling?: boolean;
  onToggle: (id: string, isEnabled: boolean) => void;
  onConfigure: (plugin: PluginSummary) => void;
}

export function PluginCard({
  plugin,
  isAdmin,
  isToggling = false,
  onToggle,
  onConfigure,
}: PluginCardProps) {
  const isEnabled = plugin.isEnabled;
  const isError = plugin.status === 'error';
  const routesCount = plugin.routes?.length ?? 0;
  const hooksCount = plugin.hooks?.length ?? 0;

  return (
    <Card
      className={`group relative flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-md ${
        isEnabled
          ? 'border-border/80 bg-card'
          : 'border-border/40 bg-card/60 opacity-85'
      }`}
    >
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  isError
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : isEnabled
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-muted bg-muted/40 text-muted-foreground'
                }`}
              >
                <Blocks className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold leading-none">
                    {plugin.name}
                  </CardTitle>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {plugin.id}
                  </span>
                  <Badge
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px]"
                  >
                    v{plugin.version}
                  </Badge>
                </div>
                {plugin.author && (
                  <p className="text-xs text-muted-foreground">
                    by{' '}
                    <span className="font-medium text-foreground/80">
                      {plugin.author}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {isError ? (
                <Tooltip
                  content={
                    <div className="max-w-xs space-y-1 text-xs">
                      <p className="font-semibold text-rose-300">
                        Plugin Error
                      </p>
                      <p>
                        {plugin.error ||
                          'Failed to load or initialize properly.'}
                      </p>
                    </div>
                  }
                >
                  <span className="inline-flex cursor-help">
                    <Badge
                      variant="destructive"
                      size="sm"
                      className="gap-1 font-medium"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Error
                    </Badge>
                  </span>
                </Tooltip>
              ) : isEnabled ? (
                <Badge
                  variant="success"
                  size="sm"
                  className="gap-1 font-medium"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="font-medium text-muted-foreground"
                >
                  Disabled
                </Badge>
              )}
            </div>
          </div>

          <CardDescription className="mt-2 line-clamp-2 text-xs leading-relaxed">
            {plugin.description || 'No description provided for this plugin.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Capabilities Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Hooks Badge & Tooltip */}
            {hooksCount > 0 ? (
              <Tooltip
                content={
                  <div className="max-w-sm space-y-1.5 p-1 text-xs">
                    <p className="font-semibold text-foreground">
                      Subscribed Hooks ({hooksCount}):
                    </p>
                    <ul className="list-inside list-disc space-y-0.5 font-mono text-[11px] text-muted-foreground">
                      {plugin.hooks.map((hook) => (
                        <li key={hook} className="text-emerald-400">
                          {hook}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              >
                <span className="inline-flex cursor-help">
                  <Badge
                    variant="purple"
                    size="sm"
                    className="gap-1.5 transition-colors hover:brightness-110"
                  >
                    <Zap className="h-3 w-3" />
                    <span>
                      {hooksCount} {hooksCount === 1 ? 'Hook' : 'Hooks'}
                    </span>
                  </Badge>
                </span>
              </Tooltip>
            ) : (
              <Badge
                variant="outline"
                size="sm"
                className="gap-1 text-muted-foreground opacity-75"
              >
                <Zap className="h-3 w-3" />
                <span>0 Hooks</span>
              </Badge>
            )}

            {/* Routes Badge & Tooltip */}
            {routesCount > 0 ? (
              <Tooltip
                content={
                  <div className="max-w-sm space-y-1.5 p-1 text-xs">
                    <p className="font-semibold text-foreground">
                      Custom Routes ({routesCount}):
                    </p>
                    <div className="space-y-1 font-mono text-[11px]">
                      {plugin.routes.map((route, idx) => (
                        <div
                          key={`${route.method}-${route.path}-${idx}`}
                          className="flex items-center gap-1.5 rounded bg-black/20 px-1.5 py-0.5"
                        >
                          <span className="font-bold text-sky-400">
                            {route.method}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {route.path}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                <span className="inline-flex cursor-help">
                  <Badge
                    variant="info"
                    size="sm"
                    className="gap-1.5 transition-colors hover:brightness-110"
                  >
                    <Network className="h-3 w-3" />
                    <span>
                      {routesCount} {routesCount === 1 ? 'Route' : 'Routes'}
                    </span>
                  </Badge>
                </span>
              </Tooltip>
            ) : (
              <Badge
                variant="outline"
                size="sm"
                className="gap-1 text-muted-foreground opacity-75"
              >
                <Network className="h-3 w-3" />
                <span>0 Routes</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-3">
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                disabled={isToggling}
                onCheckedChange={(checked) => onToggle(plugin.id, checked)}
                aria-label={`Toggle ${plugin.name} status`}
                variant="default"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ) : (
            <Tooltip content="Administrator permissions required to toggle plugin status">
              <div className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <Switch
                  checked={isEnabled}
                  disabled
                  aria-label={`Toggle ${plugin.name} status`}
                />
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </Tooltip>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onConfigure(plugin)}
          className="gap-1.5 text-xs font-medium"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
}
