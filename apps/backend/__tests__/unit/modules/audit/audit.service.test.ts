/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../../../../src/modules/audit/audit.service.js';
import { AuditRepository } from '@repo/repository';
import { NotFoundError } from '@repo/utils';

vi.mock('@repo/repository');

describe('AuditService', () => {
  let auditService: AuditService;
  let mockRepository: vi.Mocked<AuditRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new AuditRepository() as vi.Mocked<AuditRepository>;
    auditService = new AuditService(mockRepository);
  });

  it('should list audit logs with pagination and filters', async () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          applicationId: 'app-1',
          actorType: 'user',
          actorUserId: 'user-1',
          action: 'create',
          resourceType: 'content',
          resourceId: 'res-1',
          timestamp: new Date().toISOString(),
          actorEmail: 'admin@example.com',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    mockRepository.findMany.mockResolvedValue(mockResponse as any);

    const result = await auditService.list({ page: 1, action: 'create' });

    expect(mockRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      action: 'create',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should list audit logs with search query for User', async () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          applicationId: 'app-1',
          actorType: 'user',
          actorUserId: 'user-1',
          action: 'create',
          resourceType: 'user',
          resourceId: 'res-1',
          timestamp: new Date().toISOString(),
          actorEmail: 'admin@example.com',
        },
      ],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    };

    mockRepository.findMany.mockResolvedValue(mockResponse as any);

    const result = await auditService.list({
      page: 1,
      limit: 15,
      search: 'User',
    });

    expect(mockRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
      search: 'User',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should list audit logs with search query for locale', async () => {
    const mockResponse = {
      data: [
        {
          id: '2',
          applicationId: 'app-1',
          actorType: 'user',
          actorUserId: 'user-1',
          action: 'update',
          resourceType: 'locale',
          resourceId: 'res-2',
          timestamp: new Date().toISOString(),
          actorEmail: 'admin@example.com',
        },
      ],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    };

    mockRepository.findMany.mockResolvedValue(mockResponse as any);

    const result = await auditService.list({
      page: 1,
      limit: 15,
      search: 'locale',
    });

    expect(mockRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
      search: 'locale',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should get audit log by id', async () => {
    const mockLog = {
      id: 'log-123',
      action: 'publish',
      resourceType: 'content',
      resourceId: 'entry-1',
      actorEmail: 'author@example.com',
    };

    mockRepository.findById.mockResolvedValue(mockLog as any);

    const result = await auditService.getById('log-123');

    expect(mockRepository.findById).toHaveBeenCalledWith('log-123');
    expect(result).toEqual(mockLog);
  });

  it('should throw NotFoundError if audit log is not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(auditService.getById('non-existent-id')).rejects.toThrow(
      NotFoundError,
    );
  });
});
