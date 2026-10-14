import type { Editor } from 'grapesjs';

export const register_tabs_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('tabs-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 3v6"/>
      </svg>
      <div class="gjs-block-label">Tabs</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'tabs-component',
    },
  });

  domc.addType('tabs-component', {
    model: {
      defaults: {
        tagName: 'div',
        classes: ['tabs-wrapper'],
        attributes: { 'data-gjs-type': 'tabs-component' },
        components: `
          <div class="tabs-header">
            <button class="tab-btn tab-btn-active">Features</button>
            <button class="tab-btn">Integration</button>
            <button class="tab-btn">Security</button>
          </div>
          <div class="tab-content">
            <h3 class="tab-content-title">Powerful Features</h3>
            <p class="tab-content-text">Our platform provides everything you need to build, deploy, and scale your web applications. From intuitive design tools to advanced analytics, we've got you covered.</p>
          </div>
        `,
        styles: `
          .tabs-wrapper { font-family: var(--font-sans); max-width: 700px; margin: 32px auto; }
          .tabs-header { display: flex; border-bottom: 2px solid var(--border); gap: 0; }
          .tab-btn { padding: 12px 24px; border: none; background: none; font-size: 15px; font-weight: 600; color: var(--text-light); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s ease; font-family: inherit; }
          .tab-btn:hover { color: var(--text-dark); }
          .tab-btn-active { color: var(--primary); border-bottom-color: var(--primary); }
          .tab-content { padding: 32px 0; }
          .tab-content-title { color: var(--text-dark); font-size: 24px; font-weight: 700; margin: 0 0 12px; }
          .tab-content-text { color: var(--text-light); font-size: 16px; line-height: 1.7; margin: 0; }
        `,
      },
    },
  });
};
