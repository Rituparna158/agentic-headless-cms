import { renderTemplate, inferShowMarkers } from './renderTemplate';
import {
  neighborsOf,
  sourcesForPage,
  type ResolvedPath,
  type SiteModel,
  type SitePage,
} from './siteModel';
import { headTags, resolveSeo } from './seo';
import type { Rec, ViewContext, RenderedView } from './types';

export type { ViewContext, RenderedView };

const pageBase = (p: SitePage) => (p.slug === '/' ? '' : p.slug);

/** Replaces `data-cms-include="name"` with the reusable section of that name. */
function applyIncludes(
  html: string,
  model: SiteModel,
): { html: string; css: string } {
  if (!html.includes('data-cms-include')) return { html, css: '' };
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let css = '';
  doc.querySelectorAll('[data-cms-include]').forEach((el) => {
    const key = el.getAttribute('data-cms-include');
    const section = model.sections.find((s) => s.slug === key || s.id === key);
    if (!section) return;
    css += section.css;
    el.innerHTML = section.html;
  });
  return { html: doc.body.innerHTML, css };
}

/**
 * Renders one address of the website. The preview, the public site and the
 * export all go through here, so they cannot drift apart.
 */
export function renderView(
  model: SiteModel,
  resolved: ResolvedPath,
  ctx: ViewContext,
): RenderedView | null {
  const page = resolved.page;
  const borrowedFrom =
    !page.layout &&
    !page.customDesign &&
    (page.posts.length > 0 || Object.keys(page.ownSchemas).length > 0)
      ? (model.pages.find((p) => p.id !== page.id && p.layout) ?? null)
      : null;
  const layout = page.layout ?? borrowedFrom?.layout ?? null;
  if (!layout) return null;

  const header = model.sections.find((s) => s.role === 'header');
  const footer = model.sections.find((s) => s.role === 'footer');
  const hideChrome = page.scope.hideChrome === true;
  const rawHtml = [
    !hideChrome && header ? header.html : '',
    layout.html,
    !hideChrome && footer ? footer.html : '',
  ].join('');
  const isBlog = page.raw?.data?.isBlogPage === true;
  const marked = isBlog ? inferShowMarkers(rawHtml) : rawHtml;
  const usesShow = marked.includes('data-cms-show');
  const item =
    resolved.post ??
    (usesShow ? null : isBlog ? (page.posts[0] ?? null) : null);
  const included = applyIncludes(marked, model);

  const tagNames = Object.fromEntries(model.tags.map((t) => [t.slug, t.name]));
  const scope: Rec = resolved.tag
    ? {
        ...page.scope,
        tag_name: resolved.tag.name,
        tag: resolved.tag.slug,
        tag_description: resolved.tag.description ?? '',
      }
    : page.scope;

  const rendered = renderTemplate(included.html, {
    page: {
      ...scope,
      site_name: ctx.site.name,
      site_logo: ctx.site.logoUrl ?? '',
    },
    item,
    site: { name: ctx.site.name, logoUrl: ctx.site.logoUrl },
    sources: sourcesForPage(model, page, item),
    menus: model.menus,
    tagNames,
    neighbors: item ? neighborsOf(page, item) : undefined,
    hrefs: {
      post: (post) => {
        const owner = model.pages.find((p) => p.id === post._pageId) ?? page;
        return ctx.url(`${pageBase(owner)}/${String(post.slug ?? '')}`);
      },
      list: ctx.url(pageBase(page) || '/'),
      page: (path) => ctx.url(path),
      tag: (slug) => ctx.url(`${pageBase(page)}/tag/${slug}`),
    },
  });

  const seoPage = resolved.tag
    ? { ...page, title: `Posts tagged ${resolved.tag.name}` }
    : page;
  const seo = resolveSeo(seoPage, resolved.post, ctx.site);
  const path = resolved.post
    ? `${pageBase(page)}/${String(resolved.post.slug)}`
    : resolved.tag
      ? `${pageBase(page)}/tag/${resolved.tag.slug}`
      : page.slug;
  const base = ctx.site.baseUrl?.replace(/\/+$/, '');
  const head = headTags(
    seo,
    base && ctx.canonical ? `${base}${ctx.canonical(path)}` : undefined,
  );

  const sectionCss = [header?.css, footer?.css, included.css]
    .filter(Boolean)
    .join('\n');
  return {
    html: rendered.html,
    css: `${layout.css}\n${sectionCss}`,
    head,
    diagnostics: rendered.diagnostics,
    item,
    borrowedFrom,
  };
}
