import type { Editor } from 'grapesjs';

export const register_badge_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('badge-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5Z"/>
        <path d="m2 17 10 5 10-5"/>
        <path d="m2 12 10 5 10-5"/>
      </svg>
      <div class="gjs-block-label">Badge</div>
    `,
    category: 'Content Blocks',
    content: `<div style="font-family: var(--font-sans, system-ui); display: inline-flex; gap: 8px; flex-wrap: wrap; padding: 8px 0;">
      <span style="background: #eff6ff; color: #3b82f6; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">New</span>
      <span style="background: #f0fdf4; color: #22c55e; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">Active</span>
      <span style="background: #fefce8; color: #eab308; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">Pending</span>
      <span style="background: #fef2f2; color: #ef4444; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">Closed</span>
      <span style="background: #f5f3ff; color: #8b5cf6; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">Premium</span>
    </div>`,
  });
};
