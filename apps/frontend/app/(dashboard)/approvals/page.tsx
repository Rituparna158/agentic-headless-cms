'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  SquareCheck,
  ExternalLink,
  Clock,
  User,
  Layers,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  MessageSquareDiff,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPendingReviews, transitionEntry } from '@/lib/api/workflows';
import { useAuthStore } from '@/stores/auth-store';
import type { PendingReviewItem, PendingReviewsResult } from '@repo/types';
import {
  AdvancedTable,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  Modal,
  Textarea,
} from '@repo/shared-ui';

const columns = [
  { key: 'schema', label: 'Content Type', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'stage', label: 'Stage', sortable: true },
  { key: 'submittedBy', label: 'Submitted By', sortable: true },
  { key: 'updatedAt', label: 'Submitted At', sortable: true },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    align: 'right' as const,
  },
];

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const [searchQuery, setSearchQuery] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [requestChangesItem, setRequestChangesItem] =
    useState<PendingReviewItem | null>(null);
  const [changeComment, setChangeComment] = useState('');
  const [isSubmittingChanges, setIsSubmittingChanges] = useState(false);

  const canReview = useMemo(() => {
    if (!currentUser) return false;
    const normalizedRoles = (currentUser.roles || []).map((r) =>
      r.toLowerCase().trim(),
    );
    if (
      normalizedRoles.includes('admin') ||
      normalizedRoles.includes('super_admin') ||
      normalizedRoles.includes('editor')
    ) {
      return true;
    }
    return (
      currentUser.permissions?.some((p) =>
        ['*', 'publish', 'publish_content', 'review'].includes(p.action),
      ) ?? false
    );
  }, [currentUser]);

  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['workflows', 'pending-reviews'],
    queryFn: () => getPendingReviews(50),
    enabled: canReview,
    refetchInterval: 30000,
    staleTime: 0,
  });

  // Exclude entries authored or submitted by the current user (action-only inbox)
  const actionItems = useMemo(() => {
    const raw = pendingData?.items ?? [];
    if (!currentUser) return raw;
    return raw.filter((item) => {
      const isSelf =
        (!!currentUser.email &&
          !!item.authorEmail &&
          currentUser.email.toLowerCase() === item.authorEmail.toLowerCase()) ||
        (!!currentUser.id &&
          !!item.creatorUserId &&
          currentUser.id === item.creatorUserId) ||
        (!!currentUser.id &&
          !!item.submitterUserId &&
          currentUser.id === item.submitterUserId);
      return !isSelf;
    });
  }, [pendingData?.items, currentUser]);

  const total = actionItems.length;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return actionItems;
    const q = searchQuery.toLowerCase().trim();
    return actionItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.schemaName?.toLowerCase().includes(q) ||
        item.authorName?.toLowerCase().includes(q) ||
        item.authorEmail?.toLowerCase().includes(q) ||
        item.stageName?.toLowerCase().includes(q),
    );
  }, [actionItems, searchQuery]);

  const handleQuickApprove = useCallback(
    async (item: PendingReviewItem) => {
      const previousData = queryClient.getQueryData<PendingReviewsResult>([
        'workflows',
        'pending-reviews',
      ]);
      queryClient.setQueryData<PendingReviewsResult>(
        ['workflows', 'pending-reviews'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            total: Math.max(0, old.total - 1),
            items: old.items.filter((i) => i.entryId !== item.entryId),
          };
        },
      );

      try {
        setApprovingId(item.entryId);
        await transitionEntry(item.schemaSlug, item.entryId, {
          toStage: 'approved',
        });
        toast.success(`"${item.title}" approved successfully`);
      } catch (err: unknown) {
        if (previousData) {
          queryClient.setQueryData(
            ['workflows', 'pending-reviews'],
            previousData,
          );
        }
        const message =
          err instanceof Error ? err.message : 'Failed to approve item';
        toast.error(message);
      } finally {
        setApprovingId(null);
        await queryClient.invalidateQueries({
          queryKey: ['workflows', 'pending-reviews'],
        });
      }
    },
    [queryClient],
  );

  const handleConfirmRequestChanges = async () => {
    if (!requestChangesItem) return;
    const item = requestChangesItem;
    const previousData = queryClient.getQueryData<PendingReviewsResult>([
      'workflows',
      'pending-reviews',
    ]);
    queryClient.setQueryData<PendingReviewsResult>(
      ['workflows', 'pending-reviews'],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          total: Math.max(0, old.total - 1),
          items: old.items.filter((i) => i.entryId !== item.entryId),
        };
      },
    );

    try {
      setIsSubmittingChanges(true);
      await transitionEntry(item.schemaSlug, item.entryId, {
        toStage: 'draft',
        comment: changeComment.trim() || 'Changes requested during review.',
      });
      toast.success(`Changes requested for "${item.title}"`);
      setRequestChangesItem(null);
      setChangeComment('');
    } catch (err: unknown) {
      if (previousData) {
        queryClient.setQueryData(
          ['workflows', 'pending-reviews'],
          previousData,
        );
      }
      const message =
        err instanceof Error ? err.message : 'Failed to request changes';
      toast.error(message);
    } finally {
      setIsSubmittingChanges(false);
      await queryClient.invalidateQueries({
        queryKey: ['workflows', 'pending-reviews'],
      });
    }
  };

  const rows = useMemo(() => {
    return filteredItems.map((item) => {
      const isApproving = approvingId === item.entryId;

      return {
        schema: (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/60">
            <Layers className="size-3 text-muted-foreground" />
            <span>{item.schemaName}</span>
          </span>
        ),
        title: (
          <Link
            href={`/content/${item.schemaSlug}/${item.entryId}`}
            className="hover:underline text-foreground hover:text-primary font-semibold text-xs truncate max-w-xs block"
          >
            {item.title}
          </Link>
        ),
        stage: (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
            style={{
              borderColor: `${item.stageColor || '#f59e0b'}40`,
              backgroundColor: `${item.stageColor || '#f59e0b'}15`,
              color: item.stageColor || '#f59e0b',
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                backgroundColor: item.stageColor || '#f59e0b',
              }}
            />
            <span>{item.stageName}</span>
          </span>
        ),
        submittedBy: (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <User className="size-3 text-muted-foreground" />
            <span>{item.authorName || item.authorEmail || 'Unknown'}</span>
          </div>
        ),
        updatedAt: (
          <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap text-xs">
            <Clock className="size-3" />
            <span>
              {item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString()
                : 'Recently'}
            </span>
          </div>
        ),
        actions: (
          <div className="flex items-center justify-end gap-1">
            {/* Direct icon button to open entry in editor */}
            <Link
              href={`/content/${item.schemaSlug}/${item.entryId}`}
              className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              title="Review in editor"
              aria-label="Review in editor"
            >
              <ExternalLink className="size-4" />
            </Link>

            {/* Vertical 3-dot dropdown menu containing Approve and Request Changes */}
            <Dropdown
              align="end"
              sideOffset={4}
              className="w-44 p-1 rounded-lg bg-card border border-border shadow-md"
              trigger={
                <button
                  type="button"
                  aria-label="More actions"
                  title="More actions"
                  className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  <MoreVertical className="size-4" />
                </button>
              }
            >
              <DropdownItem
                disabled={isApproving}
                onClick={() => void handleQuickApprove(item)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md cursor-pointer"
              >
                <CheckCircle2
                  className={`size-3.5 ${isApproving ? 'animate-spin' : ''}`}
                />
                <span>Approve</span>
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  setRequestChangesItem(item);
                  setChangeComment('');
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md cursor-pointer"
              >
                <MessageSquareDiff className="size-3.5" />
                <span>Request Changes</span>
              </DropdownItem>
            </Dropdown>
          </div>
        ),
      };
    });
  }, [filteredItems, approvingId, handleQuickApprove]);

  if (status === 'authenticated' && !canReview) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10 min-h-[50vh]">
        <Card className="max-w-md text-center border-dashed">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="size-10 text-amber-500" />
            </div>
            <CardTitle>Review Access Required</CardTitle>
            <CardDescription>
              The Approvals queue is reserved for Editors and Administrators.
              You can track the status of your submissions directly within the
              Content Manager.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/content"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Content Manager
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <SquareCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Approvals & Reviews
              </h1>
              {total > 0 && (
                <Badge
                  variant="outline"
                  className="font-semibold border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full"
                >
                  {total} pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review, approve, or request revisions on content submissions
              across all content types in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-sm gap-2">
          <div className="size-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading pending review items…</span>
        </div>
      ) : actionItems.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-muted/10 text-center py-12">
          <CardHeader className="flex flex-col items-center gap-2 pb-2">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="text-base font-semibold">
              All Caught Up!
            </CardTitle>
            <CardDescription className="text-xs max-w-sm">
              There are no content items currently waiting for your review. Any
              new submission from team members will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AdvancedTable
          columns={columns}
          rows={rows}
          enableFiltering={true}
          manualFiltering={true}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterPlaceholder="Filter pending reviews by title, type, or author..."
          enableSorting={true}
          enablePagination={true}
          defaultSortKey="updatedAt"
          defaultSortDirection="desc"
          emptyMessage={
            searchQuery
              ? 'No pending review items match your search filter.'
              : 'No pending review items found.'
          }
          className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs"
        />
      )}

      {/* Request Changes Modal */}
      {requestChangesItem && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isSubmittingChanges) {
              setRequestChangesItem(null);
              setChangeComment('');
            }
          }}
          onConfirm={() => void handleConfirmRequestChanges()}
          title="Request Changes"
          confirmText={isSubmittingChanges ? 'Submitting…' : 'Send Feedback'}
          cancelText="Cancel"
          colorScheme="warning"
          size="md"
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
              <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">
                  {requestChangesItem.title} ({requestChangesItem.schemaName})
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  Requesting changes will return this entry to the author in
                  Draft status for corrections.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="request-changes-feedback"
                className="text-xs font-medium text-foreground"
              >
                Feedback for Author:
              </label>
              <Textarea
                id="request-changes-feedback"
                value={changeComment}
                onChange={(val: unknown) => {
                  if (typeof val === 'string') {
                    setChangeComment(val);
                  } else if (
                    val &&
                    typeof val === 'object' &&
                    'target' in val &&
                    val.target &&
                    typeof val.target === 'object' &&
                    'value' in val.target &&
                    typeof val.target.value === 'string'
                  ) {
                    setChangeComment(val.target.value);
                  } else {
                    setChangeComment('');
                  }
                }}
                placeholder="Explain what needs to be changed before this can be approved..."
                className="text-xs resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
