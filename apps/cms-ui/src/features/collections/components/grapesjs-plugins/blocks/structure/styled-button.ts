import type { Editor } from 'grapesjs';

export const register_styled_button = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('styled-button', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="10" rx="5"/>
        <path d="M12 12h.01"/>
      </svg>
      <div class="gjs-block-label">Button</div>
    `,
    category: 'Structure',
    content:
      '<a href="#" style="font-family: var(--font-sans, system-ui); display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Click Me</a>',
  });
};
