import type { Editor } from 'grapesjs';

export const register_divider_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('divider-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
      <div class="gjs-block-label">Divider</div>
    `,
    category: 'Structure',
    content:
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;"/>',
  });
};
