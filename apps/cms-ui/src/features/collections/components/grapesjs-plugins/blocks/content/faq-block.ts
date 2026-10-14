import type { Editor } from 'grapesjs';

export const register_faq_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('faq-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
      </svg>
      <div class="gjs-block-label">FAQ</div>
    `,
    category: 'Content Blocks',
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
              <summary class="faq-question">What is your refund policy?</summary>
              <p class="faq-answer">We offer a 30-day money-back guarantee. If you're not satisfied with our product, contact us within 30 days of purchase for a full refund.</p>
            </details>
            <details class="faq-item">
              <summary class="faq-question">How do I get started?</summary>
              <p class="faq-answer">Simply sign up for a free account, choose your plan, and follow our quick-start guide. You'll be up and running in under 5 minutes.</p>
            </details>
            <details class="faq-item">
              <summary class="faq-question">Do you offer team plans?</summary>
              <p class="faq-answer">Yes! Our Professional and Enterprise plans include team collaboration features with unlimited team members.</p>
            </details>
            <details class="faq-item">
              <summary class="faq-question">Can I cancel anytime?</summary>
              <p class="faq-answer">Absolutely. You can cancel your subscription at any time from your account settings. No questions asked.</p>
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
          .faq-question { padding: 20px 0; font-size: 17px; font-weight: 600; color: var(--text-dark); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
          .faq-question::-webkit-details-marker { display: none; }
          .faq-question::after { content: "+"; font-size: 22px; color: var(--text-light); font-weight: 400; }
          details[open] .faq-question::after { content: "−"; }
          .faq-answer { color: var(--text-light); font-size: 16px; line-height: 1.7; margin: 0; padding: 0 0 20px; }
        `,
      },
    },
  });
};
