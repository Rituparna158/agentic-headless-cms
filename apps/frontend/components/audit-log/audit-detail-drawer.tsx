'use client';

import * as React from 'react';
import {
  Badge,
  Drawer,
  Button,
  Tabs,
  Card,
  Avatar,
  ScrollArea,
} from '@repo/shared-ui';
import type { AuditLogRecord } from '@repo/types';
import { Clock, Bot, Globe, FileText, Copy, Check } from 'lucide-react';

interface AuditDetailDrawerProps {
  log: AuditLogRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const ACTION_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  create: 'success',
  update: 'info',
  publish: 'success',
  rollback: 'warning',
  unpublish: 'warning',
  delete: 'destructive',
  login: 'default',
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatNetworkOrigin(ip?: string): string {
  if (!ip || ip.trim() === '' || ip === 'Internal' || ip === 'unknown') {
    return 'Internal Session';
  }
  if (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('127.') ||
    ip === 'localhost' ||
    ip === '::ffff:127.0.0.1'
  ) {
    return 'Localhost Session';
  }
  if (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.31.')
  ) {
    return `Private Network (${ip})`;
  }
  return ip;
}

export function AuditDetailDrawer({
  log,
  open,
  onOpenChange,
}: AuditDetailDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<'diff' | 'raw'>('diff');
  const [copiedId, setCopiedId] = React.useState(false);
  const payloadRef = React.useRef<HTMLDivElement>(null);

  const handleTabChange = React.useCallback((idx: number) => {
    const scrollContainer = payloadRef.current?.closest('main');
    const prevScrollTop = scrollContainer?.scrollTop;

    setActiveTab(idx === 0 ? 'diff' : 'raw');

    if (scrollContainer && prevScrollTop !== undefined) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = prevScrollTop;
      });
    }
  }, []);

  const resourceTitle = React.useMemo(() => {
    if (!log) return null;
    const state = (log.afterState || log.beforeState || {}) as Record<
      string,
      unknown
    >;
    const data = (
      state.data && typeof state.data === 'object' ? state.data : state
    ) as Record<string, unknown>;
    const val =
      (typeof data.title === 'string' && data.title) ||
      (typeof data.name === 'string' && data.name) ||
      (typeof data.displayName === 'string' && data.displayName) ||
      (typeof data.slug === 'string' && data.slug);
    return val || null;
  }, [log]);

  if (!log) return null;

  const actorName =
    log.actorFirstName && log.actorLastName
      ? `${log.actorFirstName} ${log.actorLastName}`
      : log.actorEmail || 'System';

  const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const contextObj = (
    log.context && typeof log.context === 'object' ? log.context : {}
  ) as Record<string, unknown>;
  const ipAddress =
    (typeof contextObj.ip === 'string' ? contextObj.ip : undefined) ||
    (typeof contextObj.ipAddress === 'string'
      ? contextObj.ipAddress
      : undefined) ||
    'Internal';

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Audit Event Details"
      size="min(840px, 100vw)"
      className="w-full max-w-[100vw] sm:max-w-[840px]"
      position="right"
      animationType="slide"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-1 w-full max-w-full overflow-x-hidden">
        {/* Top Summary Card */}
        <Card
          variant="default"
          className="p-4 sm:p-6 md:p-7 flex flex-col gap-6"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2">
            <Badge
              variant={
                ACTION_BADGE_VARIANTS[log.action.toLowerCase()] || 'default'
              }
              size="md"
              className="font-bold tracking-wider"
            >
              {log.action.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Clock className="size-4 text-muted-foreground/80" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Resource & Actor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 block mb-2">
                Resource
              </span>
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm flex-wrap">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="capitalize text-base font-semibold truncate max-w-[200px] sm:max-w-[260px]">
                  {resourceTitle || log.resourceType}
                </span>
                {resourceTitle && (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="capitalize text-[11px] font-normal text-muted-foreground"
                  >
                    {log.resourceType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-0.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Ref:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(log.resourceId);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer group"
                  title={`Click to copy full ID: ${log.resourceId}`}
                  aria-label="Copy resource ID"
                >
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {log.resourceId.length > 18
                      ? `${log.resourceId.slice(0, 8)}…${log.resourceId.slice(-6)}`
                      : log.resourceId}
                  </span>
                  {copiedId ? (
                    <Check className="size-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="size-3 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 block mb-2">
                Actor
              </span>
              <div className="flex items-center gap-2.5 font-semibold text-foreground text-sm">
                {log.actorType === 'agent' ? (
                  <Bot className="size-4 text-purple-500 shrink-0" />
                ) : (
                  <Avatar size="xs" letters={initialsFor(actorName)} />
                )}
                <span className="truncate text-base">{actorName}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-0.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Role:
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="text-[11px] capitalize font-medium px-2 py-0.5"
                >
                  {log.actorType === 'agent'
                    ? 'Automated Agent'
                    : log.actorType === 'system'
                      ? 'System Process'
                      : 'User Member'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Context / Metadata */}
          <div className="pt-4 border-t border-border/30 flex items-center text-xs text-muted-foreground mt-1">
            <div
              className="flex items-center gap-2"
              title={`Raw IP: ${ipAddress}`}
            >
              <Globe className="size-4 text-muted-foreground/80 shrink-0" />
              <span>Network: {formatNetworkOrigin(ipAddress)}</span>
            </div>
          </div>
        </Card>

        {/* State Diff / JSON Viewer */}
        <div
          ref={payloadRef}
          className="flex flex-col gap-3 w-full min-w-0 min-h-[380px]"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-base font-semibold text-foreground">
              Change Payload
            </h4>
            {/* Shared UI Tabs */}
            <Tabs
              options={['Comparison', 'Full JSON']}
              selected={activeTab === 'diff' ? 0 : 1}
              value={handleTabChange}
              variant="block"
              size="sm"
            />
          </div>

          <div
            className={
              activeTab === 'diff'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 overflow-hidden'
                : 'hidden'
            }
          >
            {/* Before State Card */}
            <Card
              variant="outline"
              className="flex flex-col overflow-hidden p-0 h-full min-w-0"
            >
              <div className="px-3.5 py-2.5 bg-muted/60 border-b border-border text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Before State</span>
                {!log.beforeState && (
                  <span className="text-xs text-muted-foreground/80 font-normal">
                    None (Created)
                  </span>
                )}
              </div>
              <ScrollArea
                className="h-80 w-full p-4 font-mono text-xs leading-relaxed overflow-x-hidden"
                fadeMask="auto"
              >
                {log.beforeState ? (
                  <pre className="text-muted-foreground whitespace-pre-wrap break-all font-mono text-xs leading-relaxed max-w-full">
                    {JSON.stringify(log.beforeState, null, 2)}
                  </pre>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">
                    No previous state
                  </span>
                )}
              </ScrollArea>
            </Card>

            {/* After State Card */}
            <Card
              variant="outline"
              className="flex flex-col overflow-hidden p-0 h-full min-w-0"
            >
              <div className="px-3.5 py-2.5 bg-muted/60 border-b border-border text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>After State</span>
                {!log.afterState && (
                  <span className="text-xs text-muted-foreground/80 font-normal">
                    None (Deleted)
                  </span>
                )}
              </div>
              <ScrollArea
                className="h-80 w-full p-4 font-mono text-xs leading-relaxed overflow-x-hidden"
                fadeMask="auto"
              >
                {log.afterState ? (
                  <pre className="text-foreground whitespace-pre-wrap break-all font-mono text-xs leading-relaxed max-w-full">
                    {JSON.stringify(log.afterState, null, 2)}
                  </pre>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">
                    No after state
                  </span>
                )}
              </ScrollArea>
            </Card>
          </div>

          <div
            className={activeTab === 'raw' ? 'block w-full min-w-0' : 'hidden'}
          >
            <Card variant="outline" className="p-0 overflow-hidden min-w-0">
              <ScrollArea
                className="h-96 w-full p-4 font-mono text-xs leading-relaxed overflow-x-hidden"
                fadeMask="auto"
              >
                <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed max-w-full">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
