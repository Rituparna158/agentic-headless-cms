import type { Editor } from 'grapesjs';

export const register_gallery_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('gallery-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <div class="gjs-block-label">Image Gallery</div>
    `,
    category: 'Content',
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
            <div class="gallery-item" style="background: #f1f5f9; overflow: hidden; border-radius: 12px;">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" alt="Ocean Shore" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div class="gallery-item" style="background: #f1f5f9; overflow: hidden; border-radius: 12px;">
              <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800" alt="Workspace Desk" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div class="gallery-item" style="background: #f1f5f9; overflow: hidden; border-radius: 12px;">
              <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800" alt="Team Brainstorming" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>
        `,
        styles: `
          .gallery-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-white); }
          .gallery-header { text-align: center; margin-bottom: 48px; }
          .gallery-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .gallery-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .gallery-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
          .gallery-item { height: 260px; overflow: hidden; }
        `,
      },
    },
  });
};
