import type { Editor } from 'grapesjs';

export const register_testimonials_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('testimonials-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <div class="gjs-block-label">Testimonials</div>
    `,
    category: 'Content',
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
              <p class="testimonial-text">"Antigravity Headless CMS changed the way our content team works. Fast, flexible, and reliable."</p>
              <div class="testimonial-author">
                <img class="testimonial-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Elena Rostova" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                <div>
                  <div class="testimonial-name">Elena Rostova</div>
                  <div class="testimonial-role">Product Lead, NexaCorp</div>
                </div>
              </div>
            </div>
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <p class="testimonial-text">"Incredible experience from start to finish. The custom schema builder gives us complete control."</p>
              <div class="testimonial-author">
                <img class="testimonial-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Mark Smith" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                <div>
                  <div class="testimonial-name">Mark Smith</div>
                  <div class="testimonial-role">CTO, DevStudio</div>
                </div>
              </div>
            </div>
          </div>
        `,
        styles: `
          .testimonials-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-gray); }
          .testimonials-header { text-align: center; margin-bottom: 48px; }
          .testimonials-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .testimonials-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .testimonials-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
          .testimonial-card { background: var(--bg-white); padding: 32px; border-radius: 12px; border: 1px solid var(--border); }
          .testimonial-stars { color: #f59e0b; font-size: 18px; margin-bottom: 16px; letter-spacing: 2px; }
          .testimonial-text { color: var(--text-dark); font-size: 16px; line-height: 1.6; margin: 0 0 24px; font-style: italic; }
          .testimonial-author { display: flex; align-items: center; gap: 12px; }
          .testimonial-name { font-weight: 600; color: var(--text-dark); font-size: 15px; }
          .testimonial-role { color: var(--text-light); font-size: 13px; }
        `,
      },
    },
  });
};
