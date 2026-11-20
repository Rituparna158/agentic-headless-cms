import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SchemaRichTextEditor } from '@/components/PageSideDrawer/SchemaRichTextEditor';
import { SchemaMediaField } from '@/components/PageSideDrawer/SchemaMediaField';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { useCmsToast } from '@/hooks/useCmsToast';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import type { DynamicFieldDefinition } from '@/types/content.types';
import { useCan } from '@/hooks/useCan';
import { useBlogPages } from '../hooks/useBlogPages';
import { PostExtrasDock } from '../components/PostExtrasDock';
import { parseMarkdownPost } from '../utils/markdownImport';
import { VersionHistoryDrawer } from '@/features/collections/components/template/VersionHistoryDrawer';
import { blogApi, slugifyPost, type BlogPost } from '../api/blog.api';

const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && !v.trim());

const dockInputClass =
  'w-full text-xs px-3 py-2 rounded-lg border border-stone-300/80 bg-[#FAF8F3] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-300';

export const PostStudioPage: React.FC = () => {
  const {
    siteId = '',
    pageId = '',
    postId = 'new',
  } = useParams<{ siteId: string; pageId: string; postId: string }>();
  const navigate = useNavigate();
  const canPublish = useCan(siteId)('publish_content');
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const currentUser = useAuthStore((s) => s.user);
  const { blogPages, pages, isLoading } = useBlogPages(siteId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const blog = blogPages.find((b) => b.pageId === pageId) ?? null;
  const isNew = postId === 'new';
  const existing = blog?.posts.find((p) => p.id === postId) ?? null;

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [mediaFieldId, setMediaFieldId] = useState<string | null>(null);
  const [draftId] = useState(() => `post_${Date.now()}`);
  const initialised = useRef(false);

  // Load an existing post, or start a new one with sensible defaults
  useEffect(() => {
    if (!blog || initialised.current) return;
    if (!isNew && !existing) return;
    initialised.current = true;
    if (existing) {
      setValues({ ...existing });
      setSlug(existing.slug);
      setSlugTouched(true);
      setStatus(existing.status);
    } else {
      const defaults: Record<string, unknown> = {};
      for (const f of blog.fields) {
        if (f.apiId === 'author' && currentUser?.email) {
          defaults.author = currentUser.email;
        }
        if (f.dataType === 'date') {
          defaults[f.apiId] = new Date().toISOString().slice(0, 10);
        }
      }
      setValues(defaults);
    }
  }, [blog, existing, isNew, currentUser?.email]);

  const titleField = blog?.fields.find((f) => f.apiId === 'title');
  const contentField = blog?.fields.find(
    (f) => f.apiId === 'content' || f.dataType === 'richtext',
  );
  const dockFields = useMemo(
    () =>
      (blog?.fields ?? []).filter(
        (f) => f.apiId !== titleField?.apiId && f.apiId !== contentField?.apiId,
      ),
    [blog, titleField, contentField],
  );

  const setValue = (apiId: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [apiId]: value }));

  const handleTitleChange = (title: string) => {
    setValue('title', title);
    if (!slugTouched) setSlug(slugifyPost(title));
  };

  const missingRequired: DynamicFieldDefinition[] = (blog?.fields ?? []).filter(
    (f) => f.isRequired && isEmpty(values[f.apiId]),
  );
  const titleMissing = isEmpty(values.title);

  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      if (!blog) throw new Error('Blog type not found');
      const finalSlug =
        slug || slugifyPost(String(values.title ?? '')) || draftId;
      const post: BlogPost = {
        ...values,
        id: existing?.id ?? draftId,
        slug: finalSlug,
        title: String(values.title ?? 'Untitled'),
        status: publish ? 'published' : (existing?.status ?? 'draft'),
        createdAt: existing?.createdAt,
      };
      return blogApi.savePost(siteId, blog.pageId, post, {
        publish,
        isNew,
      });
    },
    onSuccess: (saved, { publish }) => {
      queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
      setStatus(saved.status);
      setLastSaved(new Date().toLocaleTimeString());
      toast.show({
        title: publish ? 'Published' : 'Draft saved',
        message: publish
          ? `"${saved.title}" is live.`
          : `"${saved.title}" was saved as a draft.`,
        type: 'success',
      });
      if (isNew || saved.id !== postId) {
        navigate(`/sites/${siteId}/posts/blog/${pageId}/${saved.id}`, {
          replace: true,
        });
      }
    },
    onError: (err: unknown) => {
      // The server explains problems like "address already used"; show it
      const reason =
        err instanceof Error && err.message && !/status code/i.test(err.message)
          ? err.message
          : '';
      toast.show({
        title: 'Could not save',
        message: reason || 'Your changes were not saved. Please try again.',
        type: 'error',
      });
    },
  });

  const handlePublish = () => {
    if (titleMissing || missingRequired.length > 0) {
      setShowErrors(true);
      toast.show({
        title: 'Some required fields are empty',
        message: `Please fill in: ${[...missingRequired].map((f) => f.displayName).join(', ')}.`,
        type: 'warning',
      });
      return;
    }
    saveMutation.mutate({ publish: true });
  };

  const handleSaveDraft = () => {
    if (titleMissing) {
      setShowErrors(true);
      return;
    }
    saveMutation.mutate({ publish: false });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Loading…</span>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-lg font-semibold">This blog type was not found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          It may have been removed from this website.
        </p>
        <Link
          to={`/sites/${siteId}/posts`}
          className={CMS_THEME_CLASSES.buttons.primary}
        >
          Back to Posts
        </Link>
      </div>
    );
  }

  const pageBase = blog.pageSlug.startsWith('/')
    ? blog.pageSlug
    : `/${blog.pageSlug}`;
  const previewHref = `/sites/${siteId}/preview${pageBase}${!isNew && slug ? `/${slug}` : ''}`;
  const showFieldError = (f: DynamicFieldDefinition) =>
    showErrors && f.isRequired && isEmpty(values[f.apiId]);

  const renderDockField = (f: DynamicFieldDefinition) => {
    const help = (f.config as { help?: string } | null | undefined)?.help;
    const val = values[f.apiId];
    const invalid = showFieldError(f);
    const common = {
      id: `f-${f.apiId}`,
      'aria-invalid': invalid || undefined,
    };
    let control: React.ReactNode;
    switch (f.dataType) {
      case 'textarea':
        control = (
          <textarea
            {...common}
            rows={3}
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => setValue(f.apiId, e.target.value)}
            className={dockInputClass}
          />
        );
        break;
      case 'media':
        control = (
          <SchemaMediaField
            tone="light"
            value={typeof val === 'string' ? val : ''}
            fieldApiId={f.apiId}
            fieldDisplayName={f.displayName}
            onChange={(url) => setValue(f.apiId, url)}
            onOpenMediaPicker={() => setMediaFieldId(f.apiId)}
          />
        );
        break;
      case 'select':
        control = (
          <select
            {...common}
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => setValue(f.apiId, e.target.value)}
            className={dockInputClass}
          >
            <option value="">Choose…</option>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
        break;
      case 'boolean':
        control = (
          <label className="flex items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={val === true}
              onChange={(e) => setValue(f.apiId, e.target.checked)}
            />
            Yes
          </label>
        );
        break;
      default:
        control = (
          <input
            {...common}
            type={
              f.dataType === 'date'
                ? 'date'
                : f.dataType === 'number'
                  ? 'number'
                  : f.dataType === 'url'
                    ? 'url'
                    : 'text'
            }
            value={
              typeof val === 'string' || typeof val === 'number' ? val : ''
            }
            onChange={(e) => setValue(f.apiId, e.target.value)}
            className={dockInputClass}
          />
        );
    }
    return (
      <div key={f.apiId} className="space-y-1.5">
        <label
          htmlFor={`f-${f.apiId}`}
          className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider"
        >
          {f.displayName}
          {f.isRequired ? (
            <span className="text-rose-600 ml-0.5" title="Required">
              *
            </span>
          ) : (
            <span className="ml-1 normal-case font-normal text-stone-400">
              optional
            </span>
          )}
        </label>
        {control}
        {invalid ? (
          <p className="text-[11px] text-rose-600 flex items-center gap-1">
            <AlertCircle size={11} /> {f.displayName} is required to publish.
          </p>
        ) : (
          help && <p className="text-[11px] text-stone-500">{help}</p>
        )}
      </div>
    );
  };

  const mediaField = blog.fields.find((f) => f.apiId === mediaFieldId);

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      <header className="px-6 py-3 border-b border-border bg-card/80 flex items-center justify-between shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/sites/${siteId}/posts`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Posts</span>
          </Link>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {blog.postLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} />
            {lastSaved ? `Saved at ${lastSaved}` : 'Not saved yet'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const post = parseMarkdownPost(await file.text());
              setValues((prev) => ({
                ...prev,
                ...(post.title ? { title: post.title } : {}),
                ...(post.excerpt ? { excerpt: post.excerpt } : {}),
                ...(post.author ? { author: post.author } : {}),
                ...(post.date ? { date: post.date } : {}),
                ...(post.tags.length
                  ? {
                      tags: post.tags.map((t) =>
                        t.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      ),
                    }
                  : {}),
                ...(contentField ? { [contentField.apiId]: post.content } : {}),
              }));
              if (post.title && !slugTouched)
                setSlug(
                  post.slug ? slugifyPost(post.slug) : slugifyPost(post.title),
                );
              toast.show({
                title: 'Imported',
                message:
                  'The Markdown file was added to this post. Review it, then save.',
                type: 'success',
              });
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
            title="Fill this post from a Markdown file"
          >
            <span>Import Markdown</span>
          </button>
          {!isNew && existing && !existing.legacy && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
              title="See earlier versions and restore one"
            >
              <span>History</span>
            </button>
          )}
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </a>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={handleSaveDraft}
            className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs disabled:opacity-50`}
          >
            <Save size={13} />
            <span>Save draft</span>
          </button>
          {!canPublish && (
            <span
              className="text-[11px] text-muted-foreground"
              title="Your role can save drafts. An editor with publishing rights puts them live."
            >
              Drafts only. An editor publishes.
            </span>
          )}
          {canPublish && (
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={handlePublish}
              className={`${CMS_THEME_CLASSES.buttons.primary} text-xs disabled:opacity-50`}
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span>
                {status === 'published' ? 'Update live post' : 'Publish'}
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-12">
        <main
          className={`col-span-12 lg:col-span-8 xl:col-span-9 overflow-y-auto ${CMS_THEME_CLASSES.canvas.warmSand}`}
        >
          <div className={CMS_THEME_CLASSES.canvas.articleColumn}>
            <input
              type="text"
              aria-label={titleField?.displayName ?? 'Title'}
              placeholder={`${titleField?.displayName ?? 'Title'}…`}
              value={typeof values.title === 'string' ? values.title : ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              autoFocus={isNew}
              className="w-full text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 border-none outline-none bg-transparent mb-6 focus:ring-0"
            />
            {showErrors && titleMissing && (
              <p className="text-xs text-rose-600 -mt-4 mb-4">
                A title is required.
              </p>
            )}

            {contentField ? (
              <SchemaRichTextEditor
                variant="article"
                value={
                  typeof values[contentField.apiId] === 'string'
                    ? (values[contentField.apiId] as string)
                    : ''
                }
                fieldApiId={contentField.apiId}
                fieldDisplayName={contentField.displayName}
                onChange={(html) => setValue(contentField.apiId, html)}
              />
            ) : (
              <p className="text-sm text-stone-500">
                This blog type has no long-form text field. Fill in the details
                on the right.
              </p>
            )}
            {contentField && showFieldError(contentField) && (
              <p className="text-xs text-rose-600 mt-2">
                {contentField.displayName} is required to publish.
              </p>
            )}
          </div>
        </main>

        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 border-l border-border bg-[#F7F4EC] p-6 overflow-y-auto space-y-5">
          <div className="p-4 rounded-xl border border-stone-300/70 bg-[#FAF8F3] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Status</span>
              {status === 'published' ? (
                <span className={CMS_THEME_CLASSES.badges.live}>Live</span>
              ) : (
                <span className={CMS_THEME_CLASSES.badges.draft}>Draft</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Type</span>
              <span className="font-medium text-stone-800">{blog.name}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="post-slug"
              className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider"
            >
              Post address
            </label>
            <div className="flex items-center text-xs font-mono border border-stone-300/80 rounded-lg bg-[#FAF8F3] px-2.5 py-2 overflow-hidden">
              <span className="text-stone-500 shrink-0">/</span>
              <input
                id="post-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugifyPost(e.target.value));
                  setSlugTouched(true);
                }}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-stone-900"
              />
            </div>
          </div>

          {dockFields.map(renderDockField)}

          <PostExtrasDock
            siteId={siteId}
            entries={pages}
            values={values}
            setValue={setValue}
            otherSlugs={(blog?.posts ?? [])
              .filter((p) => p.id !== existing?.id)
              .map((p) => p.slug)}
            slug={slug}
            canPublish={canPublish}
          />
        </aside>
      </div>

      {historyOpen && existing && (
        <VersionHistoryDrawer
          isOpen
          onClose={() => setHistoryOpen(false)}
          schemaSlug={siteId}
          pageId={existing.id}
          currentPageData={{
            ...(values as Record<string, unknown>),
            title: String(values.title ?? ''),
            slug,
          }}
          onRevertSuccess={(data) => {
            const d = (data ?? {}) as Record<string, unknown>;
            setValues((prev) => ({ ...prev, ...d }));
            if (typeof d.slug === 'string') setSlug(d.slug);
            queryClient.invalidateQueries({
              queryKey: ['collection-pages', siteId],
            });
            setHistoryOpen(false);
          }}
        />
      )}

      {mediaFieldId && mediaField && (
        <MediaAssetPickerModal
          isOpen
          onClose={() => setMediaFieldId(null)}
          onSelect={(asset) => {
            setValue(mediaField.apiId, asset.url);
            setMediaFieldId(null);
          }}
        />
      )}
    </div>
  );
};
