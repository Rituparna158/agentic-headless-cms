import { renderView } from './renderView';
import {
  pageForTag,
  type ResolvedPath,
  type SiteModel,
  type SitePage,
} from './siteModel';
import type { SiteInfo } from './seo';
import type { ExportedFile, ExportResult } from './types';

export type { ExportedFile, ExportResult };

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const staticDocument = (head: string, body: string, css: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body>${body}</body></html>`;

const dirFor = (slug: string): string =>
  slug === '/' ? '' : `${slug.replace(/^\//, '')}/`;

const pageBase = (p: SitePage) => (p.slug === '/' ? '' : p.slug);

const isoDate = (v: unknown): string => {
  const t = Date.parse(String(v ?? ''));
  return Number.isFinite(t)
    ? new Date(t).toISOString()
    : new Date().toISOString();
};

/** Turns the Live version of a site into plain HTML files, one per address. */
export function buildStaticSite(
  model: SiteModel,
  site: SiteInfo,
): ExportResult {
  const files: ExportedFile[] = [];
  const skipped: ExportResult['skipped'] = [];
  const urls: { loc: string; lastmod?: string }[] = [];
  const base = (site.baseUrl ?? '').replace(/\/+$/, '');
  const slashed = (p: string) => (p === '/' ? '/' : `${p}/`);
  const ctx = { site, url: slashed, canonical: slashed };

  const add = (
    path: string,
    resolved: ResolvedPath,
    sitemapPath: string | null,
  ) => {
    const view = renderView(model, resolved, ctx);
    if (!view) return false;
    files.push({
      path,
      content: staticDocument(view.head, view.html, view.css),
    });
    const noindex =
      (resolved.page.seo as Record<string, unknown> | null)?.noindex === true;
    if (sitemapPath && !noindex)
      urls.push({
        loc: `${base}${sitemapPath}`,
        lastmod: isoDate(
          resolved.post?.updatedAt ?? resolved.page.raw.updatedAt,
        ),
      });
    return true;
  };

  for (const page of model.pages) {
    if (!page.layout && !page.customDesign && page.posts.length === 0) {
      skipped.push({ title: page.title, reason: 'It has no design yet.' });
      continue;
    }
    if (
      !add(
        `${dirFor(page.slug)}index.html`,
        { page, post: null },
        page.slug === '/' ? '/' : `${page.slug}/`,
      )
    ) {
      skipped.push({ title: page.title, reason: 'It has no design yet.' });
      continue;
    }
    for (const post of page.posts) {
      add(
        `${dirFor(page.slug)}${String(post.slug)}/index.html`,
        { page, post },
        `${pageBase(page)}/${String(post.slug)}/`,
      );
    }
    // Tag archives for blogs
    if (page.posts.length > 0) {
      for (const tag of model.tags) {
        const filtered = pageForTag(page, tag.slug);
        if (filtered.posts.length === 0) continue;
        add(
          `${dirFor(page.slug)}tag/${tag.slug}/index.html`,
          { page: filtered, post: null, tag },
          `${pageBase(page)}/tag/${tag.slug}/`,
        );
      }
      // RSS feed for the blog
      const items = page.posts
        .map(
          (p) =>
            `<item><title>${esc(String(p.title ?? ''))}</title><link>${esc(`${base}${pageBase(page)}/${String(p.slug)}/`)}</link><guid>${esc(`${base}${pageBase(page)}/${String(p.slug)}/`)}</guid><pubDate>${new Date(isoDate(p.date ?? p.updatedAt)).toUTCString()}</pubDate><description>${esc(String(p.excerpt ?? p.summary ?? ''))}</description></item>`,
        )
        .join('');
      files.push({
        path: `${dirFor(page.slug)}feed.xml`,
        content: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(page.title)}</title><link>${esc(`${base}${pageBase(page)}/`)}</link><description>${esc(site.seo?.description ?? site.name)}</description>${items}</channel></rss>`,
      });
    }
  }

  // Old addresses keep working
  for (const r of model.redirects) {
    const to = /^https?:/.test(r.to) ? r.to : r.to;
    files.push({
      path: `${dirFor(r.from)}index.html`,
      content: `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${esc(to)}"><meta http-equiv="refresh" content="0; url=${esc(to)}"><a href="${esc(to)}">Continue</a>`,
    });
  }

  files.push({
    path: '404.html',
    content: staticDocument(
      `<title>Page not found | ${esc(site.name)}</title><meta name="robots" content="noindex">`,
      `<main style="font-family:sans-serif;text-align:center;padding:96px 24px"><h1>Page not found</h1><p><a href="/">Back to the home page</a></p></main>`,
      '',
    ),
  });
  files.push({
    path: 'sitemap.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`,
  });
  files.push({
    path: 'robots.txt',
    content: `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`,
  });
  if (!base) {
    skipped.push({
      title: 'sitemap.xml and feeds',
      reason:
        'Set your domain in Site Settings so they contain full web addresses.',
    });
  }
  return { files, skipped };
}

// ---- Minimal ZIP writer (stored, no compression) ---------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export function zipFiles(files: ExportedFile[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const push = (arr: Uint8Array) => {
    chunks.push(arr);
    offset += arr.length;
  };
  for (const f of files) {
    const name = enc.encode(f.path);
    const data = enc.encode(f.content);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    const start = offset;
    push(new Uint8Array(local.buffer));
    push(name);
    push(data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, start, true);
    central.push(new Uint8Array(c.buffer), name);
  }
  const centralStart = offset;
  central.forEach(push);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, offset - centralStart, true);
  end.setUint32(16, centralStart, true);
  push(new Uint8Array(end.buffer));
  const out = new Uint8Array(offset);
  let pos = 0;
  for (const ch of chunks) {
    out.set(ch, pos);
    pos += ch.length;
  }
  return out;
}
