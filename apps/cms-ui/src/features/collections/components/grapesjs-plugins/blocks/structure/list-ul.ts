import type { Editor } from 'grapesjs';

export const register_list_ul = (editor: Editor) => {
  const bm = editor.BlockManager;

  bm.add('list-ul', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="4" cy="6" r="1.5" fill="#a1a1aa" stroke="none"/>
        <circle cx="4" cy="12" r="1.5" fill="#a1a1aa" stroke="none"/>
        <circle cx="4" cy="18" r="1.5" fill="#a1a1aa" stroke="none"/>
      </svg>
      <div class="gjs-block-label">List</div>
    `,
    category: 'Typography',
    content: `<ul style="font-family: var(--font-sans, system-ui); font-size: 16px; color: #475569; line-height: 1.8; padding-left: 24px; margin: 0 0 16px 0;">
      <li>List item one</li>
      <li>List item two</li>
      <li>List item three</li>
    </ul>`,
  });
};
