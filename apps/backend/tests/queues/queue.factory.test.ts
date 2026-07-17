import { describe, it, expect, vi, beforeEach } from 'vitest';

const { QueueMock, WorkerMock, mockQueueClose, mockWorkerClose, mockWorkerOn } =
  vi.hoisted(() => {
    const mockQueueClose = vi.fn().mockResolvedValue(undefined);
    const mockWorkerClose = vi.fn().mockResolvedValue(undefined);
    const mockWorkerOn = vi.fn();
    return {
      mockQueueClose,
      mockWorkerClose,
      mockWorkerOn,
      // Real `function`s, not arrows — queue.factory.ts calls these via
      // `new Queue(...)`/`new Worker(...)`, and arrow functions can never
      // be constructed.
      QueueMock: vi.fn().mockImplementation(function () {
        return { close: mockQueueClose };
      }),
      WorkerMock: vi.fn().mockImplementation(function () {
        return { close: mockWorkerClose, on: mockWorkerOn };
      }),
    };
  });

vi.mock('bullmq', () => ({ Queue: QueueMock, Worker: WorkerMock }));
vi.mock('../../src/config/redis.js', () => ({
  getRedisConnection: vi.fn().mockReturnValue({ mockConnection: true }),
}));

describe('queues/queue.factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('creates a Queue with an exponential-backoff retry policy from env', async () => {
    const { getQueue } = await import('../../src/queues/queue.factory.js');
    const { QUEUE_NAMES } =
      await import('../../src/queues/queue-names.constants.js');

    getQueue(QUEUE_NAMES.MEDIA_PROCESSING);

    expect(QueueMock).toHaveBeenCalledWith(
      QUEUE_NAMES.MEDIA_PROCESSING,
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          attempts: expect.any(Number),
          backoff: expect.objectContaining({ type: 'exponential' }),
        }),
      }),
    );
  });

  it('reuses the same Queue instance for the same name', async () => {
    const { getQueue } = await import('../../src/queues/queue.factory.js');
    const { QUEUE_NAMES } =
      await import('../../src/queues/queue-names.constants.js');

    const first = getQueue(QUEUE_NAMES.MEDIA_PROCESSING);
    const second = getQueue(QUEUE_NAMES.MEDIA_PROCESSING);

    expect(first).toBe(second);
    expect(QueueMock).toHaveBeenCalledTimes(1);
  });

  it('registers a worker and logs failed jobs', async () => {
    const { registerWorker } =
      await import('../../src/queues/queue.factory.js');
    const { QUEUE_NAMES } =
      await import('../../src/queues/queue-names.constants.js');

    const processor = vi.fn();
    registerWorker(QUEUE_NAMES.MEDIA_PROCESSING, processor);

    expect(WorkerMock).toHaveBeenCalledWith(
      QUEUE_NAMES.MEDIA_PROCESSING,
      processor,
      expect.objectContaining({ connection: { mockConnection: true } }),
    );
    expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('closes every registered queue and worker', async () => {
    const { getQueue, registerWorker, closeAllQueues } =
      await import('../../src/queues/queue.factory.js');
    const { QUEUE_NAMES } =
      await import('../../src/queues/queue-names.constants.js');

    getQueue(QUEUE_NAMES.MEDIA_PROCESSING);
    registerWorker(QUEUE_NAMES.MEDIA_PROCESSING, vi.fn());

    await closeAllQueues();

    expect(mockQueueClose).toHaveBeenCalledTimes(1);
    expect(mockWorkerClose).toHaveBeenCalledTimes(1);
  });
});
