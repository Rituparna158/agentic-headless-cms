import type { Editor } from 'grapesjs';

export const register_heading_h2 = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('heading-h2', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.2"/>
        <text x="12" y="15.5" text-anchor="middle" font-size="11" font-weight="700" fill="#c4b5fd" font-family="system-ui">H2</text>
      </svg>
      <div class="gjs-block-label">Heading 2</div>
    `,
    category: 'Typography',
    content:
      '<h2 style="font-family: var(--font-sans, system-ui); font-size: 36px; font-weight: 800; color: #1e293b; line-height: 1.25; letter-spacing: -0.02em; margin: 0 0 16px 0;">Heading 2</h2>',
  });
};
