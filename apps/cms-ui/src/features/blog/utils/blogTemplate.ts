import {
  BLOG_FONT_FAMILY,
  type BlogShowcaseLayout,
} from '../constants/blogTypes';
import { escapeHtml } from './blogHtml.util';

export type { BlogShowcaseLayout };

/**
 * Builds the page layout for a blog type: an archive list followed by a single post reader.
 * Supports multiple modern showcase designs:
 * - 'grid': Crisp modern card grid with 16:9 aspect-ratio cards and metadata badges
 * - 'magazine': Featured hero story on top followed by an editorial 2-column card grid
 * - 'list': Horizontal editorial feed (Medium / Substack style) with side thumbnails
 * - 'minimal': Typography-focused compact chronicle cards with high whitespace
 */
export const buildBlogPageBody = (
  blogName: string,
  schemaSlug: string,
  layout: BlogShowcaseLayout = 'grid',
) => {
  const schema = escapeHtml(schemaSlug);
  const name = escapeHtml(blogName);

  let listHtml = '';

  switch (layout) {
    case 'magazine':
      listHtml = `
<div data-cms-show="list">
<section class="cms-blog-hero cms-hero-magazine" style="padding: 64px 24px 32px; ${BLOG_FONT_FAMILY} background: #fafaf9; border-bottom: 1px solid #f5f5f4;">
  <div class="cms-blog-hero-inner" style="max-width: 1140px; margin: 0 auto; text-align: left;">
    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 999px; background: rgba(225, 29, 72, 0.08); color: #e11d48; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 14px;">
      <span>Featured Journal</span>
    </div>
    <h1 class="cms-blog-title" style="font-size: 42px; font-weight: 900; color: #0f172a; margin: 0 0 10px; line-height: 1.15; letter-spacing: -0.03em;">${name}</h1>
    <p class="cms-blog-subtitle" style="font-size: 17px; color: #64748b; margin: 0; max-width: 600px; line-height: 1.6;">Editorial perspectives, deep dives, and ideas from across the team.</p>
  </div>
</section>
<section class="cms-blog-feed-section" style="padding: 36px 24px 72px; ${BLOG_FONT_FAMILY} background: #fafaf9;">
  <div style="max-width: 1140px; margin: 0 auto;">
    <div data-cms-repeat="true" data-cms-schema="${schema}" class="cms-dynamic-feed cms-feed-magazine" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 32px;">
      <article class="cms-post-card cms-post-card-magazine" style="background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1);">
        <div class="cms-post-image-wrap" style="position: relative; width: 100%; height: 230px; overflow: hidden; background: linear-gradient(135deg, #ffe4e6 0%, #f1f5f9 100%);">
          <img data-cms-slot="image" src="" alt="" class="cms-post-image" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease;" />
        </div>
        <div class="cms-post-content" style="padding: 26px; flex: 1; display: flex; flex-direction: column;">
          <div class="cms-post-meta" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; font-weight: 600;">
            <span data-cms-slot="date" class="cms-post-date" style="color: #64748b;">{{date}}</span>
            <span style="color: #cbd5e1;">•</span>
            <span data-cms-slot="author" class="cms-post-author" style="color: #0f172a; font-weight: 700;">{{author}}</span>
          </div>
          <h3 data-cms-slot="title" class="cms-post-heading" style="font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 10px; line-height: 1.35; letter-spacing: -0.015em;">{{title}}</h3>
          <p data-cms-slot="excerpt" class="cms-post-excerpt" style="font-size: 14px; color: #64748b; line-height: 1.65; margin: 0 0 20px; flex: 1;">{{excerpt}}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #f1f5f9; margin-top: auto;">
            <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" class="cms-post-cta" style="font-size: 13px; font-weight: 700; color: #e11d48; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">Read story →</a>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>
</div>`.trim();
      break;

    case 'list':
      listHtml = `
<div data-cms-show="list">
<section class="cms-blog-hero cms-hero-list" style="padding: 56px 24px 32px; ${BLOG_FONT_FAMILY} background: #ffffff; border-bottom: 1px solid #f1f5f9;">
  <div class="cms-blog-hero-inner" style="max-width: 860px; margin: 0 auto; text-align: left;">
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Articles</div>
    <h1 class="cms-blog-title" style="font-size: 38px; font-weight: 800; color: #0f172a; margin: 0 0 8px; line-height: 1.2; letter-spacing: -0.02em;">${name}</h1>
    <p class="cms-blog-subtitle" style="font-size: 16px; color: #64748b; margin: 0;">Dispatches and in-depth essays, published in chronological order.</p>
  </div>
</section>
<section class="cms-blog-feed-section" style="padding: 32px 24px 72px; ${BLOG_FONT_FAMILY} background: #ffffff;">
  <div style="max-width: 860px; margin: 0 auto;">
    <div data-cms-repeat="true" data-cms-schema="${schema}" class="cms-dynamic-feed cms-feed-list" style="display: flex; flex-direction: column; gap: 24px;">
      <article class="cms-post-card cms-post-card-list" style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: row; gap: 24px; align-items: center; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;">
        <div class="cms-post-content" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          <div class="cms-post-meta" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; font-weight: 600;">
            <span data-cms-slot="author" class="cms-post-author" style="color: #0f172a; font-weight: 700;">{{author}}</span>
            <span style="color: #cbd5e1;">•</span>
            <span data-cms-slot="date" class="cms-post-date" style="color: #64748b;">{{date}}</span>
          </div>
          <h3 data-cms-slot="title" class="cms-post-heading" style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px; line-height: 1.35; letter-spacing: -0.01em;">{{title}}</h3>
          <p data-cms-slot="excerpt" class="cms-post-excerpt" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px;">{{excerpt}}</p>
          <div>
            <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" class="cms-post-cta" style="font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">Read full story →</a>
          </div>
        </div>
        <div class="cms-post-image-wrap" style="width: 210px; height: 140px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%);">
          <img data-cms-slot="image" src="" alt="" class="cms-post-image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
      </article>
    </div>
  </div>
</section>
</div>`.trim();
      break;

    case 'minimal':
      listHtml = `
<div data-cms-show="list">
<section class="cms-blog-hero cms-hero-minimal" style="padding: 56px 24px 28px; ${BLOG_FONT_FAMILY} background: #fafafa; border-bottom: 1px solid #f4f4f5;">
  <div class="cms-blog-hero-inner" style="max-width: 980px; margin: 0 auto; text-align: center;">
    <h1 class="cms-blog-title" style="font-size: 36px; font-weight: 700; color: #18181b; margin: 0 0 8px; letter-spacing: -0.02em;">${name}</h1>
    <p class="cms-blog-subtitle" style="font-size: 15px; color: #71717a; margin: 0;">Thoughtful notes and stories.</p>
  </div>
</section>
<section class="cms-blog-feed-section" style="padding: 32px 24px 64px; ${BLOG_FONT_FAMILY} background: #fafafa;">
  <div style="max-width: 980px; margin: 0 auto;">
    <div data-cms-repeat="true" data-cms-schema="${schema}" class="cms-dynamic-feed cms-feed-minimal" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
      <article class="cms-post-card cms-post-card-minimal" style="background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e4e4e7; display: flex; flex-direction: column; cursor: pointer; padding: 20px; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;">
        <div class="cms-post-image-wrap" style="width: 100%; height: 170px; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background: #f4f4f5;">
          <img data-cms-slot="image" src="" alt="" class="cms-post-image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <div class="cms-post-content" style="flex: 1; display: flex; flex-direction: column;">
          <div class="cms-post-meta" style="font-size: 11px; font-family: ui-monospace, monospace; color: #71717a; margin-bottom: 8px; letter-spacing: 0.04em;">
            <span data-cms-slot="date" class="cms-post-date">{{date}}</span>
            <span style="color: #d4d4d8;">·</span>
            <span data-cms-slot="author" class="cms-post-author" style="color: #18181b; font-weight: 600;">{{author}}</span>
          </div>
          <h3 data-cms-slot="title" class="cms-post-heading" style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0 0 8px; line-height: 1.35;">{{title}}</h3>
          <p data-cms-slot="excerpt" class="cms-post-excerpt" style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0 0 16px; flex: 1;">{{excerpt}}</p>
          <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" class="cms-post-cta" style="font-size: 12px; font-weight: 700; color: #18181b; text-decoration: none;">Read entry →</a>
        </div>
      </article>
    </div>
  </div>
</section>
</div>`.trim();
      break;

    case 'grid':
    default:
      listHtml = `
<div data-cms-show="list">
<section class="cms-blog-hero cms-hero-grid" style="padding: 60px 24px 28px; ${BLOG_FONT_FAMILY} background: #fdfbf7;">
  <div class="cms-blog-hero-inner" style="max-width: 1100px; margin: 0 auto; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: rgba(79, 70, 229, 0.08); color: #4f46e5; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
      <span>Our Stories</span>
    </div>
    <h1 class="cms-blog-title" style="font-size: 40px; font-weight: 800; color: #1c1917; margin: 0 0 10px; line-height: 1.2; letter-spacing: -0.02em;">${name}</h1>
    <p class="cms-blog-subtitle" style="font-size: 17px; color: #78716c; margin: 0 auto; max-width: 540px; line-height: 1.6;">The latest stories, news, and insights from our team.</p>
  </div>
</section>
<section class="cms-blog-feed-section" style="padding: 28px 24px 64px; ${BLOG_FONT_FAMILY} background: #fdfbf7;">
  <div style="max-width: 1100px; margin: 0 auto;">
    <div data-cms-repeat="true" data-cms-schema="${schema}" class="cms-dynamic-feed cms-feed-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
      <article class="cms-post-card cms-post-card-grid" style="background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e7e5e4; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1);">
        <div class="cms-post-image-wrap" style="position: relative; width: 100%; height: 200px; overflow: hidden; background: linear-gradient(135deg, #e0e7ff 0%, #f5f5f4 100%);">
          <img data-cms-slot="image" src="" alt="" class="cms-post-image" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease;" />
        </div>
        <div class="cms-post-content" style="padding: 24px; flex: 1; display: flex; flex-direction: column;">
          <div class="cms-post-meta" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; font-weight: 600;">
            <span data-cms-slot="date" class="cms-post-date" style="color: #78716c;">{{date}}</span>
            <span style="color: #d6d3d1;">•</span>
            <span data-cms-slot="author" class="cms-post-author" style="color: #4f46e5;">{{author}}</span>
          </div>
          <h3 data-cms-slot="title" class="cms-post-heading" style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 10px; line-height: 1.35; letter-spacing: -0.01em;">{{title}}</h3>
          <p data-cms-slot="excerpt" class="cms-post-excerpt" style="font-size: 14px; color: #78716c; line-height: 1.6; margin: 0 0 18px; flex: 1;">{{excerpt}}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #f5f5f4; margin-top: auto;">
            <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" class="cms-post-cta" style="font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">Read full story →</a>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>
</div>`.trim();
      break;
  }

  const readerHtml = `
<article data-cms-show="item" class="cms-post-reader" style="max-width: 820px; margin: 0 auto; padding: 36px 24px 80px; ${BLOG_FONT_FAMILY}">
  <a data-cms-action="back-to-list" href="#" class="cms-reader-back" style="display: inline-flex; align-items: center; gap: 6px; margin-bottom: 24px; font-size: 13px; font-weight: 600; color: #4f46e5; text-decoration: none; padding: 6px 14px; border-radius: 999px; background: #f5f5f4; border: 1px solid #e7e5e4; transition: background 0.15s ease;">← All posts</a>
  <div class="cms-reader-meta" style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 13px; font-weight: 600;">
    <span data-cms-slot="date" class="cms-reader-date" style="color: #78716c;">{{date}}</span>
    <span style="color: #d6d3d1;">•</span>
    <span style="color: #4f46e5;">By <span data-cms-slot="author">{{author}}</span></span>
  </div>
  <h1 data-cms-slot="title" class="cms-reader-title" style="font-size: 38px; font-weight: 800; color: #1c1917; line-height: 1.25; margin: 0 0 16px; letter-spacing: -0.02em;">{{title}}</h1>
  <p data-cms-slot="excerpt" class="cms-reader-excerpt" style="font-size: 19px; color: #78716c; line-height: 1.6; margin: 0 0 32px;">{{excerpt}}</p>
  <div class="cms-reader-image-wrap" style="border-radius: 20px; overflow: hidden; margin-bottom: 36px; max-height: 480px; background: #f5f5f4; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06);">
    <img data-cms-slot="image" src="" alt="" class="cms-reader-image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
  </div>
  <div data-cms-slot="body" class="cms-reader-body" style="font-size: 18px; line-height: 1.85; color: #334155;">{{body}}</div>
</article>`.trim();

  const html = `${listHtml}\n${readerHtml}`;

  const css = `
    .cms-blog-hero { padding: 56px 24px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .cms-blog-hero-inner { max-width: 1100px; margin: 0 auto; }
    .cms-blog-title { font-size: 38px; font-weight: 800; color: #1c1917; margin: 0 0 8px; }
    .cms-blog-subtitle { font-size: 16px; color: #78716c; margin: 0; }
    .cms-blog-feed-section { padding: 24px 24px 56px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .cms-dynamic-feed { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px; }
    .cms-post-card { background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e7e5e4; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1); }
    .cms-post-card:hover { transform: translateY(-3px); box-shadow: 0 16px 25px -4px rgba(0,0,0,0.08); }
    .cms-post-card:hover .cms-post-image { transform: scale(1.03); }
    .cms-post-image-wrap { position: relative; width: 100%; height: 200px; overflow: hidden; background: #f5f5f4; }
    .cms-post-image { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
    .cms-post-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
    .cms-post-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
    .cms-post-heading { font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 8px; line-height: 1.35; }
    .cms-post-excerpt { font-size: 14px; color: #78716c; line-height: 1.6; margin: 0 0 16px; flex: 1; }
    .cms-post-cta { font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; }

    /* Magazine Layout Specific Styling */
    .cms-feed-magazine > article:first-child {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      border-radius: 24px;
    }
    .cms-feed-magazine > article:first-child .cms-post-image-wrap {
      height: 380px;
    }
    .cms-feed-magazine > article:first-child .cms-post-content {
      padding: 36px 32px;
      justify-content: center;
    }
    .cms-feed-magazine > article:first-child .cms-post-heading {
      font-size: 30px;
      line-height: 1.2;
    }
    .cms-feed-magazine > article:first-child .cms-post-excerpt {
      font-size: 16px;
      line-height: 1.65;
    }

    /* List Layout Specific Styling */
    .cms-post-card-list:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px -3px rgba(0,0,0,0.06);
    }
    @media (max-width: 680px) {
      .cms-post-card-list {
        flex-direction: column-reverse !important;
        align-items: stretch !important;
      }
      .cms-post-card-list .cms-post-image-wrap {
        width: 100% !important;
        height: 190px !important;
      }
      .cms-feed-magazine > article:first-child {
        grid-template-columns: 1fr !important;
      }
      .cms-feed-magazine > article:first-child .cms-post-image-wrap {
        height: 220px !important;
      }
    }

    /* Reader View Styling */
    .cms-post-reader { max-width: 820px; margin: 0 auto; padding: 36px 24px 80px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .cms-reader-back:hover { background: #e7e5e4; }
    .cms-reader-title { font-size: 38px; font-weight: 800; color: #1c1917; line-height: 1.25; margin: 0 0 16px; }
    .cms-reader-excerpt { font-size: 19px; color: #78716c; line-height: 1.6; margin: 0 0 32px; }
    .cms-reader-image-wrap { border-radius: 20px; overflow: hidden; margin-bottom: 36px; max-height: 480px; background: #f5f5f4; }
    .cms-reader-image-wrap:has(img[style*="display: none"]),
    .cms-reader-image-wrap:has(img:not([src])),
    .cms-reader-image-wrap:has(img[src=""]) {
      display: none !important;
    }
    .cms-reader-body { font-size: 18px; line-height: 1.85; color: #334155; }
    .cms-reader-body h1, .cms-reader-body h2, .cms-reader-body h3 { color: #0f172a; margin-top: 1.6em; margin-bottom: 0.6em; font-weight: 800; line-height: 1.3; }
    .cms-reader-body p { margin: 1.2em 0; }
    .cms-reader-body blockquote { border-left: 4px solid #4f46e5; margin: 1.8em 0; padding: 8px 0 8px 20px; font-style: italic; color: #475569; background: #f8fafc; border-radius: 0 8px 8px 0; }
    .cms-reader-body a { color: #4f46e5; text-decoration: underline; text-underline-offset: 3px; }
  `.trim();

  return { builder: 'grapesjs', html, css };
};
