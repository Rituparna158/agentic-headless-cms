import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  sanitizeTemplate,
} from '../../../../src/features/render/renderTemplate';
import type { Rec, RenderInput } from '../../../../src/features/render/types';

const input = (over: Partial<RenderInput> = {}): RenderInput => ({
  page: { title: 'Home', slug: '/' },
  item: null,
  sources: { schemas: {}, entries: [] },
  hrefs: { post: (i) => `/blog/${String(i.slug)}`, list: '/blog' },
  ...over,
});

const posts: Rec[] = [
  { id: 'a', slug: 'first', title: 'First', excerpt: 'One', author: 'Ann' },
  { id: 'b', slug: 'second', title: 'Second' },
];

describe('tokens and slots', () => {
  it('fills tokens from the page', () => {
    const { html } = renderTemplate('<h1>{{title}}</h1>', input());
    expect(html).toBe('<h1>Home</h1>');
  });

  it('inserts values as text, never as markup', () => {
    const { html } = renderTemplate(
      '<h1>{{title}}</h1>',
      input({ page: { title: '<img src=x onerror=alert(1)>' } }),
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('sanitizes rich text fields', () => {
    const { html } = renderTemplate(
      '<div data-cms-slot="content"></div>',
      input({ page: { content: '<p>Hi</p><script>alert(1)</script>' } }),
    );
    expect(html).toContain('<p>Hi</p>');
    expect(html).not.toContain('<script');
  });

  it('resolves aliases inside the same record (summary → excerpt)', () => {
    const { html } = renderTemplate(
      '<p>{{excerpt}}</p>',
      input({ page: { summary: 'Short' } }),
    );
    expect(html).toBe('<p>Short</p>');
  });

  it('supports nested paths and markdown bodies', () => {
    const a = renderTemplate(
      '<p>{{body.specs.battery}}</p>',
      input({ page: { body: { specs: { battery: '5000mAh' } } } }),
    );
    expect(a.html).toBe('<p>5000mAh</p>');
    const b = renderTemplate(
      '<div data-cms-slot="content"></div>',
      input({ page: { body: { markdown: '**Bold**' } } }),
    );
    expect(b.html).toContain('<strong>Bold</strong>');
  });

  it('sets image and link slots', () => {
    const { html } = renderTemplate(
      '<img data-cms-slot="image" src="" /><a data-cms-slot="url">Go</a>',
      input({
        page: {
          cover_image_url: 'https://x.test/a.jpg',
          url: 'https://x.test',
        },
      }),
    );
    expect(html).toContain('src="https://x.test/a.jpg"');
    expect(html).toContain('href="https://x.test"');
  });

  it('formats ISO dates', () => {
    const { html } = renderTemplate(
      '<i>{{date}}</i>',
      input({ page: { date: '2026-11-06' } }),
    );
    expect(html).toBe('<i>Nov 6, 2026</i>');
  });

  it('applies image appearance traits', () => {
    const { html } = renderTemplate(
      '<img src="a.jpg" data-object-fit="contain" data-image-align="center" />',
      input(),
    );
    expect(html).toContain('object-fit: contain');
    expect(html).toContain('margin-left: auto');
  });
});

describe('no guessing', () => {
  it('shows a missing token as empty and reports it', () => {
    const r = renderTemplate('<p>[{{nope}}]</p>', input());
    expect(r.html).toBe('<p>[]</p>');
    expect(r.diagnostics.map((d) => d.code)).toContain('unresolved-token');
  });

  it('keeps authored placeholder for a missing slot and reports it', () => {
    const r = renderTemplate(
      '<h2 data-cms-slot="subtitle">Default</h2>',
      input(),
    );
    expect(r.html).toContain('Default');
    expect(r.diagnostics.map((d) => d.code)).toContain('unresolved-slot');
  });

  it('does not warn when a field is empty on one post but filled on another', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="posts"><article>{{author}}</article></div>',
      input({ sources: { schemas: { posts }, entries: [] } }),
    );
    expect(r.diagnostics.filter((d) => d.code === 'unresolved-token')).toEqual(
      [],
    );
  });

  it('never borrows values from other entries', () => {
    const r = renderTemplate(
      '<p>{{price}}</p>',
      input({ sources: { schemas: {}, entries: [{ id: 'x', price: '99' }] } }),
    );
    expect(r.html).toBe('<p></p>');
  });

  it('feed items only see their own record, not the page', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="posts"><article>{{title}}|{{author}}</article></div>',
      input({
        page: { title: 'Home', author: 'PageAuthor' },
        sources: { schemas: { posts }, entries: [] },
      }),
    );
    expect(r.html).toContain('First|Ann');
    expect(r.html).toContain('Second|<');
    expect(r.html).not.toContain('PageAuthor');
  });
});

describe('repeat blocks', () => {
  const feed =
    '<div data-cms-repeat="true" data-cms-schema="posts"><article><h3>{{title}}</h3><a data-cms-action="view-post" href="#">Read</a></article></div>';

  it('renders one card per record with ids, slugs and post links', () => {
    const r = renderTemplate(
      feed,
      input({ sources: { schemas: { posts }, entries: [] } }),
    );
    expect((r.html.match(/<article/g) ?? []).length).toBe(2);
    expect(r.html).toContain('data-entry-slug="first"');
    expect(r.html).toContain('href="/blog/second"');
  });

  it('reports an unknown schema and renders nothing', () => {
    const r = renderTemplate(feed, input());
    expect(r.html).not.toContain('<article');
    expect(
      r.diagnostics.find((d) => d.code === 'schema-not-found')?.level,
    ).toBe('error');
  });

  it('uses the blog the page owns when none is named', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true"><article>{{title}}</article></div>',
      input({
        sources: { schemas: { posts }, entries: [], defaultSchema: 'posts' },
      }),
    );
    expect(r.html).toContain('First');
    expect(r.diagnostics.map((d) => d.code)).not.toContain(
      'repeat-choose-source',
    );
  });

  it('honors data-cms-limit', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="posts" data-cms-limit="1"><article>{{title}}</article></div>',
      input({ sources: { schemas: { posts }, entries: [] } }),
    );
    expect((r.html.match(/<article/g) ?? []).length).toBe(1);
  });

  it('repeats standalone entries for data-cms-collection', () => {
    const r = renderTemplate(
      '<ul data-cms-collection="true"><li>{{title}}</li></ul>',
      input({
        sources: {
          schemas: {},
          entries: [
            { id: '1', title: 'Phone' },
            { id: '2', title: 'Tablet' },
          ],
        },
      }),
    );
    expect(r.html).toContain('Phone');
    expect(r.html).toContain('Tablet');
  });

  it('fills a dropdown from the schema', () => {
    const r = renderTemplate(
      '<select data-cms-dropdown="true" data-cms-schema="posts"></select>',
      input({ sources: { schemas: { posts }, entries: [] } }),
    );
    expect(r.html).toContain('<option value="first">First</option>');
  });
});

describe('feeds that do not name a blog', () => {
  const feed = '<div data-cms-repeat="true"><article>{{title}}</article></div>';

  it('shows the only blog on the site, and says so', () => {
    const r = renderTemplate(
      feed,
      input({
        sources: { schemas: { posts }, entries: [], siteSchemaKeys: ['posts'] },
      }),
    );
    expect(r.html).toContain('First');
    expect(r.diagnostics.map((d) => d.code)).toContain('repeat-auto-schema');
  });

  it('shows nothing and asks which blog when the site has several', () => {
    const r = renderTemplate(
      feed,
      input({
        sources: {
          schemas: { posts, news: [{ id: 'n', slug: 'n', title: 'News' }] },
          entries: [],
          siteSchemaKeys: ['posts', 'news'],
        },
      }),
    );
    expect(r.html).not.toContain('<article');
    expect(r.html).not.toContain('First');
    expect(r.html).not.toContain('News');
    expect(
      r.diagnostics.find((d) => d.code === 'repeat-choose-source')?.message,
    ).toContain('posts, news');
  });

  it('a named blog is shown even when the site has several', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="news"><article>{{title}}</article></div>',
      input({
        sources: {
          schemas: { posts, news: [{ id: 'n', slug: 'n', title: 'News' }] },
          entries: [],
          siteSchemaKeys: ['posts', 'news'],
        },
      }),
    );
    expect(r.html).toContain('News');
    expect(r.html).not.toContain('First');
  });

  it('warns when the named schema exists on several pages', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="posts"><article>{{title}}</article></div>',
      input({
        sources: {
          schemas: { posts },
          entries: [],
          ambiguousSchemas: ['posts'],
        },
      }),
    );
    expect(r.diagnostics.map((d) => d.code)).toContain('schema-ambiguous');
  });

  it('gives each card the address of its post', () => {
    const r = renderTemplate(
      '<div data-cms-repeat="true" data-cms-schema="posts"><article>{{title}}</article></div>',
      input({ sources: { schemas: { posts }, entries: [] } }),
    );
    expect(r.html).toContain('data-entry-href="/blog/first"');
  });
});

describe('archive and single views', () => {
  const tpl =
    '<div data-cms-show="list">LIST</div><article data-cms-show="item"><h1>{{title}}</h1><a data-cms-action="back-to-list" href="#">Back</a></article>';

  it('shows only the list when no post is selected', () => {
    const r = renderTemplate(tpl, input());
    expect(r.html).toContain('LIST');
    expect(r.html).not.toContain('<article');
  });

  it('shows only the post, with a link back, when one is selected', () => {
    const r = renderTemplate(tpl, input({ item: posts[0]! }));
    expect(r.html).not.toContain('LIST');
    expect(r.html).toContain('<h1>First</h1>');
    expect(r.html).toContain('href="/blog"');
  });

  it('falls back to the page value when the selected post lacks a field', () => {
    const r = renderTemplate(
      '<p>{{author}}</p>',
      input({ item: posts[1]!, page: { author: 'Editor' } }),
    );
    expect(r.html).toBe('<p>Editor</p>');
  });
});

describe('inferShowMarkers', () => {
  const legacy =
    '<div><section><div data-cms-repeat="x"><h3>{{title}}</h3></div></section><article><h1>{{title}}</h1></article><footer>Hi</footer></div>';
  it('tags the list and detail sections of an older layout', async () => {
    const { inferShowMarkers } =
      await import('../../../../src/features/render/renderTemplate');
    const out = inferShowMarkers(legacy);
    expect(out).toContain('<section data-cms-show="list">');
    expect(out).toContain('<article data-cms-show="item">');
    expect(out).not.toContain('<footer data-cms-show');
  });
  it('leaves marked layouts alone', async () => {
    const { inferShowMarkers } =
      await import('../../../../src/features/render/renderTemplate');
    const h = '<section data-cms-show="list"></section>';
    expect(inferShowMarkers(h)).toBe(h);
  });
});

describe('forms keep their field names', () => {
  it('does not strip name="name" from a contact or comment form', () => {
    const html = sanitizeTemplate(
      '<form data-cms-form="contact"><input name="name"><input name="email"><textarea name="message"></textarea></form>',
    );
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('data-cms-form="contact"');
  });
  it('still removes scripts and event handlers', () => {
    const html = sanitizeTemplate(
      '<img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
    );
    expect(html).not.toMatch(/onerror|<script|javascript:/i);
  });
});

describe('navigation menus rendering', () => {
  it('renders flat and nested submenus with clean classes', () => {
    const r = renderTemplate(
      '<nav data-cms-menu="main"></nav>',
      input({
        menus: {
          main: [
            { label: 'Home', path: '/', depth: 0 },
            { label: 'Company', path: '/company', depth: 0 },
            { label: 'About Us', path: '/about', depth: 1 },
            { label: 'Careers', path: '/careers', depth: 1 },
            { label: 'Contact', path: '/contact', depth: 0 },
          ],
        },
      }),
    );
    expect(r.html).toContain('class="cms-menu-list"');
    expect(r.html).toContain('class="cms-menu-item"');
    expect(r.html).toContain('class="cms-menu-item cms-has-dropdown"');
    expect(r.html).toContain('class="cms-submenu-list"');
    expect(r.html).toContain('class="cms-submenu-item"');
    expect(r.html).toContain('href="/"');
    expect(r.html).toContain('href="/about"');
    expect(r.html).toContain('href="/careers"');
    expect(r.html).toContain('About Us');
  });
});
