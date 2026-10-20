import { describe, it, expect, beforeEach } from 'vitest';
import { usePageBuilderStore } from '@/features/collections/components/page-builder/stores/pageBuilderStore';

describe('pageBuilderStore Drafts & Dirty Tracking', () => {
  beforeEach(() => {
    usePageBuilderStore.getState().resetStore();
  });

  it('marks store as dirty when component settings are updated', () => {
    const store = usePageBuilderStore.getState();
    expect(store.isDirty).toBe(false);

    store.setHero('hero-test', { title: 'New Hero Title' });

    expect(usePageBuilderStore.getState().isDirty).toBe(true);
    expect(usePageBuilderStore.getState().hasUnsavedChanges()).toBe(true);
  });

  it('marks store as clean when markClean is called', () => {
    const store = usePageBuilderStore.getState();
    store.setHero('hero-test', { title: 'New Hero Title' });
    expect(usePageBuilderStore.getState().isDirty).toBe(true);

    usePageBuilderStore.getState().markClean('page-1');
    expect(usePageBuilderStore.getState().isDirty).toBe(false);
  });

  it('preserves uncommitted drafts when switching between pages via resetStoreForPage', () => {
    // 1. Working on Page 1
    usePageBuilderStore.getState().setActivePageId('page-1');
    usePageBuilderStore.getState().setHero('hero-1', { title: 'Page 1 Hero' });
    expect(usePageBuilderStore.getState().isDirty).toBe(true);

    // 2. Switch to Page 2
    usePageBuilderStore.getState().resetStoreForPage('page-2');
    expect(usePageBuilderStore.getState().activePageId).toBe('page-2');
    expect(usePageBuilderStore.getState().isDirty).toBe(false);
    expect(usePageBuilderStore.getState().hero['hero-1']).toBeUndefined();

    // 3. Page 1 draft should be preserved in draftsByPageId
    const drafts = usePageBuilderStore.getState().draftsByPageId;
    expect(drafts['page-1']).toBeDefined();
    expect(
      (
        drafts['page-1']!.componentState.hero as Record<
          string,
          { title: string }
        >
      )['hero-1']!.title,
    ).toBe('Page 1 Hero');

    // 4. Switch back to Page 1: draft should be automatically restored!
    usePageBuilderStore.getState().resetStoreForPage('page-1');
    expect(usePageBuilderStore.getState().activePageId).toBe('page-1');
    expect(usePageBuilderStore.getState().hero['hero-1']?.title).toBe(
      'Page 1 Hero',
    );
    expect(usePageBuilderStore.getState().isDirty).toBe(true);
  });
});
