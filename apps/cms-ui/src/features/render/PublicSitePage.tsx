import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { env } from '@/config/env';
import type { PageEntry } from '@/types/content.types';
import { buildPreviewDocument } from './previewDocument';
import { renderView } from './renderView';
import { buildSiteModel, findRedirect, resolvePath } from './siteModel';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type { SiteInfo } from './seo';
import type { PublishedSiteData as Published } from './types';

/** Reads every PUBLISHED entry of a site from the read-only delivery API. */
async function fetchPublished(siteSlug: string): Promise<Published> {
  const all: PageEntry[] = [];
  let site: SiteInfo = { name: siteSlug };
  for (let page = 1; page <= 50; page++) {
    const res = await fetch(
      `${env.VITE_API_URL}/delivery/${encodeURIComponent(env.VITE_APP_ID)}/${encodeURIComponent(siteSlug)}?page=${page}&pageSize=100`,
    );
    if (res.status === 404) throw new Error('not-public');
    if (!res.ok)
      throw new Error(`The site could not be loaded (${res.status}).`);
    const body = await res.json();
    const payload = body?.data ?? body;
    const list: PageEntry[] = Array.isArray(payload)
      ? payload
      : (payload?.data ?? []);
    all.push(...list);
    if (page === 1 && payload?.site) {
      const s = payload.site;
      site = {
        name: s.name || siteSlug,
        logoUrl: s.logoUrl ? getMediaFileUrl(s.logoUrl) : undefined,
        seo: s.seo,
        baseUrl: s.domain
          ? `https://${String(s.domain).replace(/^https?:\/\//, '')}`
          : undefined,
      };
    }
    const pages = payload?.meta?.pagination?.pageCount ?? 1;
    if (page >= pages) break;
  }
  return { entries: all, site };
}

const Message = ({ title, text }: { title: string; text: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] text-stone-800 p-6 text-center">
    <div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-stone-500">{text}</p>
    </div>
  </div>
);

/** The public website: what visitors see at /live/<site>/…, no login needed. */
export function PublicSitePage() {
  const { siteSlug = '' } = useParams<{ siteSlug: string }>();
  const path = `/${useParams()['*'] ?? ''}`;
  const base = `/live/${siteSlug}`;
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const postSlug = useRef<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ['public-site', siteSlug],
    queryFn: () => fetchPublished(siteSlug),
    enabled: Boolean(siteSlug),
    retry: false,
    staleTime: 60_000,
  });

  const model = useMemo(
    () => buildSiteModel(query.data?.entries ?? [], 'live'),
    [query.data],
  );
  const resolved = useMemo(() => resolvePath(model, path), [model, path]);
  const redirect = useMemo(
    () => (resolved ? null : findRedirect(model, path)),
    [resolved, model, path],
  );

  postSlug.current = resolved?.post ? String(resolved.post.slug) : undefined;

  const view = useMemo(
    () =>
      resolved && query.data
        ? renderView(model, resolved, {
            site: query.data.site,
            url: (p) => `${base}${p === '/' ? '' : p}`,
          })
        : null,
    [resolved, model, query.data, base],
  );
  const doc = useMemo(
    () => (view ? buildPreviewDocument(view.html, view.css, view.head) : ''),
    [view],
  );

  useEffect(() => {
    if (!redirect) return;
    if (/^https?:/.test(redirect)) window.location.replace(redirect);
    else navigate(`${base}${redirect}`, { replace: true });
  }, [redirect, navigate, base]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only the page frame may drive navigation or send forms
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as {
        type?: string;
        href?: string;
        slug?: string;
        action?: string;
      } | null;
      const msg = e.data as {
        type?: string;
        form?: string;
        fields?: Record<string, string>;
      } | null;
      if (msg?.type === 'CMS_FORM_SUBMIT') {
        const reply = (ok: boolean, message: string) =>
          frame.current?.contentWindow?.postMessage(
            { type: 'CMS_FORM_RESULT', ok, message },
            '*',
          );
        const isComment = msg.form === 'comment';
        fetch(
          `${env.VITE_API_URL}/delivery/${encodeURIComponent(env.VITE_APP_ID)}/${encodeURIComponent(siteSlug)}/submissions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: isComment ? 'comment' : 'form',
              form: msg.form,
              postSlug: postSlug.current,
              fields: msg.fields ?? {},
            }),
          },
        )
          .then(async (res) => {
            if (res.ok)
              return reply(
                true,
                isComment
                  ? 'Thank you! Your comment will appear once it is approved.'
                  : 'Thank you! Your message was sent.',
              );
            const body = await res.json().catch(() => null);
            reply(
              false,
              body?.error?.message ??
                'Sorry, this could not be sent. Please try again.',
            );
          })
          .catch(() =>
            reply(false, 'Sorry, this could not be sent. Please try again.'),
          );
        return;
      }
      if (!d || d.type !== 'CMS_PREVIEW_NAVIGATE') return;
      const href = d.href ?? '';
      if (/^(https?:)?\/\//.test(href)) window.location.href = href;
      else if (href.startsWith('/')) navigate(href);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate, siteSlug]);

  if (query.isLoading) return <Message title="Loading…" text="" />;
  if (query.isError)
    return (
      <Message
        title="Website not available"
        text="This website is not published publicly, or it does not exist."
      />
    );
  if (redirect) return <Message title="Redirecting…" text="" />;
  if (!resolved)
    return (
      <Message
        title="Page not found"
        text="There is nothing published at this address."
      />
    );
  if (!view)
    return (
      <Message
        title={resolved.page.title}
        text="This page is not designed yet."
      />
    );

  return (
    <iframe
      ref={frame}
      title={resolved.page.title}
      sandbox="allow-scripts allow-forms allow-same-origin"
      srcDoc={doc}
      className="fixed inset-0 w-full h-full border-0 bg-white"
    />
  );
}
