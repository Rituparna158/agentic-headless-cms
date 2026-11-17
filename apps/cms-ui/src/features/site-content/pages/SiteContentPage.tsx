import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  Plus,
  Tag,
  LayoutTemplate,
  CornerDownRight,
} from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCmsToast } from '@/hooks/useCmsToast';
import { useConfirm } from '@/hooks/useConfirm';
import { useBlogPages } from '@/features/blog/hooks/useBlogPages';
import { ofKind, siteEntries, slugify } from '../api/siteEntries.api';
import { findMenusEntry, readMenus } from '@/features/menus/api/menus.api';
import { SectionMenuConnector } from '../components/SectionMenuConnector';
import { DEFAULT_SECTION_MENUS } from '../constants/sectionMenuConnector.constants';
import type { PageEntry } from '@/types/content.types';
import type { SiteContentTab as Tab } from '../types/siteContent.types';
import {
  STARTER_HEADER,
  STARTER_FOOTER,
  SITE_CONTENT_FIELD_CLASS as field,
} from '../constants/siteContent.constants';

export const SiteContentPage: React.FC = () => {
  const { siteId = '' } = useParams<{ siteId: string }>();
  const [tab, setTab] = useState<Tab>('sections');
  const { pages, isLoading } = useBlogPages(siteId);
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const confirm = useConfirm();

  const sections = useMemo(() => ofKind(pages, 'section'), [pages]);
  const tags = useMemo(() => ofKind(pages, 'tag'), [pages]);
  const redirects = useMemo(() => ofKind(pages, 'redirect'), [pages]);
  const menusEntry = useMemo(() => findMenusEntry(pages), [pages]);
  const siteMenus = useMemo(() => {
    const saved = readMenus(menusEntry);
    if (saved?.menus?.length) return saved.menus;
    return DEFAULT_SECTION_MENUS;
  }, [menusEntry]);
  const tagUse = useMemo(() => {
    const n: Record<string, number> = {};
    for (const p of pages)
      if (p.data?.kind === 'post' && Array.isArray(p.data.tags))
        for (const t of p.data.tags as string[]) n[t] = (n[t] ?? 0) + 1;
    return n;
  }, [pages]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['collection-pages', siteId] });
  const fail = (message: string) => () =>
    toast.show({ title: 'Could not save', message, type: 'error' });

  const remove = useMutation({
    mutationFn: (id: string) => siteEntries.remove(siteId, id),
    onSuccess: refresh,
    onError: fail('The item was not removed. Please try again.'),
  });

  const askRemove = async (entry: PageEntry, what: string) => {
    const ok = await confirm({
      title: `Remove this ${what}?`,
      message: `"${String(entry.data?.title ?? entry.title ?? '')}" will be removed.`,
      confirmText: 'Remove',
    });
    if (ok) remove.mutate(entry.id);
  };

  // ---- Sections ----
  const [editing, setEditing] = useState<PageEntry | 'new' | null>(null);
  const [secName, setSecName] = useState('');
  const [secRole, setSecRole] = useState<'' | 'header' | 'footer'>('');
  const [secHtml, setSecHtml] = useState('');
  const [secCss, setSecCss] = useState('');

  const openSection = (entry: PageEntry | 'new') => {
    const d = entry === 'new' ? {} : (entry.data as Record<string, unknown>);
    setEditing(entry);
    setSecName(String(d.title ?? ''));
    setSecRole((d.role as '' | 'header' | 'footer') || '');
    setSecHtml(String(d.html ?? ''));
    setSecCss(String(d.css ?? ''));
  };

  const saveSection = useMutation({
    mutationFn: async () => {
      const slug = slugify(secName) || 'section';
      // Only one header and one footer: free the role from the others
      if (secRole) {
        for (const other of sections) {
          if (
            other.data?.role === secRole &&
            other.id !== (editing !== 'new' && editing ? editing.id : '')
          ) {
            await siteEntries.save(siteId, other.id, 'section', {
              ...(other.data as Record<string, unknown>),
              title: String(other.data?.title ?? 'Section'),
              slug: String(other.data?.slug ?? other.id),
              role: '',
            });
          }
        }
      }
      return siteEntries.save(
        siteId,
        editing && editing !== 'new' ? editing.id : null,
        'section',
        {
          title: secName.trim() || 'Section',
          slug,
          role: secRole,
          html: secHtml,
          css: secCss,
        },
      );
    },
    onSuccess: () => {
      setEditing(null);
      refresh();
      toast.show({
        title: 'Section saved',
        message: 'It now shows wherever it is used.',
        type: 'success',
      });
    },
    onError: fail('The section was not saved. Please try again.'),
  });

  // ---- Tags ----
  const [tagName, setTagName] = useState('');
  const addTag = useMutation({
    mutationFn: () => {
      const slug = slugify(tagName);
      if (!slug) throw new Error('empty');
      if (tags.some((t) => t.data?.slug === slug)) throw new Error('exists');
      return siteEntries.save(siteId, null, 'tag', {
        title: tagName.trim(),
        slug,
      });
    },
    onSuccess: () => {
      setTagName('');
      refresh();
    },
    onError: (e) =>
      toast.show({
        title: 'Could not add tag',
        message:
          (e as Error).message === 'exists'
            ? 'That tag already exists.'
            : 'Enter a tag name.',
        type: 'error',
      }),
  });

  // ---- Redirects ----
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const addRedirect = useMutation({
    mutationFn: () => {
      if (!from.trim() || !to.trim()) throw new Error('empty');
      return siteEntries.save(siteId, null, 'redirect', {
        title: `${from.trim()} → ${to.trim()}`,
        slug: slugify(from) || 'redirect',
        from: from.trim().startsWith('/') ? from.trim() : `/${from.trim()}`,
        to: to.trim(),
      });
    },
    onSuccess: () => {
      setFrom('');
      setTo('');
      refresh();
    },
    onError: fail('Enter the old address and where it should go.'),
  });

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode) => (
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
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-8 py-5 border-b border-border shrink-0">
        <h1 className="text-lg font-bold text-foreground">Shared content</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tags, reusable design sections (like the header and footer) and
          redirects for this website.
        </p>
        <div className="flex gap-2 mt-4">
          {tabBtn(
            'sections',
            'Reusable sections',
            <LayoutTemplate size={13} />,
          )}
          {tabBtn('tags', 'Tags', <Tag size={13} />)}
          {tabBtn('redirects', 'Redirects', <CornerDownRight size={13} />)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-4">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

        {tab === 'sections' && !editing && (
          <>
            <p className="text-xs text-muted-foreground">
              Design a piece once and it appears everywhere. A section set as
              the <strong>Header</strong> or <strong>Footer</strong> shows on
              every page automatically. Other sections can be placed anywhere
              with the &ldquo;Shared section&rdquo; block in the page builder.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openSection('new')}
                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs`}
              >
                <Plus size={13} /> New section
              </button>
            </div>
            {sections.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">
                No shared sections yet.
              </p>
            )}
            <ul className="space-y-2">
              {sections.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => openSection(s)}
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {String(s.data?.title)}
                    </span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {s.data?.role === 'header'
                        ? 'Header on every page'
                        : s.data?.role === 'footer'
                          ? 'Footer on every page'
                          : `Shared section · ${String(s.data?.slug)}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Remove section"
                    onClick={() => askRemove(s, 'section')}
                    className="text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'sections' && editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sec-name-input"
                  className="block text-xs font-medium mb-1"
                >
                  Name
                </label>
                <input
                  id="sec-name-input"
                  className={field}
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="sec-role-select"
                  className="block text-xs font-medium mb-1"
                >
                  Show automatically as
                </label>
                <select
                  id="sec-role-select"
                  className={field}
                  value={secRole}
                  onChange={(e) =>
                    setSecRole(e.target.value as '' | 'header' | 'footer')
                  }
                >
                  <option value="">
                    Reusable section (placed manually on individual pages)
                  </option>
                  <option value="header">Header of every page</option>
                  <option value="footer">Footer of every page</option>
                </select>
              </div>
            </div>

            <SectionMenuConnector
              secHtml={secHtml}
              onHtmlChange={setSecHtml}
              secRole={secRole}
              siteId={siteId}
              availableMenus={siteMenus}
            />

            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                className="underline text-muted-foreground"
                onClick={() => setSecHtml(STARTER_HEADER)}
              >
                Use starter header
              </button>
              <button
                type="button"
                className="underline text-muted-foreground"
                onClick={() => setSecHtml(STARTER_FOOTER)}
              >
                Use starter footer
              </button>
            </div>
            <div>
              <label
                htmlFor="sec-html-textarea"
                className="block text-xs font-medium mb-1"
              >
                Design (HTML)
              </label>
              <textarea
                id="sec-html-textarea"
                className={`${field} font-mono h-48`}
                value={secHtml}
                onChange={(e) => setSecHtml(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Use <code>data-cms-site=&quot;logo&quot;</code> for your logo
                and <code>data-cms-menu=&quot;header-primary&quot;</code> for a
                navigation menu.
              </p>
            </div>
            <div>
              <label
                htmlFor="sec-css-textarea"
                className="block text-xs font-medium mb-1"
              >
                Styles (CSS, optional)
              </label>
              <textarea
                id="sec-css-textarea"
                className={`${field} font-mono h-24`}
                value={secCss}
                onChange={(e) => setSecCss(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saveSection.isPending}
                onClick={() => saveSection.mutate()}
                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs`}
              >
                {saveSection.isPending ? 'Saving…' : 'Save section'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tab === 'tags' && (
          <>
            <p className="text-xs text-muted-foreground">
              Tags group posts. Each tag gets its own page, for example{' '}
              <code>/blog/tag/ai</code>. Writers can also add tags while writing
              a post.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addTag.mutate();
              }}
            >
              <input
                className={field}
                placeholder="New tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
              <button
                type="submit"
                disabled={addTag.isPending}
                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs shrink-0`}
              >
                <Plus size={13} /> Add
              </button>
            </form>
            <ul className="space-y-2">
              {tags.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5"
                >
                  <span className="text-sm text-foreground">
                    {String(t.data?.title)}
                    <span className="ml-2 text-[11px] text-muted-foreground font-mono">
                      {String(t.data?.slug)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {tagUse[String(t.data?.slug)] ?? 0} post
                    {(tagUse[String(t.data?.slug)] ?? 0) === 1 ? '' : 's'}
                    <button
                      type="button"
                      aria-label="Remove tag"
                      onClick={() => askRemove(t, 'tag')}
                      className="hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            {tags.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">No tags yet.</p>
            )}
          </>
        )}

        {tab === 'redirects' && (
          <>
            <p className="text-xs text-muted-foreground">
              When you change an address, add a redirect so the old link keeps
              working for visitors and search engines.
            </p>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addRedirect.mutate();
              }}
            >
              <input
                className={`${field} flex-1 min-w-40`}
                placeholder="Old address, e.g. /old-blog"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                className={`${field} flex-1 min-w-40`}
                placeholder="New address, e.g. /blog"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <button
                type="submit"
                disabled={addRedirect.isPending}
                className={`${CMS_THEME_CLASSES.buttons.primary} text-xs shrink-0`}
              >
                <Plus size={13} /> Add
              </button>
            </form>
            <ul className="space-y-2">
              {redirects.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5"
                >
                  <span className="text-xs font-mono text-foreground">
                    {String(r.data?.from)} → {String(r.data?.to)}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove redirect"
                    onClick={() => askRemove(r, 'redirect')}
                    className="text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            {redirects.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">No redirects yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
