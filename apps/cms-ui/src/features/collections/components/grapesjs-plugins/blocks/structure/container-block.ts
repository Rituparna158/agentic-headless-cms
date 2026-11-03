import type { Editor } from 'grapesjs';

export const register_container_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('container-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
      <div class="gjs-block-label">Container</div>
    `,
    category: 'Structure',
    content:
      '<div style="padding: 16px; max-width: 1200px; margin: 0 auto;"></div>',
  });
};
