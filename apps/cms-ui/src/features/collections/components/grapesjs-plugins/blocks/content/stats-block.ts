import type { Editor } from 'grapesjs';

export const register_stats_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('stats-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <div class="gjs-block-label">Stats Grid</div>
    `,
    category: 'Content',
    content: {
      type: 'stats-component',
    },
  });

  domc.addType('stats-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['stats-section'],
        attributes: { 'data-gjs-type': 'stats-component' },
        components: `
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-number">10M+</div>
              <div class="stat-label">Requests / Day</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">1.2M</div>
              <div class="stat-label">Users Worldwide</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">99.9%</div>
              <div class="stat-label">Uptime SLA</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Support Available</div>
            </div>
          </div>
        `,
        styles: `
          .stats-section { font-family: var(--font-sans); padding: 64px 24px; background: var(--text-dark); }
          .stats-container { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 32px; text-align: center; }
          .stat-item { padding: 16px; }
          .stat-number { font-size: 48px; font-weight: 800; color: #ffffff; margin-bottom: 8px; line-height: 1; letter-spacing: -0.02em; }
          .stat-label { font-size: 14px; font-weight: 500; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.05em; }
        `,
      },
    },
  });
};
