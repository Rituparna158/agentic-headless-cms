import type { Editor } from 'grapesjs';

export const register_section_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('section-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
      </svg>
      <div class="gjs-block-label">Section</div>
    `,
    category: 'Structure',
    content:
      '<section style="padding: 64px 24px; max-width: 1200px; margin: 0 auto;"></section>',
  });
};
