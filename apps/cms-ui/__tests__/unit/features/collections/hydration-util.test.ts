import { describe, it, expect } from 'vitest';
import { hydrateHtmlTemplate } from '@/features/collections/utils/hydration.util';

describe('CMS Template Hydration Utility', () => {
  it('hydrates simple mustache tokens for title, slug, and direct body attributes', () => {
    const template =
      '<h1>{{title}}</h1><span class="slug">{{slug}}</span><p class="price">${{price}}</p>';
    const entry = {
      title: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      body: {
        price: 399.99,
        color: 'Silver',
      },
    };

    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('Sony WH-1000XM5');
    expect(result).toContain('sony-wh-1000xm5');
    expect(result).toContain('$399.99');
  });

  it('hydrates nested body keys like {{body.specs.battery}}', () => {
    const template =
      '<div class="battery">Battery: {{body.specs.battery}}</div>';
    const entry = {
      title: 'Headphones',
      body: {
        specs: {
          battery: '30 hours',
        },
      },
    };

    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('Battery: 30 hours');
  });

  it('hydrates elements using [data-cms-slot] attributes', () => {
    const template = `
      <div>
        <h2 data-cms-slot="title">Placeholder Title</h2>
        <span data-cms-slot="body.price">0.00</span>
        <img data-cms-slot="body.image" src="/fallback.png" />
      </div>
    `;

    const entry = {
      title: 'MacBook Pro M3 Max',
      slug: 'macbook-pro-m3',
      body: {
        price: '3499',
        image: 'https://example.com/macbook.jpg',
      },
    };

    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('MacBook Pro M3 Max');
    expect(result).toContain('3499');
    expect(result).toContain('src="https://example.com/macbook.jpg"');
  });

  it('hydrates repeating collection lists with [data-cms-collection]', () => {
    const template = `
      <div data-cms-collection="products">
        <div class="product-card">
          <h3>{{title}}</h3>
          <span>{{price}}</span>
        </div>
      </div>
    `;

    const allEntries = [
      { title: 'iPhone 16 Pro', body: { price: '999' } },
      { title: 'Samsung S24 Ultra', body: { price: '1199' } },
    ];

    const result = hydrateHtmlTemplate(template, null, allEntries);
    expect(result).toContain('iPhone 16 Pro');
    expect(result).toContain('Samsung S24 Ultra');
    expect(result).toContain('999');
    expect(result).toContain('1199');
  });

  it('handles empty html and missing entries gracefully', () => {
    expect(hydrateHtmlTemplate('')).toBe('');
    expect(hydrateHtmlTemplate('<div>Static</div>', null, [])).toBe(
      '<div>Static</div>',
    );
  });

  it('hydrates markdown body and converts to formatted markup', () => {
    const template = '<div data-cms-slot="body">Default</div>';
    const entry = {
      title: 'Markdown Entry',
      body: {
        markdown: '# Heading 1\nSome description',
      },
    };
    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('white-space: pre-wrap;');
    expect(result).toContain('# Heading 1');
  });

  it('hydrates anchor links with data-cms-slot="url"', () => {
    const template = '<a data-cms-slot="url" href="#">Link</a>';
    const entry = {
      title: 'Link Entry',
      url: 'https://example.com/target',
    };
    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('href="https://example.com/target"');
  });

  it('populates select[data-cms-dropdown] options', () => {
    const template = '<select data-cms-dropdown="pages"></select>';
    const entries = [
      { id: 'p1', title: 'Home' },
      { id: 'p2', title: 'About' },
    ];
    const result = hydrateHtmlTemplate(template, entries[0], entries);
    expect(result).toContain('value="p1"');
    expect(result).toContain('selected');
    expect(result).toContain('Home');
    expect(result).toContain('value="p2"');
    expect(result).toContain('About');
  });

  it('stamps data-entry-id on .cms-active-post-container', () => {
    const template =
      '<div class="cms-active-post-container"><h1>{{title}}</h1></div>';
    const entry = { id: 'post-99', title: 'My Post' };
    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('data-entry-id="post-99"');
    expect(result).toContain('My Post');
  });
});
