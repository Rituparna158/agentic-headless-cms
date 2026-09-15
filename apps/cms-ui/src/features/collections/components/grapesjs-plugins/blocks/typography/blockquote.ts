import type { Editor } from 'grapesjs';

export const register_blockquote = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('blockquote', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/>
      </svg>
      <div class="gjs-block-label">Quote</div>
    `,
    category: 'Typography',
    content:
      '<blockquote style="font-family: var(--font-sans, system-ui); font-size: 20px; font-style: italic; color: #475569; line-height: 1.6; border-left: 4px solid #3b82f6; padding: 16px 24px; margin: 24px 0; background: #f8fafc; border-radius: 0 8px 8px 0;">"Design is not just what it looks like and feels like. Design is how it works."</blockquote>',
  });
};
