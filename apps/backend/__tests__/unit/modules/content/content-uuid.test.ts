import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, BadRequestError } from '@repo/utils';
import { errorHandlerMiddleware } from '@repo/middlewares';
import { RecordNotFoundError } from '@repo/shared-db';
import type { NextFunction, Request, Response } from 'express';

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock('@repo/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/config')>();
  return {
    ...actual,
    getDatabaseAdapter: () => ({
      getDb: mockGetDb,
    }),
  };
});

import { ContentRepository } from '@repo/repository';
import { ContentService } from '../../../../src/modules/content/content.service.js';

describe('Content UUID validation & error propagation', () => {
  let repo: ContentRepository;
  let service: ContentService;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ContentRepository();
    service = new ContentService();
  });

  it('rejects non-UUID entryId with BadRequestError across ContentRepository methods', async () => {
    const invalidId = 'not-a-uuid';

    await expect(repo.getEntryById(invalidId)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid entry ID format.',
    });
    await expect(
      repo.updateEntryDraft(invalidId, { title: 'x' }, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(repo.publishEntry(invalidId, 'user-1')).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(
      repo.unpublishEntry(invalidId, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      repo.revertEntry(invalidId, 1, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(repo.listEntryVersions(invalidId)).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(repo.deleteEntry(invalidId)).rejects.toBeInstanceOf(
      BadRequestError,
    );

    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('maps Postgres 22P02 UUID errors to BadRequestError', async () => {
    const validUuid = '11111111-1111-4111-8111-111111111111';
    mockGetDb.mockReturnValue({
      transaction: vi.fn().mockRejectedValue({ code: '22P02' }),
    });

    await expect(repo.getEntryById(validUuid)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid entry ID format.',
    });
  });

  it('propagates 400 BadRequestError and 404 errors from ContentService without wrapping into 500 or exposing stack traces', async () => {
    await expect(service.getEntryById('not-a-uuid')).rejects.toBeInstanceOf(
      BadRequestError,
    );

    const validUuid = '11111111-1111-4111-8111-111111111111';
    const repoInstance = (
      service as unknown as { repository: ContentRepository }
    ).repository;
    vi.spyOn(repoInstance, 'getEntryById').mockResolvedValueOnce(null);
    await expect(
      service.updatePartial(validUuid, { title: 'Updated' }, 'user-1'),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Entry not found',
    });

    vi.spyOn(repoInstance, 'getEntryById').mockResolvedValueOnce(null);
    vi.spyOn(repoInstance, 'deleteEntry').mockRejectedValueOnce(
      new RecordNotFoundError('Entry not found or already deleted'),
    );
    await expect(
      service.deleteEntry(validUuid, 'user-1'),
    ).rejects.toBeInstanceOf(RecordNotFoundError);

    let capturedError: unknown;
    try {
      await service.getEntryById('not-a-uuid');
    } catch (err) {
      capturedError = err;
    }

    const req = { id: 'req-123' } as unknown as Request;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    errorHandlerMiddleware(capturedError, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0]?.[0] as {
      error: { message: string; stack?: string };
    };
    expect(body.error.message).toBe('Invalid entry ID format.');
    expect(body.error.stack).toBeUndefined();

    // Ensure unexpected non-HTTP errors still throw 500 ApiError
    vi.spyOn(repoInstance, 'getEntryById').mockRejectedValueOnce(
      new Error('Unexpected crash'),
    );
    await expect(service.getEntryById(validUuid)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
