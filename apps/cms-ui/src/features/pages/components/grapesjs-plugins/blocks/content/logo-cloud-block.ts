import type { Editor } from 'grapesjs';

export const register_logo_cloud_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('logo-cloud-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="6" height="6" rx="1"/>
        <rect x="9" y="6" width="6" height="6" rx="1"/>
        <rect x="16" y="6" width="6" height="6" rx="1"/>
        <rect x="5.5" y="14" width="6" height="6" rx="1"/>
        <rect x="12.5" y="14" width="6" height="6" rx="1"/>
      </svg>
      <div class="gjs-block-label">Logo Cloud</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'logo-cloud-component',
    },
  });

  domc.addType('logo-cloud-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['logo-cloud-section'],
        attributes: { 'data-gjs-type': 'logo-cloud-component' },
        components: `
          <p class="logo-cloud-label">Trusted by industry leaders</p>
          <div class="logo-cloud-grid">
            <div class="logo-cloud-item" style="background:#f1f5f9; color:#64748b; font-weight:700; font-size:16px;">Company A</div>
            <div class="logo-cloud-item" style="background:#f1f5f9; color:#64748b; font-weight:700; font-size:16px;">Company B</div>
            <div class="logo-cloud-item" style="background:#f1f5f9; color:#64748b; font-weight:700; font-size:16px;">Company C</div>
            <div class="logo-cloud-item" style="background:#f1f5f9; color:#64748b; font-weight:700; font-size:16px;">Company D</div>
            <div class="logo-cloud-item" style="background:#f1f5f9; color:#64748b; font-weight:700; font-size:16px;">Company E</div>
          </div>
        `,
        styles: `
          .logo-cloud-section { font-family: var(--font-sans); padding: 48px 24px; background: var(--bg-white); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
          .logo-cloud-label { text-align: center; color: var(--text-light); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 32px; }
          .logo-cloud-grid { max-width: 1000px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 32px; }
          .logo-cloud-item { padding: 16px 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; min-width: 140px; }
        `,
      },
    },
  });
};
