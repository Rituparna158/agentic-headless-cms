import type { Editor } from 'grapesjs';

export const register_embed_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('embed-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
      <div class="gjs-block-label">Embed</div>
    `,
    category: 'Content Blocks',
    content: `<div style="font-family: var(--font-sans, system-ui); padding: 24px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; text-align: center; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
      <span style="font-size: 32px;">🔗</span>
      <p style="color: #94a3b8; font-size: 15px; margin: 0; font-weight: 500;">Embed Block</p>
      <p style="color: #cbd5e1; font-size: 13px; margin: 0;">Replace this with an iframe, YouTube video, or custom HTML code.</p>
    </div>`,
  });
};
