import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const storage = vi.hoisted(() => ({
  saveCanvasDraft: vi.fn(),
  getCanvasDraft: vi.fn(),
  deleteCanvasDraft: vi.fn(),
}));
vi.mock(
  '../../../../src/features/collections/storage/canvasDraftStorage',
  () => storage,
);

import { usePageBuilderStore } from '../../../../src/features/collections/components/page-builder/stores/pageBuilderStore';
import { useCanvasAutoSave } from '../../../../src/features/collections/hooks/useCanvasAutoSave';

const base = () => ({
  pageId: 'p1',
  schemaSlug: 'pages',
  title: 'T',
  slug: '/t',
  bodyRef: { current: { html: '<p/>' } },
  activeBuilder: 'grapesjs' as const,
  intervalMs: 1000,
});

describe('useCanvasAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.getCanvasDraft.mockResolvedValue(undefined);
    storage.saveCanvasDraft.mockResolvedValue(undefined);
    storage.deleteCanvasDraft.mockResolvedValue(undefined);
    usePageBuilderStore.setState({ isDirty: false } as never);
  });
  afterEach(() => vi.useRealTimers());

  it('offers a recoverable draft that is newer than the server copy', async () => {
    storage.getCanvasDraft.mockResolvedValue({
      pageId: 'p1',
      isDirty: true,
      updatedAt: Date.now(),
      title: 'Draft',
    });
    const { result } = renderHook(() =>
      useCanvasAutoSave({ ...base(), serverUpdatedAt: '2020-01-01T00:00:00Z' }),
    );
    await waitFor(() => expect(result.current.hasRecoverableDraft).toBe(true));
    expect(result.current.recoveredDraft?.title).toBe('Draft');
  });

  it('ignores drafts older than the server copy or not dirty', async () => {
    storage.getCanvasDraft.mockResolvedValue({
      isDirty: true,
      updatedAt: 1000,
    });
    const { result } = renderHook(() =>
      useCanvasAutoSave({
        ...base(),
        serverUpdatedAt: new Date().toISOString(),
      }),
    );
    await waitFor(() => expect(storage.getCanvasDraft).toHaveBeenCalled());
    expect(result.current.hasRecoverableDraft).toBe(false);
  });

  it('survives a draft lookup error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.getCanvasDraft.mockRejectedValue(new Error('idb'));
    renderHook(() => useCanvasAutoSave(base()));
    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });

  it('does nothing without a page id or when disabled', async () => {
    renderHook(() => useCanvasAutoSave({ ...base(), pageId: undefined }));
    renderHook(() => useCanvasAutoSave({ ...base(), enabled: false }));
    expect(storage.getCanvasDraft).not.toHaveBeenCalled();
  });

  it('auto-saves dirty content on the interval and only then', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCanvasAutoSave(base()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(storage.saveCanvasDraft).not.toHaveBeenCalled();

    act(() => usePageBuilderStore.setState({ isDirty: true } as never));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(storage.saveCanvasDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 'p1',
        schemaSlug: 'pages',
        isDirty: true,
        builderType: 'grapesjs',
      }),
    );
    expect(result.current.lastAutoSavedAt).not.toBeNull();
  });

  it('logs and continues when saving fails', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.saveCanvasDraft.mockRejectedValue(new Error('quota'));
    renderHook(() => useCanvasAutoSave(base()));
    act(() => usePageBuilderStore.setState({ isDirty: true } as never));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('restores, discards and clears drafts', async () => {
    storage.getCanvasDraft.mockResolvedValue({
      pageId: 'p1',
      isDirty: true,
      updatedAt: Date.now(),
      componentState: { x: 1 },
    });
    const onRestore = vi.fn();
    const restoreSpy = vi.fn();
    usePageBuilderStore.setState({
      restoreComponentState: restoreSpy,
    } as never);
    const { result } = renderHook(() =>
      useCanvasAutoSave({ ...base(), onRestoreDraft: onRestore }),
    );
    await waitFor(() => expect(result.current.hasRecoverableDraft).toBe(true));

    act(() => result.current.restoreDraft());
    expect(restoreSpy).toHaveBeenCalledWith({ x: 1 });
    expect(onRestore).toHaveBeenCalled();
    expect(result.current.hasRecoverableDraft).toBe(false);

    await act(() => result.current.discardDraft());
    expect(storage.deleteCanvasDraft).toHaveBeenCalledWith('p1');
    expect(result.current.recoveredDraft).toBeNull();

    await act(() => result.current.clearLocalDraft());
    expect(storage.deleteCanvasDraft).toHaveBeenCalledTimes(2);
  });

  it('restoreDraft is a no-op without a recovered draft', () => {
    const { result } = renderHook(() => useCanvasAutoSave(base()));
    act(() => result.current.restoreDraft());
    expect(result.current.hasRecoverableDraft).toBe(false);
  });

  it('warns before unload while dirty', () => {
    act(() => usePageBuilderStore.setState({ isDirty: true } as never));
    renderHook(() => useCanvasAutoSave(base()));
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });
});
