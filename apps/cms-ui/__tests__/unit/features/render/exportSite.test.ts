import { describe, it, expect } from 'vitest';
import { buildSiteModel } from '../../../../src/features/render/siteModel';
import {
  buildStaticSite,
  zipFiles,
} from '../../../../src/features/render/exportSite';

const layout = {
  builder: 'grapesjs',
  html: '<nav data-cms-menu="main"></nav><section data-cms-show="list"><div data-cms-repeat="true"><a data-cms-action="view-post" href="#">{{title}}</a></div></section><article data-cms-show="item"><h1>{{title}}</h1></article>',
  css: '',
};
const SITE = {
  name: 'My Blog',
  baseUrl: 'https://example.com',
  logoUrl: 'https://example.com/logo.png',
};
const entries = [
  {
    id: 'b',
    slug: '/blog',
    status: 'published',
    data: {
      title: 'Blog',
      slug: '/blog',
      isBlogPage: true,
      blogTypeId: 'e',
      body: layout,
      _schemas: [{ slug: 'e_posts', entryType: 'multi', items: [] }],
    },
  },
  {
    id: 'p1',
    slug: 'hello',
    status: 'published',
    data: {
      kind: 'post',
      blogTypeId: 'e',
      title: 'Hello',
      slug: 'hello',
      tags: ['ai'],
      excerpt: 'A short hello',
    },
  },
  {
    id: 'p2',
    slug: 'secret',
    status: 'draft',
    data: { kind: 'post', blogTypeId: 'e', title: 'Secret', slug: 'secret' },
  },
  {
    id: 'm',
    slug: '__menus',
    status: 'published',
    data: {
      kind: 'menus',
      items: { main: [{ label: 'Blog', path: '/blog', depth: 0 }] },
    },
  },
  {
    id: 't',
    slug: 'ai',
    status: 'published',
    data: { kind: 'tag', title: 'AI', slug: 'ai' },
  },
  {
    id: 'r',
    slug: 'old',
    status: 'published',
    data: { kind: 'redirect', title: 'old', from: '/old-blog', to: '/blog' },
  },
] as never[];

describe('static export', () => {
  const { files } = buildStaticSite(buildSiteModel(entries, 'live'), SITE);
  const get = (p: string) => files.find((f) => f.path === p)?.content ?? '';

  it('writes pages, posts, tag archives, feed, sitemap and more', () => {
    expect(files.map((f) => f.path).sort()).toEqual([
      '404.html',
      'blog/feed.xml',
      'blog/hello/index.html',
      'blog/index.html',
      'blog/tag/ai/index.html',
      'old-blog/index.html',
      'robots.txt',
      'sitemap.xml',
    ]);
  });
  it('puts search and sharing tags in each page', () => {
    expect(get('blog/hello/index.html')).toContain(
      '<title>Hello | My Blog</title>',
    );
    expect(get('blog/hello/index.html')).toContain('content="A short hello"');
    expect(get('blog/hello/index.html')).toContain(
      'rel="canonical" href="https://example.com/blog/hello/"',
    );
  });
  it('lists only live posts in the sitemap and feed', () => {
    expect(get('sitemap.xml')).toContain('https://example.com/blog/hello/');
    expect(get('sitemap.xml')).not.toContain('secret');
    expect(get('blog/feed.xml')).toContain('<title>Hello</title>');
  });
  it('keeps old addresses working with a redirect page', () => {
    expect(get('old-blog/index.html')).toContain('url=/blog');
  });
  it('lists posts on the page and links to them', () => {
    expect(get('blog/index.html')).toContain('href="/blog/hello/"');
    expect(get('blog/index.html')).not.toContain('Secret');
  });
  it('shows the post detail on the post address', () => {
    expect(get('blog/hello/index.html')).toContain('<h1>Hello</h1>');
  });
  it('renders the saved navigation menu', () => {
    expect(get('blog/index.html')).toContain('<a href="/blog/"');
  });
  it('creates a valid zip header', () => {
    const z = zipFiles(files);
    expect(Array.from(z.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
