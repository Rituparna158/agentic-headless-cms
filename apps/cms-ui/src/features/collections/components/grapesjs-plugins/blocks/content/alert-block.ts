import type { Editor } from 'grapesjs';

export const register_alert_block = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('alert-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
      </svg>
      <div class="gjs-block-label">Alert</div>
    `,
    category: 'Content Blocks',
    content: `<div style="font-family: var(--font-sans, system-ui); display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin: 16px 0;">
      <span style="font-size: 20px; flex-shrink: 0;">ℹ️</span>
      <div>
        <strong style="color: #1e40af; font-size: 15px; display: block; margin-bottom: 4px;">Information</strong>
        <p style="color: #3b82f6; font-size: 14px; margin: 0; line-height: 1.5;">This is an alert banner. You can use it to display important messages to your visitors.</p>
      </div>
    </div>`,
  });
};
