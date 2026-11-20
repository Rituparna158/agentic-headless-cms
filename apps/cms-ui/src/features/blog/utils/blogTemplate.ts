import { BLOG_FONT_FAMILY } from '../constants/blogTypes';
import { escapeHtml } from './blogHtml.util';

/**
 * Pre-wired page layout for a blog type: a list of posts followed by a reader.
 * Every `data-cms-slot` matches a field id used by the blog presets, so the
 * page renders as soon as the first post is published.
 */
export const buildBlogPageBody = (blogName: string, schemaSlug: string) => {
  const schema = escapeHtml(schemaSlug);
  const name = escapeHtml(blogName);
  const html = `
<div data-cms-show="list">
<section style="padding: 56px 24px 24px; ${BLOG_FONT_FAMILY} background: #fdfbf7;">
  <div style="max-width: 1100px; margin: 0 auto; text-align: center;">
    <h1 style="font-size: 36px; font-weight: 800; color: #1c1917; margin: 0 0 8px;">${name}</h1>
    <p style="font-size: 16px; color: #78716c; margin: 0;">The latest stories from our team.</p>
  </div>
</section>
<section style="padding: 24px 24px 56px; ${BLOG_FONT_FAMILY} background: #fdfbf7;">
  <div style="max-width: 1100px; margin: 0 auto;">
    <div data-cms-repeat="true" data-cms-schema="${schema}" class="cms-dynamic-feed" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
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
          <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" style="font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none;">Read full story →</a>
        </div>
      </article>
    </div>
  </div>
</section>
</div>
<article data-cms-show="item" class="cms-post-reader" style="max-width: 820px; margin: 0 auto; padding: 24px 24px 72px; ${BLOG_FONT_FAMILY}">
  <a data-cms-action="back-to-list" href="#" style="display: inline-block; margin-bottom: 20px; font-size: 13px; font-weight: 600; color: #4f46e5; text-decoration: none;">← All posts</a>
  <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 12px; font-weight: 600;">
    <span data-cms-slot="date" style="color: #78716c;">{{date}}</span>
    <span style="color: #d6d3d1;">•</span>
    <span style="color: #4f46e5;">By <span data-cms-slot="author">{{author}}</span></span>
  </div>
  <h2 data-cms-slot="title" style="font-size: 34px; font-weight: 800; color: #1c1917; line-height: 1.25; margin: 0 0 12px;">{{title}}</h2>
  <p data-cms-slot="excerpt" style="font-size: 18px; color: #78716c; line-height: 1.6; margin: 0 0 28px;">{{excerpt}}</p>
  <div style="border-radius: 16px; overflow: hidden; margin-bottom: 32px; max-height: 440px; background: #f5f5f4;">
    <img data-cms-slot="image" src="" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
  </div>
  <div data-cms-slot="body" style="font-size: 17px; line-height: 1.85; color: #44403c;">{{body}}</div>
</article>`.trim();

  const css = `
    .cms-blog-hero { padding: 56px 24px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; }
    .cms-blog-hero-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
    .cms-blog-title { font-size: 36px; font-weight: 800; color: #1c1917; margin: 0 0 8px; }
    .cms-blog-subtitle { font-size: 16px; color: #78716c; margin: 0; }
    .cms-blog-feed-section { padding: 24px 24px 56px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; }
    .cms-dynamic-feed { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px; }
    .cms-post-card { background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .cms-post-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }
    .cms-post-image-wrap { height: 190px; overflow: hidden; background: #f5f5f4; }
    .cms-post-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cms-post-content { padding: 22px; flex: 1; display: flex; flex-direction: column; }
    .cms-post-meta { display: flex; gap: 8px; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
    .cms-post-heading { font-size: 19px; font-weight: 700; color: #1c1917; margin: 0 0 8px; line-height: 1.35; }
    .cms-post-excerpt { font-size: 14px; color: #78716c; line-height: 1.6; margin: 0 0 16px; flex: 1; }
    .cms-post-cta { font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; }
    .cms-post-reader { max-width: 820px; margin: 0 auto; padding: 24px 24px 72px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .cms-reader-image-wrap { border-radius: 16px; overflow: hidden; margin-bottom: 32px; max-height: 440px; background: #f5f5f4; }
    .cms-reader-body { font-size: 17px; line-height: 1.85; color: #44403c; }
  `.trim();

  return { builder: 'grapesjs', html, css };
};
