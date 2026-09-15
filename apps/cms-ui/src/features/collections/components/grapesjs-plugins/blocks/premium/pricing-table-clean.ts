import type { Editor } from 'grapesjs';

export const register_pricing_table_clean = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('pricing-table-clean', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
      <div class="gjs-block-label">Pricing</div>
    `,
    category: 'Premium Blocks',
    content: {
      type: 'pricing-table-component',
    },
  });

  domc.addType('pricing-table-component', {
    isComponent: (el) =>
      el.getAttribute &&
      el.getAttribute('data-gjs-type') === 'pricing-table-component',
    model: {
      defaults: {
        tagName: 'section',
        classes: ['pricing-table-clean'],
        attributes: { 'data-gjs-type': 'pricing-table-component' },
        components: `
          <div class="pricing-header">
            <h2 class="pricing-title">Simple, transparent pricing</h2>
            <p class="pricing-subtitle">No hidden fees. No surprise charges.</p>
          </div>
          <div class="pricing-container">
            <div class="pricing-card">
              <h3 class="pc-title">Starter</h3>
              <div class="pc-price">$19<span class="pc-period">/mo</span></div>
              <p class="pc-desc">Perfect for individuals and small side projects.</p>
              <ul class="pc-features">
                <li>✔️ Up to 5 projects</li>
                <li>✔️ Basic analytics</li>
                <li>✔️ 24-hour support response</li>
              </ul>
              <a href="#" class="pc-btn">Start Free Trial</a>
            </div>
            
            <div class="pricing-card pc-featured">
              <div class="pc-badge">Most Popular</div>
              <h3 class="pc-title">Professional</h3>
              <div class="pc-price">$49<span class="pc-period">/mo</span></div>
              <p class="pc-desc">Ideal for growing teams and startups.</p>
              <ul class="pc-features">
                <li>✔️ Unlimited projects</li>
                <li>✔️ Advanced analytics</li>
                <li>✔️ 1-hour support response</li>
                <li>✔️ Custom domains</li>
              </ul>
              <a href="#" class="pc-btn pc-btn-featured">Get Started</a>
            </div>
          </div>
        `,
        styles: `
          .pricing-table-clean {
            font-family: var(--font-sans);
            background-color: var(--bg-gray);
            padding: 100px 24px;
          }
          .pricing-header {
            text-align: center;
            margin-bottom: 64px;
          }
          .pricing-title {
            color: var(--text-dark);
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
          }
          .pricing-subtitle {
            color: var(--text-light);
            font-size: 18px;
            margin: 0;
          }
          .pricing-container {
            max-width: 900px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 32px;
            align-items: center;
          }
          .pricing-card {
            background: var(--bg-white);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 48px 32px;
            box-shadow: var(--shadow-sm);
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .pc-featured {
            border: 2px solid var(--primary);
            box-shadow: var(--shadow-lg);
            transform: scale(1.05);
            z-index: 10;
          }
          .pc-badge {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 4px 16px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .pc-title {
            color: var(--text-dark);
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 16px 0;
          }
          .pc-price {
            font-size: 48px;
            font-weight: 800;
            color: var(--text-dark);
            margin: 0 0 16px 0;
            display: flex;
            align-items: baseline;
          }
          .pc-period {
            font-size: 18px;
            font-weight: 500;
            color: var(--text-light);
            margin-left: 4px;
          }
          .pc-desc {
            color: var(--text-light);
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 32px 0;
            padding-bottom: 32px;
            border-bottom: 1px solid var(--border);
          }
          .pc-features {
            list-style: none;
            padding: 0;
            margin: 0 0 40px 0;
            flex-grow: 1;
          }
          .pc-features li {
            color: var(--text-dark);
            font-size: 16px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
          }
          .pc-btn {
            display: block;
            text-align: center;
            background-color: var(--bg-gray);
            color: var(--text-dark);
            padding: 14px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
          }
          .pc-btn:hover {
            background-color: #e2e8f0;
          }
          .pc-btn-featured {
            background-color: var(--primary);
            color: white;
          }
          .pc-btn-featured:hover {
            background-color: var(--primary-hover);
          }
          @media (max-width: 768px) {
            .pc-featured { transform: scale(1); }
          }
        `,
      },
    },
  });
};
