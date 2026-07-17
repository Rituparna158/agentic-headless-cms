import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockStorageRead,
  mockStorageWrite,
  mockResizeImage,
  mockRegisterWorker,
  WorkerHandle,
} = vi.hoisted(() => {
  const mockStorageRead = vi.fn();
  const mockStorageWrite = vi.fn();
  const mockResizeImage = vi.fn();
  const WorkerHandle = { on: vi.fn() };
  const mockRegisterWorker = vi.fn().mockReturnValue(WorkerHandle);
  return {
    mockStorageRead,
    mockStorageWrite,
    mockResizeImage,
    mockRegisterWorker,
    WorkerHandle,
  };
});

vi.mock('../../src/config/storage.js', () => ({
  getStorageAdapter: vi.fn().mockReturnValue({
    read: mockStorageRead,
    write: mockStorageWrite,
  }),
}));

vi.mock('../../src/modules/media/image-processing.js', () => ({
  resizeImage: mockResizeImage,
}));

vi.mock('../../src/queues/queue.factory.js', () => ({
  registerWorker: mockRegisterWorker,
}));

describe('queues/media.worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildThumbnailKey derives a deterministic key from the source key', async () => {
    const { buildThumbnailKey } =
      await import('../../src/queues/media.worker.js');

    expect(buildThumbnailKey('abc123.jpg')).toBe('abc123__thumb.jpg');
    expect(buildThumbnailKey('no-extension')).toBe('no-extension__thumb');
  });

  it('registers a worker for the media-processing queue', async () => {
    const { setupMediaWorker } =
      await import('../../src/queues/media.worker.js');
    const { QUEUE_NAMES } =
      await import('../../src/queues/queue-names.constants.js');

    setupMediaWorker();

    expect(mockRegisterWorker).toHaveBeenCalledWith(
      QUEUE_NAMES.MEDIA_PROCESSING,
      expect.any(Function),
    );
    expect(WorkerHandle.on).toHaveBeenCalledWith(
      'completed',
      expect.any(Function),
    );
  });

  it('the processor resizes an image asset and writes the thumbnail to storage', async () => {
    mockStorageRead.mockResolvedValue(Buffer.from('original-bytes'));
    mockResizeImage.mockResolvedValue(Buffer.from('resized-bytes'));

    const { setupMediaWorker } =
      await import('../../src/queues/media.worker.js');
    setupMediaWorker();
    const processor = mockRegisterWorker.mock.calls[0]![1] as (job: {
      data: { assetId: string; storageKey: string; mimeType: string };
    }) => Promise<void>;

    await processor({
      data: {
        assetId: 'asset-1',
        storageKey: 'abc.png',
        mimeType: 'image/png',
      },
    });

    expect(mockStorageRead).toHaveBeenCalledWith('abc.png');
    expect(mockResizeImage).toHaveBeenCalledWith(
      Buffer.from('original-bytes'),
      expect.objectContaining({ fit: 'inside' }),
    );
    expect(mockStorageWrite).toHaveBeenCalledWith(
      'abc__thumb.png',
      Buffer.from('resized-bytes'),
      'image/png',
    );
  });

  it('the processor is a no-op for non-image assets', async () => {
    const { setupMediaWorker } =
      await import('../../src/queues/media.worker.js');
    setupMediaWorker();
    const processor = mockRegisterWorker.mock.calls[0]![1] as (job: {
      data: { assetId: string; storageKey: string; mimeType: string };
    }) => Promise<void>;

    await processor({
      data: {
        assetId: 'asset-2',
        storageKey: 'doc.pdf',
        mimeType: 'application/pdf',
      },
    });

    expect(mockStorageRead).not.toHaveBeenCalled();
    expect(mockResizeImage).not.toHaveBeenCalled();
    expect(mockStorageWrite).not.toHaveBeenCalled();
  });
});
