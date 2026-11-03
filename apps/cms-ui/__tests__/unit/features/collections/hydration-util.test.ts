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

  it('hydrates repeating feed from multi-entry schema items on target entry', () => {
    const template = `
      <div data-cms-repeat="true" class="cms-dynamic-feed">
        <article class="card">
          <h3>{{title}}</h3>
          <p>{{excerpt}}</p>
          <img data-cms-slot="image" src="" />
        </article>
      </div>
    `;

    const entry = {
      id: 'index-page',
      data: {
        title: 'Blog Index',
        _schemas: [
          {
            slug: 'posts',
            entryType: 'multi',
            items: [
              {
                title: 'AI in Architecture',
                excerpt: 'First post excerpt',
                cover_image_url: 'https://example.com/ai.jpg',
              },
              {
                title: 'Robotics in Surgery',
                excerpt: 'Second post excerpt',
                cover_image_url: 'https://example.com/robotics.jpg',
              },
            ],
          },
        ],
      },
    };

    const result = hydrateHtmlTemplate(template, entry, [entry]);
    expect(result).toContain('AI in Architecture');
    expect(result).toContain('First post excerpt');
    expect(result).toContain('src="https://example.com/ai.jpg"');
    expect(result).toContain('Robotics in Surgery');
    expect(result).toContain('Second post excerpt');
    expect(result).toContain('src="https://example.com/robotics.jpg"');
    expect(result).toContain('data-item-index="0"');
    expect(result).toContain('data-item-index="1"');
  });

  it('prevents duplicate cards when collection contains blank layout pages without schemas', () => {
    const template = `
      <div data-cms-repeat="true">
        <article class="card">
          <h3>{{title}}</h3>
        </article>
      </div>
    `;

    const indexPage = {
      id: 'index-page',
      data: {
        title: 'Index Page',
        _schemas: [
          {
            slug: 'featured_post',
            entryType: 'single',
            values: {
              title: 'Only One Post Created',
            },
          },
        ],
      },
    };

    // A blank reader page layout with grapesjs builder and no custom schema content
    const blankReaderPage = {
      id: 'blog-content-page',
      data: {
        title: 'blog-content-page',
        body: { builder: 'grapesjs', html: '<div>Reader</div>' },
        _schemas: null,
      },
    };

    const result = hydrateHtmlTemplate(template, indexPage, [
      indexPage,
      blankReaderPage,
    ]);
    expect(result).toContain('Only One Post Created');
    // Ensure blog-content-page is not duplicated as an empty second card
    expect(result).not.toContain('blog-content-page');
    // Only one article card should be generated
    const matchCount = (result.match(/<article[^>]*class="card"/g) || [])
      .length;
    expect(matchCount).toBe(1);
  });

  it('inherits collection schema values for reader pages without their own schemas', () => {
    const template = `
      <div class="cms-post-reader">
        <h1>{{title}}</h1>
        <p>{{author}}</p>
      </div>
    `;

    const indexPageWithSchema = {
      id: 'index-page',
      data: {
        _schemas: [
          {
            slug: 'blog',
            values: {
              title: 'The Future of AI',
              author: 'Sarah Jenkins',
            },
          },
        ],
      },
    };

    const readerPageWithoutSchema = {
      id: 'blog-content-page',
      data: {
        title: 'blog-content-page',
        _schemas: null,
      },
    };

    const result = hydrateHtmlTemplate(template, readerPageWithoutSchema, [
      readerPageWithoutSchema,
      indexPageWithSchema,
    ]);

    expect(result).toContain('The Future of AI');
    expect(result).toContain('Sarah Jenkins');
  });

  it('hydrates reader detail page using a specific item entry from multi-entry schemas', () => {
    const readerTemplate = `
      <h1 data-cms-slot="title">Default Title</h1>
      <span data-cms-slot="author">Default Author</span>
      <div data-cms-slot="content">Default Content</div>
    `;

    const item2Entry = {
      id: 'item_2',
      data: {
        title: 'Designing Modern Headless CMS Architectures',
        author: 'Elena Chen',
        content: '<p>Traditional monolithic CMS platforms...</p>',
        slug: 'item-2',
      },
    };

    const result = hydrateHtmlTemplate(readerTemplate, item2Entry);
    expect(result).toContain('Designing Modern Headless CMS Architectures');
    expect(result).toContain('Elena Chen');
    expect(result).toContain('<p>Traditional monolithic CMS platforms...</p>');
  });

  it('applies image alignment, fit, and appearance styles during hydration', () => {
    const template = `
      <img id="img-right" src="/test.jpg" data-image-align="right" data-object-fit="contain" data-aspect-ratio="16/9" data-max-height="300px" data-border-radius="8px" data-image-width="80%" data-object-position="top center" />
      <img id="img-left" src="/test2.jpg" data-image-align="left" />
      <img id="img-center" src="/test3.jpg" data-image-align="center" />
      <div class="cms-post-reader">Post Body</div>
    `;

    const entry = {
      id: 'entry-999',
      data: {
        title: 'Styled Post',
      },
    };

    const result = hydrateHtmlTemplate(template, entry);
    expect(result).toContain('margin-left: auto');
    expect(result).toContain('margin-right: 0');
    expect(result).toContain('margin-right: auto');
    expect(result).toContain('data-entry-id="entry-999"');
    expect(result).toContain('object-fit: contain');
    expect(result).toContain('aspect-ratio: 16/9');
  });
});
