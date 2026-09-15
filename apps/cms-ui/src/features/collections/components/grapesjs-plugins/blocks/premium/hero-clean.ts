import type { Editor } from 'grapesjs';

export const register_hero_clean = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('hero-clean', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
      </svg>
      <div class="gjs-block-label">Hero Section</div>
    `,
    category: 'Premium Blocks',
    content: {
      type: 'hero-clean-component',
    },
  });

  domc.addType('hero-clean-component', {
    isComponent: (el) =>
      el.getAttribute &&
      el.getAttribute('data-gjs-type') === 'hero-clean-component',
    model: {
      defaults: {
        tagName: 'section',
        classes: ['hero-clean'],
        components: `
          <div class="hero-container" data-gjs-type="hero-clean-component">
            <span class="hero-badge">✨ New Feature Release</span>
            <h1 class="hero-title">Build Beautiful Interfaces Faster</h1>
            <p class="hero-subtitle">Create stunning websites in minutes with our drag-and-drop page builder. No coding required, just pure aesthetic.</p>
            <div class="hero-actions">
              <a href="#" class="btn-primary">Get Started</a>
              <a href="#" class="btn-secondary">Learn More</a>
            </div>
          </div>
        `,
        styles: `
          .hero-clean {
            font-family: var(--font-sans);
            background: linear-gradient(135deg, var(--bg-gray) 0%, #ffffff 100%);
            padding: 100px 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 500px;
          }
          .hero-container {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-badge {
            background: #eff6ff;
            color: var(--primary);
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            display: inline-block;
          }
          .hero-title {
            color: var(--text-dark);
            font-size: 48px;
            font-weight: 800;
            line-height: 1.2;
            margin: 0 0 24px 0;
            letter-spacing: -0.02em;
          }
          .hero-subtitle {
            color: var(--text-light);
            font-size: 20px;
            line-height: 1.6;
            margin: 0 0 40px 0;
            max-width: 600px;
          }
          .hero-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
          }
          .btn-primary {
            background-color: var(--primary);
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-sm);
          }
          .btn-primary:hover {
            background-color: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }
          .btn-secondary {
            background-color: white;
            color: var(--text-dark);
            border: 1px solid var(--border);
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
          }
          .btn-secondary:hover {
            background-color: var(--bg-gray);
            border-color: var(--text-light);
          }
          @media (max-width: 768px) {
            .hero-title { font-size: 36px; }
            .hero-subtitle { font-size: 18px; }
            .hero-actions { flex-direction: column; width: 100%; }
            .hero-actions a { width: 100%; }
          }
        `,
      },
    },
  });
};
