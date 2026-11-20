'use client';

import { useQuery } from '@tanstack/react-query';
import { Drawer, Button, Skeleton } from '@repo/shared-ui';
import { getWorkflowHistory } from '@/lib/api/workflows';
import type { WorkflowHistoryRecord } from '@repo/types';
import { History, Clock, User, Bot, MessageSquare } from 'lucide-react';

interface WorkflowHistoryDrawerProps {
  schemaSlug: string;
  entryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateVal: string | Date): string {
  try {
    const d = new Date(dateVal);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateVal);
  }
}

function formatStageName(slug?: string): string {
  if (!slug) return '';
  return slug
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function WorkflowHistoryDrawer({
  schemaSlug,
  entryId,
  open,
  onOpenChange,
}: WorkflowHistoryDrawerProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['entry-workflow-history', schemaSlug, entryId],
    queryFn: () => getWorkflowHistory(schemaSlug, entryId),
    enabled: open && !!entryId,
  });

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Workflow Transition History"
      size="min(560px, 100vw)"
      className="w-full max-w-[100vw] sm:max-w-[560px]"
      position="right"
      animationType="slide"
      footer={
        <div className="flex justify-end w-full">
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
      <div className="flex flex-col gap-4 p-1">
        <p className="text-xs text-muted-foreground">
          Audit timeline of stage movements, approvals, and review comments for
          this entry.
        </p>

        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xl bg-card/40 text-muted-foreground text-sm">
            <History className="size-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="font-medium text-foreground text-xs">
              No stage transitions recorded yet
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Transitions and review comments will appear here as the entry
              moves through stages.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 pt-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
            {history.map((item: WorkflowHistoryRecord) => {
              const isInitialCreation = item.fromStage === item.toStage;
              const actorDisplay =
                item.actorName ||
                item.actorEmail ||
                item.actorUserId ||
                (item.actorType === 'agent' ? 'AI Agent' : 'User');

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Icon Marker */}
                  <div className="absolute -left-6 top-1 size-5 rounded-full border border-border/80 bg-background flex items-center justify-center text-muted-foreground shadow-2xs">
                    {item.actorType === 'agent' ? (
                      <Bot className="size-3" />
                    ) : (
                      <User className="size-3" />
                    )}
                  </div>

                  <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2 hover:border-border transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-xs text-foreground">
                        {item.action ||
                          (isInitialCreation
                            ? 'Entry Created'
                            : 'Stage Transition')}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Stage Transition Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs">
                      {isInitialCreation ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {formatStageName(item.toStage)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            (Initial Stage)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {formatStageName(item.fromStage)}
                          </span>
                          <span className="text-muted-foreground/60 font-normal">
                            to
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatStageName(item.toStage)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actor details */}
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>By:</span>
                      <span className="text-foreground font-medium">
                        {actorDisplay}
                      </span>
                    </div>

                    {/* Comment box if provided */}
                    {item.comment && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/40 text-xs text-foreground/90">
                        <MessageSquare className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed break-words">
                          {item.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
