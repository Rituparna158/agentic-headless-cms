import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  usePageBuilderStore,
  EMPTY_COMPONENT_STATE,
} from '../../../../src/features/collections/components/page-builder/stores/pageBuilderStore';

const store = () => usePageBuilderStore.getState() as any;

// [state key, setter, clearer]
const SLICES: Array<[string, string, string]> = [
  ['hero', 'setHero', 'clearHero'],
  ['featureGrid', 'setFeatureGrid', 'clearFeatureGrid'],
  ['ctaBanner', 'setCtaBanner', 'clearCtaBanner'],
  ['searchBar', 'setSearchBar', 'clearSearchBar'],
  ['contactForm', 'setContactForm', 'clearContactForm'],
  ['newsletterForm', 'setNewsletterForm', 'clearNewsletterForm'],
  ['dynamicForm', 'setDynamicForm', 'clearDynamicForm'],
  ['navbar', 'setNavbar', 'clearNavbar'],
  ['footer', 'setFooter', 'clearFooter'],
  ['videoShowcase', 'setVideoShowcase', 'clearVideoShowcase'],
  ['imageShowcase', 'setImageShowcase', 'clearImageShowcase'],
  ['testimonials', 'setTestimonial', 'clearTestimonial'],
  ['pricing', 'setPricing', 'clearPricing'],
  ['faq', 'setFAQ', 'clearFAQ'],
  ['embedCode', 'setEmbedCode', 'clearEmbedCode'],
  ['statCounter', 'setStatCounter', 'clearStatCounter'],
  ['tabs', 'setTabs', 'clearTabs'],
  ['socialShare', 'setSocialShare', 'clearSocialShare'],
  ['buttonGroup', 'setButtonGroup', 'clearButtonGroup'],
  ['countdown', 'setCountdown', 'clearCountdown'],
  ['mapEmbed', 'setMapEmbed', 'clearMapEmbed'],
];

describe('pageBuilderStore component slices', () => {
  beforeEach(() => store().resetStore());

  it.each(SLICES)(
    '%s: set merges a patch over defaults, clear removes it',
    (key, setter, clearer) => {
      store()[setter]('c1', { __probe: 1 });
      const created = store()[key].c1 as Record<string, unknown>;
      expect(created.__probe).toBe(1);
      expect(Object.keys(created).length).toBeGreaterThan(1); // defaults merged in

      store()[setter]('c1', { __probe: 2 });
      expect((store()[key].c1 as Record<string, unknown>).__probe).toBe(2);

      store()[clearer]('c1');
      expect(store()[key].c1).toBeUndefined();
    },
  );

  it('component-removed events clear every slice for that component', () => {
    for (const [, setter] of SLICES) store()[setter]('gone', { __probe: 1 });
    store()[SLICES[0]![1]]('kept', { __probe: 1 });
    document.dispatchEvent(
      new CustomEvent('pb:component-removed', {
        detail: { componentId: 'gone' },
      }),
    );
    for (const [key] of SLICES) expect(store()[key].gone).toBeUndefined();
    expect(store().hero.kept).toBeDefined();
  });
});

describe('pageBuilderStore lifecycle', () => {
  beforeEach(() => store().resetStore());

  it('snapshot / restore round-trips component state and marks dirty', () => {
    store().setHero('h', { title: 'Hello' });
    const snap = store().snapshotComponentState() as Record<string, unknown>;
    expect(Object.keys(snap)).toHaveLength(SLICES.length);
    store().resetStore();
    expect(store().hero.h).toBeUndefined();
    store().restoreComponentState(snap);
    expect((store().hero.h as { title: string }).title).toBe('Hello');
    expect(usePageBuilderStore.getState().isDirty).toBe(true);
  });

  it('markClean keeps or replaces the last saved snapshot', () => {
    store().markClean('p', { a: 1 });
    expect(usePageBuilderStore.getState().lastSavedSnapshot).toEqual({ a: 1 });
    store().markClean('p');
    expect(usePageBuilderStore.getState().lastSavedSnapshot).toEqual({ a: 1 });
  });

  it('markDirty defaults to true and can be cleared', () => {
    store().markDirty();
    expect(usePageBuilderStore.getState().isDirty).toBe(true);
    store().markDirty(false);
    expect(usePageBuilderStore.getState().isDirty).toBe(false);
  });

  it('resetStoreForPage starts clean for an unseen page and restores a stashed draft', () => {
    store().setActivePageId('a');
    store().setHero('h', { title: 'A draft' });
    store().resetStoreForPage('b');
    expect(usePageBuilderStore.getState()).toMatchObject({
      activePageId: 'b',
      isDirty: false,
    });
    expect(store().hero.h).toBeUndefined();

    store().resetStoreForPage('a');
    expect((store().hero.h as { title: string }).title).toBe('A draft');
    expect(usePageBuilderStore.getState().isDirty).toBe(true);
  });

  it('resetStore returns to the empty state', () => {
    store().setHero('h', {});
    store().setActivePageId('x');
    store().resetStore();
    expect(usePageBuilderStore.getState()).toMatchObject({
      hero: EMPTY_COMPONENT_STATE.hero,
      activePageId: null,
      isDirty: false,
      lastSavedSnapshot: null,
    });
  });

  it('store changes notify the canvas (debounced)', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    window.addEventListener('table-design-change', handler);
    store().setHero('h', {});
    store().setHero('h', { title: 'x' });
    vi.advanceTimersByTime(200);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('table-design-change', handler);
    vi.useRealTimers();
  });
});
