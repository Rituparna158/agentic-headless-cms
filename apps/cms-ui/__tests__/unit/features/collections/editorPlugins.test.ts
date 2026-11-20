import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupBlockA11y } from '../../../../src/features/collections/pages/editors/components/BlockA11yPlugin';
import { setupLayerIcons } from '../../../../src/features/collections/pages/editors/components/LayerIconPlugin';

type Handler = (...a: unknown[]) => void;
const fakeEditor = (blocks: Record<string, unknown> = {}) => {
  const handlers: Record<string, Handler[]> = {};
  const editor = {
    on: (names: string, fn: Handler) =>
      names.split(' ').forEach((n) => (handlers[n] ||= []).push(fn)),
    addComponents: vi.fn(),
    BlockManager: { get: (id: string) => blocks[id] },
  };
  const fire = (n: string) => (handlers[n] || []).forEach((f) => f());
  return { editor: editor as never, fire, addComponents: editor.addComponents };
};

const mount = (html: string) => {
  document.body.innerHTML = html;
};

describe('BlockA11yPlugin', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const loaded = async (e: ReturnType<typeof fakeEditor>) => {
    e.fire('load');
    await vi.advanceTimersByTimeAsync(250);
  };

  it('does nothing when the block panel is missing', async () => {
    const e = fakeEditor();
    setupBlockA11y(e.editor);
    await loaded(e);
    expect(document.querySelectorAll('[role=button]')).toHaveLength(0);
  });

  it('makes blocks focusable buttons with descriptive labels', async () => {
    mount(`<div id="gjs-blocks">
      <div class="gjs-block" data-id="hero"><div class="gjs-block-label"> Hero </div></div>
      <div class="gjs-block" title="Footer"></div>
      <div class="gjs-block" role="link" tabindex="-1" aria-label="Custom"></div>
      <div class="gjs-block"></div>
    </div>`);
    const e = fakeEditor();
    setupBlockA11y(e.editor);
    await loaded(e);
    const els = [
      ...document.querySelectorAll<HTMLElement>('.gjs-block'),
    ] as HTMLElement[];
    expect(els[0]!.getAttribute('aria-label')).toBe('Insert Hero');
    expect(els[0]!.getAttribute('role')).toBe('button');
    expect(els[0]!.getAttribute('tabindex')).toBe('0');
    expect(els[1]!.getAttribute('aria-label')).toBe('Insert Footer');
    expect(els[2]!.getAttribute('aria-label')).toBe('Custom');
    expect(els[2]!.getAttribute('role')).toBe('link');
    expect(els[3]!.getAttribute('aria-label')).toBe('Insert Canvas block 4');
  });

  it('inserts a block with Enter/Space', async () => {
    mount(
      `<div id="gjs-blocks"><div class="gjs-block" data-id="hero"></div><div class="gjs-block" id="x"></div></div>`,
    );
    const e = fakeEditor({
      hero: { getContent: () => '<h1>hi</h1>' },
      x: { get: () => '<p/>' },
    });
    setupBlockA11y(e.editor);
    await loaded(e);
    const [a, b] = [
      ...document.querySelectorAll<HTMLElement>('.gjs-block'),
    ] as [HTMLElement, HTMLElement];
    a.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    b.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(e.addComponents).toHaveBeenNthCalledWith(1, '<h1>hi</h1>');
    expect(e.addComponents).toHaveBeenNthCalledWith(2, '<p/>');
  });

  it('ignores unknown blocks and empty content', async () => {
    mount(
      `<div id="gjs-blocks"><div class="gjs-block" data-id="nope"></div><div class="gjs-block" data-id="empty"></div></div>`,
    );
    const e = fakeEditor({ empty: { getContent: () => '' } });
    setupBlockA11y(e.editor);
    await loaded(e);
    document
      .querySelectorAll<HTMLElement>('.gjs-block')
      .forEach((el) =>
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })),
      );
    expect(e.addComponents).not.toHaveBeenCalled();
  });

  it('moves focus with arrow keys and stops at the ends', async () => {
    mount(
      `<div id="gjs-blocks"><div class="gjs-block"></div><div class="gjs-block"></div><div class="gjs-block"></div></div>`,
    );
    const e = fakeEditor();
    setupBlockA11y(e.editor);
    await loaded(e);
    const [a, b, c] = [
      ...document.querySelectorAll<HTMLElement>('.gjs-block'),
    ] as [HTMLElement, HTMLElement, HTMLElement];
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(document.activeElement).toBe(b);
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(c);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(c);
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(document.activeElement).toBe(b);
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(document.activeElement).toBe(a);
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(document.activeElement).toBe(a);
  });

  it('labels blocks added later and binds each only once', async () => {
    mount(
      `<div id="gjs-blocks"><div class="gjs-block" data-id="h"></div></div>`,
    );
    const e = fakeEditor({ h: { getContent: () => 'x' } });
    setupBlockA11y(e.editor);
    await loaded(e);
    const added = document.createElement('div');
    added.className = 'gjs-block';
    document.getElementById('gjs-blocks')!.appendChild(added);
    e.fire('block:add');
    await vi.advanceTimersByTimeAsync(100);
    expect(added.getAttribute('role')).toBe('button');
    // Re-running must not double-bind the existing block
    e.fire('block:remove');
    await vi.advanceTimersByTimeAsync(100);
    document
      .querySelector<HTMLElement>('.gjs-block')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(e.addComponents).toHaveBeenCalledTimes(1);
  });
});

describe('LayerIconPlugin', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const layer = (name: string, model?: { type?: string; tagName?: string }) =>
    `<div class="gjs-layer" ${model ? `data-model='${JSON.stringify(model)}'` : ''}>
       <div class="gjs-layer-title"><div class="gjs-layer-title-inn"><span class="gjs-layer-name">${name}</span></div></div>
     </div>`;

  const run = async (html: string, setModels?: (els: Element[]) => void) => {
    mount(html);
    const e = fakeEditor();
    setupLayerIcons(e.editor);
    if (setModels) setModels([...document.querySelectorAll('.gjs-layer')]);
    e.fire('load');
    await vi.advanceTimersByTimeAsync(600);
    return e;
  };

  it('does nothing without a layers container', async () => {
    await run('<div></div>');
    expect(document.querySelector('.gjs-layer-icon-custom')).toBeNull();
  });

  it.each([
    ['Body'],
    ['Hero Section'],
    ['Feature list'],
    ['Pricing'],
    ['CTA'],
    ['Navbar'],
    ['Header'],
    ['Footer'],
    ['H2'],
    ['Row'],
    ['Cell'],
    ['Link'],
    ['Image'],
    ['Video'],
    ['Map'],
    ['Text'],
    ['Button'],
    ['Form'],
    ['Input'],
    ['Something else'],
  ])('injects an icon for the "%s" layer', async (name) => {
    await run(`<div id="gjs-layers">${layer(name)}</div>`);
    const icon = document.querySelector('.gjs-layer-icon-custom');
    expect(icon).not.toBeNull();
    expect(icon!.innerHTML).toContain('<svg');
    // icon is placed before the name
    expect(icon!.nextElementSibling?.className).toBe('gjs-layer-name');
  });

  it('prefers the component model type, then tag name', async () => {
    await run(
      `<div id="gjs-layers">${layer('x')}${layer('y')}</div>`,
      (els) => {
        (els[0] as never as Record<string, unknown>).__gjsLayerModel = {
          get: (k: string) => ({ type: 'image' })[k as 'type'] ?? '',
        };
        (els[1] as never as Record<string, unknown>).__gjsLayerModel = {
          get: (k: string) => ({ type: '', tagName: 'NAV' })[k as 'type'] ?? '',
        };
      },
    );
    const colors = [
      ...document.querySelectorAll<HTMLElement>('.gjs-layer-icon-custom'),
    ].map((el) => el.style.color);
    expect(colors).toHaveLength(2);
    expect(colors[0]).not.toBe(colors[1]);
  });

  it('skips layers without a title and does not duplicate icons', async () => {
    const e = await run(
      `<div id="gjs-layers"><div class="gjs-layer"></div>${layer('Text')}</div>`,
    );
    expect(document.querySelectorAll('.gjs-layer-icon-custom')).toHaveLength(1);
    e.fire('component:add');
    e.fire('layer:root');
    await vi.advanceTimersByTimeAsync(150);
    expect(document.querySelectorAll('.gjs-layer-icon-custom')).toHaveLength(1);
  });

  it('prepends the icon when the layer has no name element', async () => {
    await run(
      `<div id="gjs-layers"><div class="gjs-layer"><div class="gjs-layer-title"><div class="gjs-layer-title-inn"></div></div></div></div>`,
    );
    expect(
      document.querySelector('.gjs-layer-title-inn')!.firstElementChild!
        .className,
    ).toBe('gjs-layer-icon-custom');
  });

  it('adds icons to layers rendered later', async () => {
    await run(`<div id="gjs-layers"></div>`);
    document.getElementById('gjs-layers')!.innerHTML = layer('Button');
    await vi.advanceTimersByTimeAsync(100);
    // MutationObserver + rAF run under fake timers
    await vi.advanceTimersByTimeAsync(50);
    expect(document.querySelector('.gjs-layer-icon-custom')).not.toBeNull();
  });
});
