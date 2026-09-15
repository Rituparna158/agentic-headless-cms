import type { Editor } from 'grapesjs';

export const register_card_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('card-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 10h18"/>
      </svg>
      <div class="gjs-block-label">Card</div>
    `,
    category: 'Content Blocks',
    content: `<div style="font-family: var(--font-sans, system-ui); max-width: 380px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="height: 200px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);"></div>
      <div style="padding: 24px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Card Title</h3>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">A brief description of this card's content. You can customize everything here.</p>
        <a href="#" style="display: inline-block; color: #3b82f6; font-weight: 600; font-size: 15px; text-decoration: none;">Learn more →</a>
      </div>
    </div>`,
  });
};
