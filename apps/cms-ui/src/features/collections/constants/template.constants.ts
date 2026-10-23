export const SUPPORTED_TEMPLATE_VERSION = '1.0';

export const SAMPLE_DYNAMIC_TEMPLATE = {
  version: '1.0',
  name: 'Dynamic Responsive Page Starter',
  styles: [
    {
      selectors: ['.page-wrapper'],
      style: {
        background: '#09090b',
        color: '#f4f4f5',
        'min-height': '100vh',
        'font-family': 'Inter, system-ui, sans-serif',
      },
    },
    {
      selectors: ['.container-box'],
      style: {
        'max-width': '1120px',
        margin: '0 auto',
        padding: '64px 24px',
      },
    },
    {
      selectors: ['.grid-layout'],
      style: {
        display: 'grid',
        'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        'margin-top': '40px',
      },
    },
    {
      selectors: ['.card-item'],
      style: {
        background: '#18181b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        'border-radius': '12px',
        padding: '32px 24px',
      },
    },
    {
      selectors: ['.action-btn'],
      style: {
        display: 'inline-block',
        padding: '12px 28px',
        background: '#6366f1',
        color: '#ffffff',
        'font-weight': '600',
        'border-radius': '8px',
        'text-decoration': 'none',
      },
    },
  ],
  components: [
    {
      tagName: 'div',
      classes: ['page-wrapper'],
      components: [
        {
          tagName: 'section',
          classes: ['container-box'],
          components: [
            {
              tagName: 'span',
              style: {
                display: 'inline-block',
                padding: '6px 14px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                'border-radius': '9999px',
                'font-size': '13px',
                'font-weight': '600',
                'margin-bottom': '16px',
              },
              content: 'Dynamic GrapesJS Template',
            },
            {
              tagName: 'h1',
              style: {
                'font-size': '44px',
                'font-weight': '800',
                'letter-spacing': '-0.03em',
                margin: '0 0 16px 0',
                color: '#ffffff',
              },
              content: 'Build Any Layout Without Code Bottlenecks',
            },
            {
              tagName: 'p',
              style: {
                'font-size': '18px',
                color: '#a1a1aa',
                'max-width': '640px',
                margin: '0 0 32px 0',
                'line-height': '1.6',
              },
              content:
                'This dynamic template schema accepts arbitrary nested components, styles, tags, and attributes. AI can generate any layout and hydrate it directly into your canvas.',
            },
            {
              tagName: 'a',
              classes: ['action-btn'],
              attributes: { href: '#explore' },
              content: 'Explore Components',
            },
            {
              tagName: 'div',
              classes: ['grid-layout'],
              components: [
                {
                  tagName: 'div',
                  classes: ['card-item'],
                  components: [
                    {
                      tagName: 'h3',
                      style: {
                        'font-size': '20px',
                        'font-weight': '600',
                        margin: '0 0 12px 0',
                        color: '#ffffff',
                      },
                      content: 'Fully Dynamic Tree',
                    },
                    {
                      tagName: 'p',
                      style: {
                        color: '#a1a1aa',
                        margin: '0',
                        'line-height': '1.5',
                      },
                      content:
                        'Nest any HTML element or GrapesJS block at any depth with custom CSS classes.',
                    },
                  ],
                },
                {
                  tagName: 'div',
                  classes: ['card-item'],
                  components: [
                    {
                      tagName: 'h3',
                      style: {
                        'font-size': '20px',
                        'font-weight': '600',
                        margin: '0 0 12px 0',
                        color: '#ffffff',
                      },
                      content: 'One-Click Rollbacks',
                    },
                    {
                      tagName: 'p',
                      style: {
                        color: '#a1a1aa',
                        margin: '0',
                        'line-height': '1.5',
                      },
                      content:
                        'Every save produces an immutable snapshot in the backend. Revert at any time.',
                    },
                  ],
                },
                {
                  tagName: 'div',
                  classes: ['card-item'],
                  components: [
                    {
                      tagName: 'h3',
                      style: {
                        'font-size': '20px',
                        'font-weight': '600',
                        margin: '0 0 12px 0',
                        color: '#ffffff',
                      },
                      content: 'Native Visual Controls',
                    },
                    {
                      tagName: 'p',
                      style: {
                        color: '#a1a1aa',
                        margin: '0',
                        'line-height': '1.5',
                      },
                      content:
                        'Edit text inline, adjust margins and colors visually, or drag new blocks into place.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
