import type { Editor } from 'grapesjs';

export const register_team_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.Components;

  bm.add('team-block', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <div class="gjs-block-label">Team</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'team-component',
    },
  });

  domc.addType('team-component', {
    model: {
      defaults: {
        tagName: 'section',
        classes: ['team-section'],
        attributes: { 'data-gjs-type': 'team-component' },
        components: `
          <div class="team-header">
            <h2 class="team-title">Meet Our Team</h2>
            <p class="team-subtitle">The talented people behind our success.</p>
          </div>
          <div class="team-grid">
            <div class="team-card">
              <div class="team-avatar" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">AJ</div>
              <h3 class="team-name">Alex Johnson</h3>
              <p class="team-role">Founder & CEO</p>
              <p class="team-bio">Visionary leader with 15+ years in tech innovation.</p>
            </div>
            <div class="team-card">
              <div class="team-avatar" style="background: linear-gradient(135deg, #ec4899, #f97316);">SR</div>
              <h3 class="team-name">Sarah Roberts</h3>
              <p class="team-role">Head of Design</p>
              <p class="team-bio">Award-winning designer passionate about user experiences.</p>
            </div>
            <div class="team-card">
              <div class="team-avatar" style="background: linear-gradient(135deg, #22d3ee, #3b82f6);">MC</div>
              <h3 class="team-name">Mike Chen</h3>
              <p class="team-role">Lead Engineer</p>
              <p class="team-bio">Full-stack developer building scalable solutions.</p>
            </div>
            <div class="team-card">
              <div class="team-avatar" style="background: linear-gradient(135deg, #fbbf24, #f97316);">EW</div>
              <h3 class="team-name">Emily Wang</h3>
              <p class="team-role">Marketing Director</p>
              <p class="team-bio">Data-driven marketer growing brands worldwide.</p>
            </div>
          </div>
        `,
        styles: `
          .team-section { font-family: var(--font-sans); padding: 80px 24px; background: var(--bg-white); }
          .team-header { text-align: center; margin-bottom: 48px; }
          .team-title { color: var(--text-dark); font-size: 36px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.02em; }
          .team-subtitle { color: var(--text-light); font-size: 18px; margin: 0; }
          .team-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; }
          .team-card { text-align: center; padding: 32px 24px; }
          .team-avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 24px; margin: 0 auto 20px; }
          .team-name { color: var(--text-dark); font-size: 18px; font-weight: 700; margin: 0 0 4px; }
          .team-role { color: var(--primary); font-size: 14px; font-weight: 600; margin: 0 0 12px; }
          .team-bio { color: var(--text-light); font-size: 15px; line-height: 1.6; margin: 0; }
        `,
      },
    },
  });
};
