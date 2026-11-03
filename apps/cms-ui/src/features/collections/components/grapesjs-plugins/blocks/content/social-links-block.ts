import type { Editor } from 'grapesjs';

export const register_social_links_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('social-links-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      <div class="gjs-block-label">Social Links</div>
    `,
    category: 'Content Blocks',
    content: `<div style="font-family: var(--font-sans, system-ui); display: flex; gap: 12px; justify-content: center; padding: 24px 0;">
      <a href="#" style="width: 44px; height: 44px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 18px; transition: transform 0.2s ease;" title="Twitter">𝕏</a>
      <a href="#" style="width: 44px; height: 44px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 18px; transition: transform 0.2s ease;" title="GitHub">⬡</a>
      <a href="#" style="width: 44px; height: 44px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 18px; transition: transform 0.2s ease;" title="LinkedIn">in</a>
      <a href="#" style="width: 44px; height: 44px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 18px; transition: transform 0.2s ease;" title="YouTube">▶</a>
      <a href="#" style="width: 44px; height: 44px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-size: 18px; transition: transform 0.2s ease;" title="Instagram">📷</a>
    </div>`,
  });
};
