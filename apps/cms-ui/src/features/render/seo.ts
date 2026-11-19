import type { Rec, SiteInfo, ResolvedSeo } from './types';
import type { SitePage } from './siteModel';
import { WORDS_PER_MINUTE as WPM } from './constants';

export type { SiteInfo, ResolvedSeo };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const strip = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/** Page settings win, then the post/page content, then the site defaults. */
export function resolveSeo(
  page: SitePage,
  post: Rec | null,
  site: SiteInfo,
): ResolvedSeo {
  const pageSeo = (page.seo ?? {}) as Rec;
  const base = post ? str(post.title) : str(pageSeo.title) || page.title;
  const template = site.seo?.titleTemplate || '%page% | %site%';
  const explicitTitle = post ? str(post.seo_title) : str(pageSeo.title);
  const title = explicitTitle
    ? explicitTitle
    : template
        .replace('%page%', base || page.title)
        .replace('%site%', site.name);

  const description = clip(
    (post
      ? str(post.seo_description) ||
        str(post.excerpt) ||
        str(post.summary) ||
        strip(str(post.content))
      : str(pageSeo.description) || str(page.scope.description)) ||
      site.seo?.description ||
      '',
    160,
  );
  const image =
    (post
      ? str(post.cover_image_url) || str(post.image)
      : str(pageSeo.image)) ||
    site.seo?.socialImage ||
    site.logoUrl ||
    '';
  return {
    title,
    description,
    image,
    noindex: pageSeo.noindex === true || (post ? post.noindex === true : false),
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The <head> tags for search engines and link previews. */
export function headTags(seo: ResolvedSeo, url?: string): string {
  const t: string[] = [`<title>${esc(seo.title)}</title>`];
  if (seo.description)
    t.push(`<meta name="description" content="${esc(seo.description)}">`);
  if (seo.noindex) t.push('<meta name="robots" content="noindex,nofollow">');
  if (url) t.push(`<link rel="canonical" href="${esc(url)}">`);
  t.push(`<meta property="og:title" content="${esc(seo.title)}">`);
  if (seo.description)
    t.push(
      `<meta property="og:description" content="${esc(seo.description)}">`,
    );
  if (seo.image)
    t.push(`<meta property="og:image" content="${esc(seo.image)}">`);
  if (url) t.push(`<meta property="og:url" content="${esc(url)}">`);
  t.push(
    `<meta name="twitter:card" content="${seo.image ? 'summary_large_image' : 'summary'}">`,
  );
  return t.join('');
}

export const readingTime = (html: string): number =>
  Math.max(1, Math.round(strip(html).split(' ').filter(Boolean).length / WPM));
