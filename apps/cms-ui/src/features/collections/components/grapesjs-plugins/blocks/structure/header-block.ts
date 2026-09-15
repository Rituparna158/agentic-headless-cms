import type { Editor } from 'grapesjs';

export const register_header_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('header-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
      </svg>
      <div class="gjs-block-label">Header</div>
    `,
    category: 'Structure',
    content:
      '<header style="padding: 24px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0;"></header>',
  });
};
