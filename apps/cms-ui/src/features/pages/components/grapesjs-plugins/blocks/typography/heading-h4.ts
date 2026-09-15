import type { Editor } from 'grapesjs';

export const register_heading_h4 = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('heading-h4', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.15"/>
        <text x="12" y="15.5" text-anchor="middle" font-size="11" font-weight="700" fill="#c4b5fd" font-family="system-ui">H4</text>
      </svg>
      <div class="gjs-block-label">Heading 4</div>
    `,
    category: 'Typography',
    content:
      '<h4 style="font-family: var(--font-sans, system-ui); font-size: 24px; font-weight: 700; color: #1e293b; line-height: 1.35; margin: 0 0 12px 0;">Heading 4</h4>',
  });
};
