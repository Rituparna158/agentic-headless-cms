import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, Mail, MessageSquare } from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCmsToast } from '@/hooks/useCmsToast';
import { useConfirm } from '@/hooks/useConfirm';
import { useCan } from '@/hooks/useCan';
import { collectionsApi } from '@/features/collections/api/collections.api';
import { useBlogPages } from '@/features/blog/hooks/useBlogPages';
import type { PageEntry } from '@/types/content.types';
import type { InboxTab as Tab } from '../types/inbox.types';
import {
  getSubmissionTimestamp as when,
  formatSubmissionDate as fmt,
} from '../utils/inbox.util';

export const InboxPage: React.FC = () => {
  const { siteId = '' } = useParams<{ siteId: string }>();
  const { pages, isLoading } = useBlogPages(siteId);
  const [tab, setTab] = useState<Tab>('comments');
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const confirm = useConfirm();
  const canPublish = useCan(siteId)('publish_content');

  const submissions = useMemo(
    () =>
      pages
        .filter((p) => p.data?.kind === 'submission')
        .sort((a, b) => when(b).localeCompare(when(a))),
    [pages],
  );
  const comments = submissions.filter(
    (s) => s.data?.submissionType === 'comment',
  );
  const messages = submissions.filter((s) => s.data?.submissionType === 'form');
  const pending = comments.filter((c) => c.status !== 'published').length;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
  const fail = () =>
    toast.show({
      title: 'Something went wrong',
      message: 'Please try again.',
      type: 'error',
    });

  const approve = useMutation({
    mutationFn: (id: string) => collectionsApi.publishPage(siteId, id),
    onSuccess: refresh,
    onError: fail,
  });
  const hide = useMutation({
    mutationFn: (id: string) => collectionsApi.unpublishPage(siteId, id),
    onSuccess: refresh,
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id: string) => collectionsApi.deletePage(siteId, id),
    onSuccess: refresh,
    onError: fail,
  });
  const askRemove = async (e: PageEntry) => {
    const ok = await confirm({
      title: 'Delete this?',
      message: 'It will be removed for good.',
      confirmText: 'Delete',
    });
    if (ok) remove.mutate(e.id);
  };

  const tabBtn = (
    id: Tab,
    label: string,
    icon: React.ReactNode,
    n?: number,
  ) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
        tab === id
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {icon}
      {label}
      {n ? (
        <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5">
          {n}
        </span>
      ) : null}
    </button>
  );

  const list = tab === 'comments' ? comments : messages;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-8 py-5 border-b border-border shrink-0">
        <h1 className="text-lg font-bold text-foreground">Inbox</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Messages from your contact forms and comments waiting for approval.
          Visitors can only send these when &ldquo;Accept form messages and
          comments&rdquo; is on in Site Settings.
        </p>
        <div className="flex gap-2 mt-4">
          {tabBtn('comments', 'Comments', <MessageSquare size={13} />, pending)}
          {tabBtn('messages', 'Messages', <Mail size={13} />)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-3">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && list.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {tab === 'comments' ? 'No comments yet.' : 'No messages yet.'}
          </p>
        )}
        {list.map((e) => {
          const d = e.data as Record<string, unknown>;
          const isPending = e.status !== 'published';
          const fields = (d.fields ?? {}) as Record<string, string>;
          return (
            <article
              key={e.id}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {tab === 'comments'
                    ? String(d.name)
                    : String(fields.name || fields.email || 'Visitor')}
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    {fmt(when(e))}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {tab === 'comments' && (
                    <span
                      className={
                        isPending
                          ? CMS_THEME_CLASSES.badges.draft
                          : CMS_THEME_CLASSES.badges.live
                      }
                    >
                      {isPending ? 'Waiting' : 'Approved'}
                    </span>
                  )}
                  {tab === 'comments' && isPending && canPublish && (
                    <button
                      type="button"
                      onClick={() => approve.mutate(e.id)}
                      className={`${CMS_THEME_CLASSES.buttons.primary} text-xs`}
                    >
                      <Check size={12} /> Approve
                    </button>
                  )}
                  {tab === 'comments' && !isPending && canPublish && (
                    <button
                      type="button"
                      onClick={() => hide.mutate(e.id)}
                      className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => askRemove(e)}
                    className="text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {tab === 'comments' ? (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {String(d.message)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    On post:{' '}
                    <span className="font-mono">{String(d.postSlug)}</span>
                    {d.email ? ` · ${String(d.email)}` : ''}
                  </p>
                </>
              ) : (
                <dl className="text-xs space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    Form: {String(d.form)}
                  </p>
                  {Object.entries(fields).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="w-24 shrink-0 text-muted-foreground capitalize">
                        {k.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-foreground whitespace-pre-wrap break-words">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
