import type { Editor } from 'grapesjs';

export const register_contact_info_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('contact-info-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      <div class="gjs-block-label">Contact</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'contact-info-component',
    },
  });

  domc.addType('contact-info-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['contact-info-section'],
        attributes: { 'data-gjs-type': 'contact-info-component' },
        components: `
          <div class="contact-container">
            <div class="contact-left">
              <h2 class="contact-title">Get in Touch</h2>
              <p class="contact-subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              <div class="contact-items">
                <div class="contact-item">
                  <span class="contact-icon">📍</span>
                  <div>
                    <strong>Address</strong>
                    <p>123 Business St, Suite 100<br/>San Francisco, CA 94105</p>
                  </div>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">📧</span>
                  <div>
                    <strong>Email</strong>
                    <p>hello@company.com</p>
                  </div>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">📞</span>
                  <div>
                    <strong>Phone</strong>
                    <p>+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="contact-right">
              <div class="contact-map-placeholder" style="background: linear-gradient(135deg, #e2e8f0, #f1f5f9); height: 100%; min-height: 300px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 18px; font-weight: 600;">
                📍 Map Embed Here
              </div>
            </div>
          </div>
        `,
        styles: `
          .contact-info-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-white); }
          .contact-container { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
          .contact-left { }
          .contact-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .contact-subtitle { color: var(--text-light); font-size: 18px; line-height: 1.6; margin: 0 0 32px; }
          .contact-items { display: flex; flex-direction: column; gap: 24px; }
          .contact-item { display: flex; gap: 16px; align-items: flex-start; }
          .contact-icon { font-size: 24px; flex-shrink: 0; }
          .contact-item strong { color: var(--text-dark); font-size: 15px; display: block; margin-bottom: 4px; }
          .contact-item p { color: var(--text-light); font-size: 15px; margin: 0; line-height: 1.5; }
          .contact-right { }
          @media (max-width: 768px) { .contact-container { grid-template-columns: 1fr; } }
        `,
      },
    },
  });
};
