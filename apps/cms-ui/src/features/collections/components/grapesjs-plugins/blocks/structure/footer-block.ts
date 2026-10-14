import type { Editor } from 'grapesjs';

export const register_footer_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('footer-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 15h18"/>
      </svg>
      <div class="gjs-block-label">Footer</div>
    `,
    category: 'Structure',
    content: `<footer style="font-family: var(--font-sans, system-ui); padding: 48px 32px; background: #0f172a; color: #94a3b8; text-align: center;">
      <p style="margin: 0; font-size: 14px;">© 2026 Your Company. All rights reserved.</p>
    </footer>`,
  });
};
