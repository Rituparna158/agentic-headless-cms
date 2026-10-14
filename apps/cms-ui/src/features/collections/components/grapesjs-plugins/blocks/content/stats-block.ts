import type { Editor } from 'grapesjs';

export const register_stats_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('stats-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 20V10"/>
        <path d="M12 20V4"/>
        <path d="M6 20v-6"/>
      </svg>
      <div class="gjs-block-label">Stats</div>
    `,
    category: 'Content Blocks',
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
              <div class="stat-number">500+</div>
              <div class="stat-label">Happy Clients</div>
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
          .stat-number { color: white; font-size: 48px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
          .stat-label { color: rgba(255,255,255,0.6); font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
        `,
      },
    },
  });
};
