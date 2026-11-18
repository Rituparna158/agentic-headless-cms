import type { PageEntry } from '@/types/content.types';
import { BLOG_FONT_FAMILY } from '../constants/blogTypes';
import { escapeAttr } from './blogHtml.util';

/** A "latest posts" section that shows one specific blog, wherever it is placed. */
export const buildFeaturedPostsSection = (opts: {
  schemaSlug: string;
  title: string;
  limit: number;
}): string => `
<section data-cms-featured="${escapeAttr(opts.schemaSlug)}" style="padding: 56px 24px; ${BLOG_FONT_FAMILY} background: #fdfbf7;">
  <div style="max-width: 1100px; margin: 0 auto;">
    <h2 style="font-size: 28px; font-weight: 800; color: #1c1917; margin: 0 0 28px; text-align: center;">${escapeAttr(opts.title)}</h2>
    <div data-cms-repeat="true" data-cms-schema="${escapeAttr(opts.schemaSlug)}" data-cms-limit="${opts.limit}" class="cms-dynamic-feed" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
      <article class="cms-post-card" style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; display: flex; flex-direction: column; cursor: pointer;">
        <div style="height: 190px; overflow: hidden; background: #f5f5f4;">
          <img data-cms-slot="image" src="" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <div style="padding: 22px; flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 12px; font-weight: 600;">
            <span data-cms-slot="date" style="color: #78716c;">{{date}}</span>
            <span style="color: #d6d3d1;">•</span>
            <span data-cms-slot="author" style="color: #4f46e5;">{{author}}</span>
          </div>
          <h3 data-cms-slot="title" style="font-size: 19px; font-weight: 700; color: #1c1917; margin: 0 0 8px; line-height: 1.35;">{{title}}</h3>
          <p data-cms-slot="excerpt" style="font-size: 14px; color: #78716c; line-height: 1.6; margin: 0 0 16px; flex: 1;">{{excerpt}}</p>
          <a href="#" data-cms-action="view-post" style="font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none;">Read full story →</a>
        </div>
      </article>
    </div>
  </div>
</section>`;

/** Pages (other than the blog's own) whose layout already shows this blog. */
export const pagesFeaturing = (
  pages: PageEntry[],
  schemaSlug: string,
  ownPageId: string,
): PageEntry[] =>
  pages.filter((p) => {
    if (p.id === ownPageId) return false;
    const body = p.data?.body;
    const html =
      body && typeof body === 'object' && !Array.isArray(body)
        ? String((body as { html?: unknown }).html ?? '')
        : '';
    return html.includes(`data-cms-schema="${schemaSlug}"`);
  });
