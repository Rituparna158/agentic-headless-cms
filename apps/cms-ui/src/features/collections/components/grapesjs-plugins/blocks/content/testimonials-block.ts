import type { Editor } from 'grapesjs';

export const register_testimonials_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('testimonials-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <div class="gjs-block-label">Testimonials</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'testimonials-component',
    },
  });

  domc.addType('testimonials-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['testimonials-section'],
        attributes: { 'data-gjs-type': 'testimonials-component' },
        components: `
          <div class="testimonials-header">
            <h2 class="testimonials-title">What our customers say</h2>
            <p class="testimonials-subtitle">Don't just take our word for it — hear from our happy clients.</p>
          </div>
          <div class="testimonials-grid">
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <p class="testimonial-text">"This product transformed our workflow. The team's productivity has increased by 40% since we started using it."</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:#3b82f6;">JD</div>
                <div>
                  <div class="testimonial-name">Jane Doe</div>
                  <div class="testimonial-role">CEO, TechCorp</div>
                </div>
              </div>
            </div>
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <p class="testimonial-text">"Incredible experience from start to finish. The support team is incredibly responsive and helpful."</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:#8b5cf6;">MS</div>
                <div>
                  <div class="testimonial-name">Mark Smith</div>
                  <div class="testimonial-role">CTO, DevStudio</div>
                </div>
              </div>
            </div>
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <p class="testimonial-text">"Best investment we've made this year. Clean, intuitive, and powerful. Couldn't recommend it more."</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:#ec4899;">AL</div>
                <div>
                  <div class="testimonial-name">Amy Lee</div>
                  <div class="testimonial-role">Designer, Artify</div>
                </div>
              </div>
            </div>
          </div>
        `,
        styles: `/home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/pages/components/grapesjs-plugins/CustomBlocksPlugin.ts
          .testimonials-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-gray); }
          .testimonials-header { text-align: center; margin-bottom: 48px; }
          .testimonials-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .testimonials-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .testimonials-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
          .testimonial-card { background: white; border-radius: 16px; padding: 32px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
          .testimonial-stars { color: #fbbf24; font-size: 18px; margin-bottom: 16px; letter-spacing: 2px; }
          .testimonial-text { color: var(--text-dark); font-size: 16px; line-height: 1.7; margin: 0 0 24px; }
          .testimonial-author { display: flex; align-items: center; gap: 12px; }
          .testimonial-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; }
          .testimonial-name { color: var(--text-dark); font-weight: 600; font-size: 15px; }
          .testimonial-role { color: var(--text-light); font-size: 13px; }
        `,
      },
    },
  });
};
