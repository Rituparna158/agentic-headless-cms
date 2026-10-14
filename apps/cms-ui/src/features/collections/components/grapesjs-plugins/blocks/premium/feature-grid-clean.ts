import type { Editor } from 'grapesjs';

export const register_feature_grid_clean = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('feature-grid-clean', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <div class="gjs-block-label">Feature Grid</div>
    `,
    category: 'Premium Blocks',
    content: {
      type: 'feature-grid-component',
    },
  });

  domc.addType('feature-grid-component', {
    isComponent: (el) =>
      el.getAttribute &&
      el.getAttribute('data-gjs-type') === 'feature-grid-component',
    model: {
      defaults: {
        tagName: 'section',
        classes: ['feature-grid-clean'],
        attributes: { 'data-gjs-type': 'feature-grid-component' },
        components: `
          <div class="fg-header">
            <h2 class="fg-title">Why Choose Us</h2>
            <p class="fg-subtitle">Everything you need to build amazing digital experiences.</p>
          </div>
          <div class="fg-container">
            <div class="fg-card">
              <div class="fg-icon">🚀</div>
              <h3 class="fg-card-title">Lightning Fast</h3>
              <p class="fg-card-desc">Optimized for speed and performance, ensuring your site loads in milliseconds.</p>
            </div>
            <div class="fg-card">
              <div class="fg-icon">🛡️</div>
              <h3 class="fg-card-title">Secure by Default</h3>
              <p class="fg-card-desc">Enterprise-grade security built directly into the core architecture.</p>
            </div>
            <div class="fg-card">
              <div class="fg-icon">🎨</div>
              <h3 class="fg-card-title">Pixel Perfect</h3>
              <p class="fg-card-desc">Design tools that give you absolute control over every single pixel.</p>
            </div>
          </div>
        `,
        styles: `
          .feature-grid-clean {
            font-family: var(--font-sans);
            background-color: var(--bg-white);
            padding: 80px 24px;
          }
          .fg-header {
            text-align: center;
            margin-bottom: 60px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          .fg-title {
            color: var(--text-dark);
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
          }
          .fg-subtitle {
            color: var(--text-light);
            font-size: 18px;
            line-height: 1.6;
            margin: 0;
          }
          .fg-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 32px;
          }
          .fg-card {
            background: var(--bg-white);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 40px 32px;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-sm);
          }
          .fg-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary);
          }
          .fg-icon {
            font-size: 32px;
            margin-bottom: 24px;
            background: var(--bg-gray);
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
          }
          .fg-card-title {
            color: var(--text-dark);
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 12px 0;
          }
          .fg-card-desc {
            color: var(--text-light);
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
          }
        `,
      },
    },
  });
};
