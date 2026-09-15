import type { Editor } from 'grapesjs';

export const register_spacer_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('spacer-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14"/>
        <path d="m19 12-7 7-7-7"/>
      </svg>
      <div class="gjs-block-label">Spacer</div>
    `,
    category: 'Structure',
    content: '<div style="height: 48px;"></div>',
  });
};
