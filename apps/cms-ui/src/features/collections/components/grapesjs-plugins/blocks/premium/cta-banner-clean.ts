import type { Editor } from 'grapesjs';

export const register_cta_banner_clean = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('cta-banner-clean', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <div class="gjs-block-label">CTA Banner</div>
    `,
    category: 'Premium Blocks',
    content: {
      type: 'cta-banner-component',
    },
  });

  domc.addType('cta-banner-component', {
    isComponent: (el) =>
      el.getAttribute &&
      el.getAttribute('data-gjs-type') === 'cta-banner-component',
    model: {
      defaults: {
        tagName: 'section',
        classes: ['cta-banner-clean'],
        attributes: { 'data-gjs-type': 'cta-banner-component' },
        components: `
          <div class="cta-container">
            <div class="cta-content">
              <h2 class="cta-title">Ready to dive in?</h2>
              <p class="cta-desc">Start your free trial today. No credit card required.</p>
            </div>
            <div class="cta-actions">
              <a href="#" class="cta-btn">Get Started Now</a>
            </div>
          </div>
        `,
        styles: `
          .cta-banner-clean {
            font-family: var(--font-sans);
            background-color: var(--primary);
            padding: 64px 24px;
          }
          .cta-container {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 32px;
          }
          .cta-content {
            flex: 1;
          }
          .cta-title {
            color: white;
            font-size: 32px;
            font-weight: 800;
            margin: 0 0 8px 0;
            letter-spacing: -0.01em;
          }
          .cta-desc {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin: 0;
          }
          .cta-actions {
            flex-shrink: 0;
          }
          .cta-btn {
            display: inline-block;
            background-color: white;
            color: var(--primary);
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
          }
          .cta-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }
          @media (max-width: 768px) {
            .cta-container { flex-direction: column; text-align: center; }
            .cta-btn { width: 100%; }
          }
        `,
      },
    },
  });
};
