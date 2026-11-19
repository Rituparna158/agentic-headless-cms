import { describe, it, expect } from 'vitest';
import {
  buildSiteModel,
  resolvePath,
  neighborsOf,
  relatedPosts,
  findRedirect,
} from '../../../../src/features/render/siteModel';
import { renderView } from '../../../../src/features/render/renderView';
import { resolveSeo, readingTime } from '../../../../src/features/render/seo';

const blog = {
  id: 'b',
  slug: '/blog',
  status: 'published',
  data: {
    title: 'Blog',
    slug: '/blog',
    isBlogPage: true,
    blogTypeId: 'e',
    body: {
      builder: 'grapesjs',
      html: '<div data-cms-site="logo"></div><section data-cms-show="item"><h1>{{title}}</h1><p>{{reading_time}}</p><div data-cms-tags></div><a data-cms-action="next-post">Next</a><a data-cms-action="prev-post">Prev</a><div data-cms-repeat="true" data-cms-schema="related"><b>{{title}}</b></div></section><section data-cms-show="list"><h2>{{tag_name}}</h2><div data-cms-repeat="true"><i>{{title}}</i></div></section><div data-cms-include="cta"></div>',
      css: '',
    },
    _schemas: [{ slug: 'e_posts', entryType: 'multi', items: [] }],
  },
};
const post = (
  id: string,
  extra: Record<string, unknown> = {},
  status = 'published',
) => ({
  id,
  slug: id,
  status,
  data: {
    kind: 'post',
    blogTypeId: 'e',
    title: id.toUpperCase(),
    slug: id,
    ...extra,
  },
});
const other = [
  {
    id: 't1',
    slug: 'ai',
    status: 'published',
    data: { kind: 'tag', title: 'AI', slug: 'ai' },
  },
  {
    id: 's',
    slug: 'cta',
    status: 'published',
    data: {
      kind: 'section',
      title: 'CTA',
      slug: 'cta',
      html: '<p>JOIN</p>',
      css: '.x{}',
    },
  },
  {
    id: 'h',
    slug: 'header',
    status: 'published',
    data: {
      kind: 'section',
      title: 'Header',
      slug: 'header',
      role: 'header',
      html: '<header>HEAD</header>',
      css: '',
    },
  },
  {
    id: 'r',
    slug: 'r',
    status: 'published',
    data: { kind: 'redirect', title: 'r', from: 'old', to: '/blog' },
  },
];
const SITE = { name: 'Site', logoUrl: 'logo.png' };
const ctx = { site: SITE, url: (p: string) => p };

const entries = (extra: unknown[] = []) =>
  [
    blog,
    post('a', {
      tags: ['ai'],
      date: '2026-03-01',
      content: 'word '.repeat(400),
    }),
    post('b', { tags: ['ai'], date: '2026-02-01' }),
    post('c', { date: '2026-01-01' }),
    ...other,
    ...extra,
  ] as never[];

describe('tags and archives', () => {
  const m = buildSiteModel(entries(), 'live');
  it('finds the tag archive of a blog', () => {
    const r = resolvePath(m, '/blog/tag/ai');
    expect(r?.tag?.name).toBe('AI');
    expect(r?.page.posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });
  it('shows the tag on the archive heading and lists matching posts', () => {
    const v = renderView(m, resolvePath(m, '/blog/tag/ai')!, ctx)!;
    expect(v.html).toContain('<h2>AI</h2>');
    expect(v.html).toMatch(/<i[^>]*>A<\/i>/);
    expect(v.html).not.toMatch(/<i[^>]*>C<\/i>/);
  });
});

describe('post extras', () => {
  const m = buildSiteModel(entries(), 'live');
  const page = m.pages[0]!;
  it('estimates reading time', () => {
    expect(readingTime('word '.repeat(400))).toBe(2);
    expect(page.posts.find((p) => p.slug === 'a')!.reading_time).toBe(
      '2 min read',
    );
  });
  it('knows the neighbours and related posts', () => {
    const a = page.posts.find((p) => p.slug === 'a')!;
    expect(neighborsOf(page, a).next?.slug).toBe('b');
    expect(relatedPosts(page, a, 3).map((p) => p.slug)).toEqual(['b']);
  });
  it('renders next/previous, tags, related, logo, shared sections and header', () => {
    const v = renderView(m, resolvePath(m, '/blog/b')!, ctx)!;
    expect(v.html).toContain('<header>HEAD</header>');
    expect(v.html).toContain('src="logo.png"');
    expect(v.html).toContain('JOIN');
    expect(v.html).toContain('href="/blog/c"'); // next (older) post
    expect(v.html).toContain('href="/blog/a"'); // previous (newer) post
    expect(v.html).toContain('>AI</a>');
    expect(v.css).toContain('.x{}');
  });
  it('hides next when there is none', () => {
    const v = renderView(m, resolvePath(m, '/blog/c')!, ctx)!;
    expect(v.html).toMatch(/<a[^>]*display:\s*none[^>]*>Next/);
  });
});

describe('scheduling and redirects', () => {
  it('hides a scheduled post from visitors until its date', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const m = buildSiteModel(
      entries([post('later', { publishAt: future })]),
      'live',
    );
    expect(m.pages[0]!.posts.map((p) => p.slug)).not.toContain('later');
    const d = buildSiteModel(
      entries([post('later', { publishAt: future })]),
      'draft',
    );
    expect(d.pages[0]!.posts.map((p) => p.slug)).toContain('later');
  });
  it('finds redirects', () => {
    const m = buildSiteModel(entries(), 'live');
    expect(findRedirect(m, '/old')).toBe('/blog');
    expect(findRedirect(m, '/nope')).toBeNull();
  });
});

describe('search and sharing settings', () => {
  const m = buildSiteModel(entries(), 'live');
  const page = m.pages[0]!;
  it('uses the title template and falls back to the excerpt', () => {
    const seo = resolveSeo(
      page,
      { title: 'Hello', excerpt: 'About hello' },
      { name: 'Site', seo: { titleTemplate: '%page% - %site%' } },
    );
    expect(seo.title).toBe('Hello - Site');
    expect(seo.description).toBe('About hello');
  });
  it('page settings win over defaults and can hide from search', () => {
    const p = {
      ...page,
      seo: { title: 'Custom', description: 'Desc', noindex: true },
    };
    const seo = resolveSeo(p, null, { name: 'Site' });
    expect(seo.title).toBe('Custom');
    expect(seo.noindex).toBe(true);
  });
});

describe('comments and forms', () => {
  const comment = (
    id: string,
    status: string,
    over: Record<string, unknown> = {},
  ) => ({
    id,
    slug: id,
    status,
    data: {
      kind: 'submission',
      submissionType: 'comment',
      title: 'c',
      name: 'Ann',
      message: 'Nice <b>post</b>',
      postSlug: 'a',
      receivedAt: '2026-03-02T10:00:00Z',
      ...over,
    },
  });
  const formMsg = {
    id: 'f',
    slug: 'f',
    status: 'published',
    data: {
      kind: 'submission',
      submissionType: 'form',
      fields: { email: 'secret@x.com' },
    },
  };
  const withComments = (extra: unknown[]) =>
    entries([
      comment('c1', 'published'),
      comment('c2', 'draft'),
      formMsg,
      ...extra,
    ]);

  it('shows approved comments only to visitors, and pending ones in drafts', () => {
    const live = buildSiteModel(withComments([]), 'live');
    expect(live.comments.map((c) => c.id)).toEqual(['c1']);
    const draft = buildSiteModel(withComments([]), 'draft');
    expect(draft.comments.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });
  it('never treats form messages as pages or content', () => {
    const m = buildSiteModel(withComments([]), 'draft');
    expect(m.pages.map((p) => p.id)).toEqual(['b']);
    expect(JSON.stringify(m.comments)).not.toContain('secret@x.com');
  });
  it('renders comments of a post as text, not markup', () => {
    const m = buildSiteModel(withComments([]), 'live');
    const html =
      '<section data-cms-show="item"><div data-cms-repeat="true" data-cms-schema="comments"><p>{{message}}</p></div></section>';
    const withBlock = {
      ...blog,
      data: { ...blog.data, body: { builder: 'grapesjs', html, css: '' } },
    };
    const model = buildSiteModel(
      [withBlock, ...withComments([]).slice(1)] as never[],
      'live',
    );
    const v = renderView(model, resolvePath(model, '/blog/a')!, ctx)!;
    expect(v.html).toContain('Nice &lt;b&gt;post&lt;/b&gt;');
    expect(m.comments).toHaveLength(1);
  });
});

describe('landing page rendering', () => {
  it('renders both hero single-entry section and features repeat section simultaneously', () => {
    const landing = {
      id: 'p_home',
      slug: '/',
      status: 'published',
      data: {
        title: 'Home',
        slug: '/',
        body: {
          builder: 'grapesjs',
          html: '<section class="hero"><h1>{{headline}}</h1></section><section class="features"><div data-cms-repeat="true"><h3>{{title}}</h3></div></section>',
          css: '',
        },
        _schemas: [
          {
            slug: 'hero-section',
            entryType: 'single',
            values: { headline: 'Welcome to Acme' },
          },
          {
            slug: 'features-section',
            entryType: 'multi',
            items: [{ title: 'Feature Alpha' }, { title: 'Feature Beta' }],
          },
        ],
      },
    };
    const model = buildSiteModel([landing] as never[], 'live');
    const resolved = resolvePath(model, '/')!;
    const view = renderView(model, resolved, ctx)!;
    expect(view).not.toBeNull();
    expect(view.html).toContain('Welcome to Acme');
    expect(view.html).toContain('Feature Alpha');
    expect(view.html).toContain('Feature Beta');
    expect(view.borrowedFrom).toBeNull();
  });

  it('recovers starter page layout when body was missing from page data', () => {
    const brokenHome = {
      id: 'p_home',
      slug: '/',
      status: 'published',
      data: {
        title: 'Home',
        slug: '/',
        _schemas: [
          {
            slug: 'hero-section',
            entryType: 'single',
            values: { headline: 'Restored Homepage Title' },
          },
        ],
      },
    };
    const model = buildSiteModel([brokenHome] as never[], 'live');
    const resolved = resolvePath(model, '/')!;
    const view = renderView(model, resolved, ctx)!;
    expect(view).not.toBeNull();
    expect(view.borrowedFrom).toBeNull();
    expect(view.html).toContain('Restored Homepage Title');
  });
});
