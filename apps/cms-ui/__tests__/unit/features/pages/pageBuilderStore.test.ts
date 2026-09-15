import { describe, it, expect, beforeEach } from 'vitest';
import { usePageBuilderStore } from '../../../../src/features/pages/components/page-builder/stores/pageBuilderStore';

describe('pageBuilderStore', () => {
  beforeEach(() => {
    usePageBuilderStore.getState().resetStore();
  });

  it('should initialize with empty component states', () => {
    const state = usePageBuilderStore.getState();
    expect(state.hero).toEqual({});
    expect(state.featureGrid).toEqual({});
    expect(state.ctaBanner).toEqual({});
    expect(state.testimonials).toEqual({});
    expect(state.pricing).toEqual({});
    expect(state.faq).toEqual({});
  });

  it('should set and clear a specific component (hero)', () => {
    usePageBuilderStore.getState().setHero('custom-0', { title: 'New Hero' });
    let state = usePageBuilderStore.getState();
    expect(state.hero['custom-0']!.title).toBe('New Hero');

    // Clear
    usePageBuilderStore.getState().clearHero('custom-0');
    state = usePageBuilderStore.getState();
    expect(state.hero['custom-0']).toBeUndefined();
  });

  it('resetStore should wipe all states', () => {
    // Populate store
    usePageBuilderStore.getState().setHero('custom-0', { title: 'Test Hero' });
    usePageBuilderStore
      .getState()
      .setFeatureGrid('custom-1', { title: 'Test Grid' });

    let state = usePageBuilderStore.getState();
    expect(state.hero['custom-0']).toBeDefined();
    expect(state.featureGrid['custom-1']).toBeDefined();

    // Reset
    usePageBuilderStore.getState().resetStore();
    state = usePageBuilderStore.getState();

    expect(state.hero).toEqual({});
    expect(state.featureGrid).toEqual({});
    expect(state.ctaBanner).toEqual({});
  });
});
