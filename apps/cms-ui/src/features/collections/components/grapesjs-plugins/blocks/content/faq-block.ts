import type { Editor } from 'grapesjs';

export const register_faq_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('faq-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div class="gjs-block-label">FAQ Accordion</div>
    `,
    category: 'Content',
    content: {
      type: 'faq-component',
    },
  });

  domc.addType('faq-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['faq-section'],
        attributes: { 'data-gjs-type': 'faq-component' },
        components: `
          <div class="faq-header">
            <h2 class="faq-title">Frequently Asked Questions</h2>
            <p class="faq-subtitle">Everything you need to know about our product.</p>
          </div>
          <div class="faq-list">
            <details class="faq-item" open>
              <summary class="faq-question">What is this headless CMS?</summary>
              <div class="faq-answer">An advanced dynamic content management system with visual drag-and-drop page building and page-specific custom schemas.</div>
            </details>
            <details class="faq-item">
              <summary class="faq-question">How do I get started?</summary>
              <div class="faq-answer">Simply create a collection, add your pages, define custom schemas with fields, and design your layout in the visual builder.</div>
            </details>
          </div>
        `,
        styles: `
          .faq-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-white); }
          .faq-header { text-align: center; margin-bottom: 48px; }
          .faq-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .faq-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .faq-list { max-width: 720px; margin: 0 auto; }
          .faq-item { border-bottom: 1px solid var(--border); }
          .faq-question { padding: 20px 0; font-size: 18px; font-weight: 600; color: var(--text-dark); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
          .faq-question::-webkit-details-marker { display: none; }
          .faq-question::after { content: '+'; font-size: 24px; font-weight: 400; color: var(--text-light); }
          details[open] .faq-question::after { content: '−'; }
          .faq-answer { padding-bottom: 24px; color: var(--text-muted); font-size: 16px; line-height: 1.6; }
        `,
      },
    },
  });
};
