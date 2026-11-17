import { describe, it, expect, beforeEach, vi } from 'vitest';
import grapesjs, { type Editor } from 'grapesjs';
import {
  CustomBlocksPlugin,
  register_site_blocks,
  register_responsive_cover_image_block,
} from '../../../../src/features/collections/components/grapesjs-plugins/CustomBlocksPlugin';

const fields = [
  { id: 'title', name: 'Title', apiId: 'title', dataType: 'text' },
  { id: 'cover', name: 'Cover', apiId: 'cover', dataType: 'media' },
  { id: 'link_url', name: 'Link', apiId: 'link_url', dataType: 'text' },
];
const schemas = [
  {
    id: 's1',
    slug: 'hero',
    name: 'Hero',
    isCurrentPage: true,
    fields: [{ id: 'h', name: 'Heading', apiId: 'heading', dataType: 'text' }],
  },
  { id: 's2', slug: 'empty', name: 'Empty', pageTitle: 'Other', fields: [] },
];

const make = (opts: Record<string, unknown> = {}): Editor =>
  grapesjs.init({
    headless: true,
    storageManager: false,
    plugins: [
      (e: Editor) =>
        CustomBlocksPlugin(e, {
          schemaFields: fields,
          availableSchemas: schemas,
          ...opts,
        } as never),
    ],
  } as never) as Editor;

const traitNames = (c: any) => c.get('traits').map((t: any) => t.get('name'));
const traitOptions = (c: any, name: string) =>
  c
    .get('traits')
    .find((t: any) => t.get('name') === name)
    ?.get('options') as Array<{ id: string }>;

describe('CustomBlocksPlugin (real editor)', () => {
  let editor: Editor;
  beforeEach(() => {
    editor = make();
  });

  it('registers the block library, including site and cover-image blocks', () => {
    const ids = editor.BlockManager.getAll().map(
      (b: any) => b.get('id') ?? b.id,
    );
    expect(ids.length).toBeGreaterThan(30);
    for (const id of [
      'site-navigation',
      'site-logo',
      'form-contact',
      'form-newsletter',
      'post-comments',
      'post-tags',
      'post-next-prev',
      'post-related',
      'post-reading-time',
      'site-latest-posts',
      'cover-image-responsive',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('can register site blocks and cover image block on a bare editor', () => {
    const bare = grapesjs.init({
      headless: true,
      storageManager: false,
    } as never) as Editor;
    register_site_blocks(bare);
    register_responsive_cover_image_block(bare);
    expect(bare.BlockManager.getAll().length).toBe(12);
  });

  it('adds CMS traits to base component types', () => {
    const [c] = editor.addComponents('<p>hello</p>') as any[];
    expect(traitNames(c)).toEqual(
      expect.arrayContaining([
        'data-cms-schema',
        'data-cms-include',
        'data-cms-menu',
        'data-cms-show',
        'data-cms-slot',
      ]),
    );
    const [img] = editor.addComponents('<img src="x.png">') as any[];
    expect(traitNames(img)).toContain('data-object-fit');
  });

  it('omits the schema trait when no schemas are available', () => {
    const e = make({ availableSchemas: [] });
    const [c] = e.addComponents('<p>x</p>') as any[];
    expect(traitNames(c)).not.toContain('data-cms-schema');
  });

  it('uses custom menus when provided', () => {
    const e = make({ menus: [{ id: 'm1', name: 'Main' }] });
    const [c] = e.addComponents('<p>x</p>') as any[];
    expect(traitOptions(c, 'data-cms-menu').map((o) => o.id)).toEqual([
      '',
      'm1',
    ]);
  });

  it('lists all schema fields in the slot trait by default', () => {
    const [c] = editor.addComponents('<p>x</p>') as any[];
    expect(traitOptions(c, 'data-cms-slot').map((o) => o.id)).toEqual([
      '',
      'title',
      'cover',
      'link_url',
    ]);
  });

  it('filters the slot options by the section chosen on selection', () => {
    const [c] = editor.addComponents(
      '<p data-cms-schema="hero">x</p>',
    ) as any[];
    editor.select(c);
    expect(traitOptions(c, 'data-cms-slot').map((o) => o.id)).toEqual([
      '',
      'heading',
    ]);
  });

  it('inherits the section from an ancestor and copies it onto a slotted child', () => {
    const [wrap] = editor.addComponents(
      '<div data-cms-schema="hero"><span data-cms-slot="heading">x</span></div>',
    ) as any[];
    const child = wrap.components().at(0);
    editor.select(child);
    expect(child.getAttributes()['data-cms-schema']).toBe('hero');
  });

  it('falls back to all fields when the chosen schema has none', () => {
    const [c] = editor.addComponents(
      '<p data-cms-schema="empty">x</p>',
    ) as any[];
    editor.select(c);
    expect(traitOptions(c, 'data-cms-slot').map((o) => o.id)).toContain(
      'title',
    );
  });

  it('re-filters slots and resets an invalid slot when the section changes', () => {
    const [c] = editor.addComponents('<p data-cms-slot="title">x</p>') as any[];
    editor.select(c);
    c.addAttributes({ 'data-cms-schema': 'hero' });
    expect(traitOptions(c, 'data-cms-slot').map((o) => o.id)).toEqual([
      '',
      'heading',
    ]);
    expect(c.getAttributes()['data-cms-slot']).toBe('');
  });

  it('adds default image styling on selection and syncs attribute changes', () => {
    const [img] = editor.addComponents('<img src="x.png">') as any[];
    editor.select(img);
    expect(img.getAttributes()['data-object-fit']).toBe('cover');
    expect(img.getAttributes()['data-aspect-ratio']).toBe('16/9');
    expect(img.getStyle()['object-fit']).toBe('cover');

    img.addAttributes({
      'data-object-fit': 'contain',
      'data-aspect-ratio': 'auto',
      'data-max-height': 'none',
      'data-border-radius': '8px',
      'data-image-width': '50%',
      'data-object-position': 'top',
      'data-image-align': 'right',
    });
    expect(img.getStyle()).toMatchObject({
      'object-fit': 'contain',
      'aspect-ratio': 'auto',
      'max-height': 'none',
      'border-radius': '8px',
      width: '50%',
      'object-position': 'top',
      'margin-left': 'auto',
      'margin-right': '0',
    });
    img.addAttributes({ 'data-image-align': 'left' });
    expect(img.getStyle()['margin-left']).toBe('0');
    img.addAttributes({ 'data-image-align': 'center' });
    expect(img.getStyle()['margin-right']).toBe('auto');
  });

  it('does not style non-image components', () => {
    const [p] = editor.addComponents('<p>x</p>') as any[];
    p.addAttributes({ 'data-object-fit': 'contain' });
    expect(p.getStyle()['object-fit']).toBeUndefined();
  });
});

describe('CustomBlocksPlugin hydration (real editor)', () => {
  const values = {
    title: 'Hello',
    cover: 'https://cdn/x.png',
    link_url: 'https://example.com',
    'hero.heading': 'Scoped',
    zero: 0,
  };
  const withValues = () => make({ schemaValues: values });

  it('fills text, image and link slots when attributes change', () => {
    const e = withValues();
    const [wrap] = e.addComponents(
      '<div><h2>old</h2><img src="old.png"><a href="#">go</a></div>',
    ) as any[];
    const [h, img, a] = wrap.components().models;
    h.addAttributes({ 'data-cms-slot': 'title' });
    img.addAttributes({ 'data-cms-slot': 'cover' });
    a.addAttributes({ 'data-cms-slot': 'link_url' });
    expect(h.components().at(0)?.get('content') ?? h.toHTML()).toContain(
      'Hello',
    );
    expect(img.getAttributes().src).toBe('https://cdn/x.png');
    expect(a.getAttributes().href).toBe('https://example.com');
  });

  it('resolves scoped values via the schema (own or ancestor)', () => {
    const e = withValues();
    const [wrap] = e.addComponents(
      '<section data-cms-schema="hero"><p>x</p></section>',
    ) as any[];
    const p = wrap.components().at(0);
    p.addAttributes({ 'data-cms-slot': 'heading' });
    expect(p.toHTML()).toContain('Scoped');
    const [direct] = e.addComponents(
      '<p data-cms-schema="hero">x</p>',
    ) as any[];
    direct.addAttributes({ 'data-cms-field': 'heading' });
    expect(direct.toHTML()).toContain('Scoped');
  });

  it('stringifies non-string values and ignores missing ones', () => {
    const e = withValues();
    const [zero] = e.addComponents('<p>x</p>') as any[];
    zero.addAttributes({ 'data-cms-slot': 'zero' });
    expect(zero.toHTML()).toContain('0');
    const [missing] = e.addComponents('<p>keep</p>') as any[];
    missing.addAttributes({ 'data-cms-slot': 'nope' });
    expect(missing.toHTML()).toContain('keep');
  });

  it('hydrates the whole canvas on load', () => {
    const e = withValues();
    const [h1] = e.addComponents('<h1 data-cms-slot="title">old</h1>') as any[];
    // a headless editor has no DOM, so give the wrapper a find() over the model
    const wrapper = e.getWrapper()!;
    vi.spyOn(wrapper, 'find').mockReturnValue([h1] as never);
    (e as any).trigger('load');
    const html = wrapper.toHTML();
    expect(html).toContain('Hello');
    expect(html).not.toContain('old');
  });

  it('survives editors without a wrapper', () => {
    const e = make({ schemaValues: values });
    (e as any).getWrapper = () => null;
    expect(() => (e as any).trigger('load')).not.toThrow();
  });

  it('injects base css into the canvas head on load', () => {
    const e = make();
    const head = document.createElement('head');
    const canvas = vi.spyOn(e, 'Canvas', 'get');
    canvas.mockReturnValue({ getDocument: () => ({ head }) } as never);
    (e as any).trigger('load');
    expect(head.querySelector('#gjs-base-css')).not.toBeNull();
    canvas.mockReturnValue({ getDocument: () => null } as never);
    expect(() => (e as any).trigger('load')).not.toThrow();
  });
});
