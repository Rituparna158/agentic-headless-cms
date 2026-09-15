import type { Editor } from 'grapesjs';

export const register_navbar_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('navbar-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
      </svg>
      <div class="gjs-block-label">Navbar</div>
    `,
    category: 'Structure',
    content: `<nav style="font-family: var(--font-sans, system-ui); display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
      <span style="font-size: 20px; font-weight: 700; color: #1e293b;">Brand</span>
      <div style="display: flex; gap: 24px; align-items: center;">
        <a href="#" style="color: #64748b; text-decoration: none; font-size: 15px; font-weight: 500;">Home</a>
        <a href="#" style="color: #64748b; text-decoration: none; font-size: 15px; font-weight: 500;">About</a>
        <a href="#" style="color: #64748b; text-decoration: none; font-size: 15px; font-weight: 500;">Services</a>
        <a href="#" style="color: #64748b; text-decoration: none; font-size: 15px; font-weight: 500;">Contact</a>
      </div>
    </nav>`,
  });
};
