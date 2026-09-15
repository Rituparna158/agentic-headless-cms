import type { Editor } from 'grapesjs';

export const register_gallery_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('gallery-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <div class="gjs-block-label">Gallery</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'gallery-component',
    },
  });

  domc.addType('gallery-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['gallery-section'],
        attributes: { 'data-gjs-type': 'gallery-component' },
        components: `
          <div class="gallery-header">
            <h2 class="gallery-title">Our Gallery</h2>
            <p class="gallery-subtitle">A showcase of our best work.</p>
          </div>
          <div class="gallery-grid">
            <div class="gallery-item" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);"></div>
            <div class="gallery-item" style="background: linear-gradient(135deg, #ec4899, #f97316);"></div>
            <div class="gallery-item" style="background: linear-gradient(135deg, #22d3ee, #3b82f6);"></div>
            <div class="gallery-item" style="background: linear-gradient(135deg, #fbbf24, #f97316);"></div>
            <div class="gallery-item" style="background: linear-gradient(135deg, #34d399, #22d3ee);"></div>
            <div class="gallery-item" style="background: linear-gradient(135deg, #8b5cf6, #ec4899);"></div>
          </div>
        `,
        styles: `
          .gallery-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-white); }
          .gallery-header { text-align: center; margin-bottom: 48px; }
          .gallery-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .gallery-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .gallery-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
          .gallery-item { aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .gallery-item:hover { transform: scale(1.03); box-shadow: var(--shadow-lg); }
        `,
      },
    },
  });
};
