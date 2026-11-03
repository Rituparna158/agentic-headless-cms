import type { Editor } from 'grapesjs';

export const register_dynamic_cms_blocks = (editor: Editor) => {
  const bm = editor.BlockManager;

  // Dynamic Blog & Post Card Grid: Repeatable container populated from active collection entries.
  bm.add('dynamic-blog-grid', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
      <div class="gjs-block-label">Dynamic Feed Grid</div>
    `,
    category: 'Dynamic CMS',
    content: `
      <section style="padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa;">
        <div style="max-width: 1100px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 36px;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; background: #eef2ff; padding: 4px 12px; border-radius: 9999px;">Dynamic Feed</span>
            <h2 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 12px 0 8px;">Featured Blog Posts</h2>
            <p style="font-size: 15px; color: #64748b; max-width: 560px; margin: 0 auto;">Explore the latest articles, stories, and insights from our team.</p>
          </div>
          
          <div data-cms-repeat="true" class="cms-dynamic-feed" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
            <article class="cms-post-card" style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05); display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
              <div style="height: 200px; overflow: hidden; background: #f1f5f9; position: relative;">
                <img data-cms-slot="image" src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                <span style="position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.8); backdrop-filter: blur(4px); color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;">Article</span>
              </div>
              <div style="padding: 24px; flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span data-cms-slot="date" style="font-size: 12px; font-weight: 600; color: #64748b;">{{date}}</span>
                  <span style="color: #cbd5e1;">•</span>
                  <span data-cms-slot="author" style="font-size: 12px; font-weight: 600; color: #6366f1;">{{author}}</span>
                </div>
                <h3 data-cms-slot="title" style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px; line-height: 1.35;">{{title}}</h3>
                <p data-cms-slot="excerpt" style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px; flex: 1;">{{excerpt}}</p>
                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #f1f5f9;">
                  <a href="/{{slug}}" data-cms-action="view-post" data-entry-slug="{{slug}}" style="font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                    Read Full Story
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    `,
  });

  // In-Page Dropdown Selector: Allows live switching between posts within the same preview viewport.
  bm.add('dynamic-dropdown-switcher', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
        <path d="M4 4h16v16H4z"/>
      </svg>
      <div class="gjs-block-label">In-Page Dropdown</div>
    `,
    category: 'Dynamic CMS',
    content: `
      <section style="padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
        <div style="max-width: 800px; margin: 0 auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
            <div>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6366f1;">Interactive Selector</span>
              <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0 0;">Select an Item to View:</h2>
            </div>
            <div>
              <select data-cms-dropdown="true" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 600; color: #1e293b; background: #ffffff; cursor: pointer; outline: none;">
                <option value="">-- Choose Item --</option>
              </select>
            </div>
          </div>

          <article class="cms-active-post-container" style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 16px;">
              <span data-cms-slot="author" style="font-size: 12px; font-weight: 600; color: #6366f1; text-transform: uppercase;">{{author}}</span>
              <h1 data-cms-slot="title" style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 6px 0 12px;">{{title}}</h1>
            </div>
            <div style="height: 280px; border-radius: 10px; overflow: hidden; margin-bottom: 20px; background: #f1f5f9;">
              <img data-cms-slot="image" src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800" alt="Cover" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div data-cms-slot="body" style="font-size: 15px; line-height: 1.7; color: #334155;">
              {{body}}
            </div>
          </article>
        </div>
      </section>
    `,
  });

  // Full Post Reader: Formatted single-article view binding title, date, author, cover image, and body.
  bm.add('dynamic-article-reader', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <div class="gjs-block-label">Full Post Reader</div>
    `,
    category: 'Dynamic CMS',
    content: `
      <article class="cms-post-reader" style="max-width: 820px; margin: 0 auto; padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="margin-bottom: 28px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
            <span data-cms-slot="date" style="font-size: 12px; font-weight: 600; color: #64748b;">{{date}}</span>
            <span style="color: #cbd5e1;">•</span>
            <span style="font-size: 12px; font-weight: 600; color: #6366f1;">By <span data-cms-slot="author">{{author}}</span></span>
          </div>
          <h1 data-cms-slot="title" style="font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1.25; margin: 0 0 16px;">{{title}}</h1>
          <p data-cms-slot="excerpt" style="font-size: 18px; color: #64748b; line-height: 1.6; margin: 0;">{{excerpt}}</p>
        </div>
        
        <div style="border-radius: 16px; overflow: hidden; margin-bottom: 36px; max-height: 460px; background: #f1f5f9; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.06);">
          <img data-cms-slot="image" src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>

        <div data-cms-slot="body" style="font-size: 17px; line-height: 1.85; color: #334155;">
          {{body}}
        </div>
      </article>
    `,
  });
};
