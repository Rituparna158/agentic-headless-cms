'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Badge, Button, Card } from '@repo/shared-ui';
import {
  listWebhookDeliveries,
  type WebhookDeliveryRecord,
} from '@/lib/api/webhooks';
import type { WebhookRecord } from '@repo/types';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Radio,
  Globe,
  Tag,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookDeliveriesDrawerProps {
  webhook: WebhookRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookDeliveriesDrawer({
  webhook,
  open,
  onOpenChange,
}: WebhookDeliveriesDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(
    null,
  );
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['webhook-deliveries', webhook?.id],
    queryFn: () => listWebhookDeliveries(webhook!.id),
    enabled: open && !!webhook?.id,
  });

  const copyUrlToClipboard = () => {
    if (!webhook?.url) return;
    navigator.clipboard.writeText(webhook.url);
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2000);
    toast.success('Webhook URL copied to clipboard');
  };

  const filteredDeliveries = React.useMemo(() => {
    if (filter === 'success') {
      return deliveries.filter(
        (d: WebhookDeliveryRecord) =>
          d.responseStatus && d.responseStatus >= 200 && d.responseStatus < 400,
      );
    }
    if (filter === 'failed') {
      return deliveries.filter(
        (d: WebhookDeliveryRecord) =>
          !d.responseStatus || d.responseStatus >= 400,
      );
    }
    return deliveries;
  }, [deliveries, filter]);

  const successCount = deliveries.filter(
    (d: WebhookDeliveryRecord) =>
      d.responseStatus && d.responseStatus >= 200 && d.responseStatus < 400,
  ).length;
  const failedCount = deliveries.filter(
    (d: WebhookDeliveryRecord) => !d.responseStatus || d.responseStatus >= 400,
  ).length;

  if (!webhook) return null;

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Delivery History"
      size="min(640px, 100vw)"
      className="w-full max-w-[100vw] sm:max-w-[640px]"
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
        {/* Webhook Summary Card */}
        <Card
          variant="default"
          className="p-4 sm:p-5 flex flex-col gap-4 min-w-0"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="size-4 text-primary shrink-0" />
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {webhook.name}
              </h3>
            </div>
            <Badge
              variant={webhook.isActive ? 'success' : 'secondary'}
              size="sm"
              className="font-bold"
            >
              {webhook.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0 bg-muted/40 p-2 rounded-md border border-border/50">
            <Globe className="size-3.5 text-muted-foreground/80 shrink-0" />
            <span className="truncate flex-1 max-w-full" title={webhook.url}>
              {webhook.url}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={copyUrlToClipboard}
              title="Copy URL"
            >
              {hasCopiedUrl ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium mr-1 flex items-center gap-1">
              <Tag className="size-3" /> Subscribed Events:
            </span>
            {webhook.events.map((evt) => (
              <Badge
                key={evt}
                variant="secondary"
                size="xs"
                className="font-mono text-[10px]"
              >
                {evt}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Filter Pills & Section Header */}
        <div className="flex flex-col gap-3 w-full min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-base font-semibold text-foreground">
              Deliveries ({deliveries.length})
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({deliveries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('success')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Success ({successCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('failed')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === 'failed'
                    ? 'bg-rose-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Failed ({failedCount})
              </button>
            </div>
          </div>

          {/* Deliveries List */}
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
              Loading deliveries…
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-10 px-4 border rounded-xl border-dashed bg-card/40">
              <p className="text-sm font-medium text-foreground">
                No deliveries found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === 'all'
                  ? 'Publish or update content to automatically trigger webhook deliveries.'
                  : `No ${filter} delivery records found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 w-full min-w-0">
              {filteredDeliveries.map((delivery: WebhookDeliveryRecord) => {
                const isSuccess =
                  delivery.responseStatus &&
                  delivery.responseStatus >= 200 &&
                  delivery.responseStatus < 400;
                const isExpanded = expandedDeliveryId === delivery.id;

                return (
                  <Card
                    key={delivery.id}
                    variant="outline"
                    className="p-0 overflow-hidden min-w-0 transition-all hover:border-border/80"
                  >
                    <div
                      className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none gap-2"
                      onClick={() =>
                        setExpandedDeliveryId(isExpanded ? null : delivery.id)
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 shrink-0">
                            <CheckCircle2 className="size-3" />
                            {delivery.responseStatus} OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 shrink-0">
                            <XCircle className="size-3" />
                            {delivery.responseStatus ?? 'FAILED'}
                          </span>
                        )}
                        <span className="font-mono text-xs font-medium text-foreground truncate">
                          {delivery.eventType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground/80" />
                          <span>
                            {new Date(delivery.createdAt).toLocaleTimeString(
                              undefined,
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expandable JSON Payload with whitespace-pre-wrap & break-all */}
                    {isExpanded && (
                      <div className="px-3 sm:px-3.5 pb-3.5 pt-2 border-t border-border/60 space-y-2 bg-muted/20 min-w-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">
                            Dispatched Payload
                          </span>
                          <span className="text-[11px] font-mono">
                            Attempt {delivery.attempt}
                          </span>
                        </div>
                        <pre className="p-2.5 sm:p-3 bg-muted/60 rounded-md text-[11px] font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed max-w-full overflow-x-hidden">
                          {JSON.stringify(delivery.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
