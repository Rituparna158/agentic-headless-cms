import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQueueAdd, mockGetQueue } = vi.hoisted(() => {
  const mockQueueAdd = vi.fn().mockResolvedValue(undefined);
  return {
    mockQueueAdd,
    mockGetQueue: vi.fn().mockReturnValue({ add: mockQueueAdd }),
  };
});

vi.mock('../../../src/queues/queue.factory.js', () => ({
  getQueue: mockGetQueue,
}));

describe('queues/media-queue.listener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eventBus is a module-level singleton — without resetting modules,
    // setupMediaQueueListener() registered in a prior test would still be
    // attached, double-firing on this test's emit.
    vi.resetModules();
  });

  it('enqueues a generate-thumbnail job when MEDIA_UPLOADED fires', async () => {
    const { eventBus } =
      await import('../../../src/common/events/event-bus.js');
    const { EVENT_NAMES } =
      await import('../../../src/constants/events.constants.js');
    const { setupMediaQueueListener } =
      await import('../../../src/queues/media-queue.listener.js');
    const { QUEUE_NAMES } =
      await import('../../../src/queues/queue-names.constants.js');

    setupMediaQueueListener();

    eventBus.emit(EVENT_NAMES.MEDIA_UPLOADED, {
      assetId: 'asset-1',
      storageKey: 'abc.png',
      mimeType: 'image/png',
    });

    await vi.waitFor(() => {
      expect(mockGetQueue).toHaveBeenCalledWith(QUEUE_NAMES.MEDIA_PROCESSING);
      expect(mockQueueAdd).toHaveBeenCalledWith('generate-thumbnail', {
        assetId: 'asset-1',
        storageKey: 'abc.png',
        mimeType: 'image/png',
      });
    });
  });

  it('does not throw when enqueueing fails — logs and swallows instead', async () => {
    mockQueueAdd.mockRejectedValueOnce(new Error('redis down'));

    const { eventBus } =
      await import('../../../src/common/events/event-bus.js');
    const { EVENT_NAMES } =
      await import('../../../src/constants/events.constants.js');
    const { setupMediaQueueListener } =
      await import('../../../src/queues/media-queue.listener.js');

    setupMediaQueueListener();

    expect(() =>
      eventBus.emit(EVENT_NAMES.MEDIA_UPLOADED, {
        assetId: 'asset-2',
        storageKey: 'def.png',
        mimeType: 'image/png',
      }),
    ).not.toThrow();

    await vi.waitFor(() => {
      expect(mockQueueAdd).toHaveBeenCalled();
    });
  });
});
