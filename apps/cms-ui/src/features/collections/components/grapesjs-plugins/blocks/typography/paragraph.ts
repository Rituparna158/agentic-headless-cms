import type { Editor } from 'grapesjs';

export const register_paragraph = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('paragraph', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="4" width="22" height="16" rx="3" fill="#6366f1" opacity="0.15"/>
        <text x="12" y="15.5" text-anchor="middle" font-size="13" font-weight="700" fill="#a5b4fc" font-family="system-ui">P</text>
      </svg>
      <div class="gjs-block-label">Paragraph</div>
    `,
    category: 'Typography',
    content:
      '<p style="font-family: var(--font-sans, system-ui); font-size: 16px; color: #64748b; line-height: 1.7; margin: 0 0 16px 0;">Enter your paragraph text here. You can write as much content as you need and style it using the properties panel on the right.</p>',
  });
};
