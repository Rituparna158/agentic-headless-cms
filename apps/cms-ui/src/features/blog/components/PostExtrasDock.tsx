import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { useCmsToast } from '@/hooks/useCmsToast';
import {
  ofKind,
  siteEntries,
  slugify,
} from '@/features/site-content/api/siteEntries.api';
import type { PostExtrasDockProps } from '../types/blog.types';

const input =
  'w-full text-xs px-3 py-2 rounded-lg border border-stone-300/80 bg-[#FAF8F3] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-300';
const label =
  'block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5';

/** Tags, publish date, search settings and checks for a post. */
export const PostExtrasDock: React.FC<PostExtrasDockProps> = ({
  siteId,
  entries,
  values,
  setValue,
  otherSlugs,
  slug,
  canPublish,
}) => {
  const toast = useCmsToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');

  const allTags = ofKind(entries, 'tag').map((t) => ({
    slug: String(t.data?.slug),
    name: String(t.data?.title),
  }));
  const chosen: string[] = Array.isArray(values.tags)
    ? (values.tags as string[])
    : [];

  const toggle = (tagSlug: string) =>
    setValue(
      'tags',
      chosen.includes(tagSlug)
        ? chosen.filter((t) => t !== tagSlug)
        : [...chosen, tagSlug],
    );

  const createTag = useMutation({
    mutationFn: async () => {
      const name = newTag.trim();
      const tagSlug = slugify(name);
      if (!tagSlug) throw new Error('empty');
      if (!allTags.some((t) => t.slug === tagSlug))
        await siteEntries.save(siteId, null, 'tag', {
          title: name,
          slug: tagSlug,
        });
      return tagSlug;
    },
    onSuccess: (tagSlug) => {
      queryClient.invalidateQueries({
        queryKey: ['collection-pages', siteId],
      });
      if (!chosen.includes(tagSlug)) setValue('tags', [...chosen, tagSlug]);
      setNewTag('');
    },
    onError: () =>
      toast.show({
        title: 'Could not add tag',
        message: 'Enter a tag name and try again.',
        type: 'error',
      }),
  });

  const publishAt =
    typeof values.publishAt === 'string' ? values.publishAt : '';
  const isFuture = publishAt && Date.parse(publishAt) > Date.now();
  const description = String(values.seo_description ?? '');
  const warnings: string[] = [];
  if (!values.cover_image_url && !values.image)
    warnings.push('No cover image. Cards and shared links will look empty.');
  if (!String(values.excerpt ?? values.summary ?? '').trim())
    warnings.push('No summary. Cards and search results will show nothing.');
  if (slug && otherSlugs.includes(slug))
    warnings.push('Another post already uses this address.');

  return (
    <>
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-3 space-y-1.5">
          {warnings.map((w) => (
            <p key={w} className="flex gap-1.5 text-[11px] text-amber-900">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div>
        <span className={label}>Tags</span>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {chosen.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-semibold"
              title="Remove tag"
            >
              {allTags.find((x) => x.slug === t)?.name ?? t}
              <X size={10} />
            </button>
          ))}
        </div>
        {allTags.filter((t) => !chosen.includes(t.slug)).length > 0 && (
          <select
            className={`${input} mb-2`}
            value=""
            onChange={(e) => e.target.value && toggle(e.target.value)}
            aria-label="Add an existing tag"
          >
            <option value="">Add an existing tag…</option>
            {allTags
              .filter((t) => !chosen.includes(t.slug))
              .map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
          </select>
        )}
        <div className="flex gap-1.5">
          <input
            className={input}
            placeholder="New tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createTag.mutate();
              }
            }}
          />
          <button
            type="button"
            aria-label="Create tag"
            disabled={createTag.isPending}
            onClick={() => createTag.mutate()}
            className="px-2 rounded-lg border border-stone-300/80 bg-[#FAF8F3] text-stone-700"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {canPublish && (
        <div>
          <label htmlFor="post-publish-at" className={label}>
            Publish on
          </label>
          <input
            id="post-publish-at"
            type="datetime-local"
            className={input}
            value={publishAt ? publishAt.slice(0, 16) : ''}
            onChange={(e) =>
              setValue(
                'publishAt',
                e.target.value ? new Date(e.target.value).toISOString() : '',
              )
            }
          />
          <p className="text-[11px] text-stone-500 mt-1">
            {isFuture
              ? 'Visitors will see this post from that time, once it is published.'
              : 'Leave empty to show it as soon as it is published.'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <span className={label}>Search &amp; sharing</span>
        <input
          className={input}
          placeholder="Search title (optional)"
          aria-label="Search title"
          value={String(values.seo_title ?? '')}
          onChange={(e) => setValue('seo_title', e.target.value)}
        />
        <textarea
          className={input}
          rows={3}
          placeholder="Search description (uses the summary if empty)"
          aria-label="Search description"
          value={description}
          onChange={(e) => setValue('seo_description', e.target.value)}
        />
        <p
          className={`text-[11px] ${description.length > 160 ? 'text-rose-600' : 'text-stone-500'}`}
        >
          {description.length}/160
        </p>
        <label className="flex items-center gap-2 text-[11px] text-stone-700">
          <input
            type="checkbox"
            checked={values.noindex === true}
            onChange={(e) => setValue('noindex', e.target.checked)}
          />
          Hide this post from search engines
        </label>
      </div>
    </>
  );
};
