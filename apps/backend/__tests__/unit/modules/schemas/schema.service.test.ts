/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchemaService } from '../../../../src/modules/schemas/schema.service.js';
import { SchemaRepository } from '@repo/repository';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';

vi.mock('@repo/repository');
vi.mock('@repo/events', () => ({
  eventBus: { emit: vi.fn() },
}));
vi.mock('../../../../src/utils/audit.js', () => ({
  getAuditContext: vi.fn().mockReturnValue({
    actorUserId: 'test-user',
    actorAgentId: null,
    context: { ip: '127.0.0.1' },
  }),
}));

describe('SchemaService', () => {
  let schemaService: SchemaService;
  let mockRepository: vi.Mocked<SchemaRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new SchemaRepository() as vi.Mocked<SchemaRepository>;
    schemaService = new SchemaService();
    // inject the mocked repository instead of the actual one
    (schemaService as any).repository = mockRepository;
  });

  it('should get a schema by id', async () => {
    const mockSchema = { id: '1', name: 'Article' };
    mockRepository.getById.mockResolvedValue(mockSchema as any);

    const result = await schemaService.getById('1');

    expect(mockRepository.getById).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockSchema);
  });

  it('should list schemas', async () => {
    const mockSchemas = [{ id: '1', name: 'Article' }];
    mockRepository.list.mockResolvedValue(mockSchemas as any);

    const result = await schemaService.list();

    expect(mockRepository.list).toHaveBeenCalled();
    expect(result).toEqual(mockSchemas);
  });

  it('should create a schema and emit audit log', async () => {
    const input = {
      name: 'Post',
      slug: 'post',
      type: 'collection' as const,
      definition: { fields: [] },
    };
    const mockCreated = { id: '2', ...input };
    mockRepository.create.mockResolvedValue(mockCreated as any);

    const result = await schemaService.create(input, 'user-1');

    expect(mockRepository.create).toHaveBeenCalledWith(
      {
        ...input,
        actorUserId: 'user-1',
      },
      {
        applicationId: undefined,
      },
    );
    expect(result).toEqual(mockCreated);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'schema',
        resourceId: '2',
        actorUserId: 'test-user',
      }),
    );
  });

  it('should update a schema and emit audit log', async () => {
    const input = { name: 'Post Updated' };
    const beforeState = { id: '2', name: 'Post' };
    const mockUpdated = { id: '2', name: 'Post Updated' };
    mockRepository.getById.mockResolvedValue(beforeState as any);
    mockRepository.update.mockResolvedValue(mockUpdated as any);

    const result = await schemaService.update('2', input, 'user-1');

    expect(mockRepository.getById).toHaveBeenCalledWith('2');
    expect(mockRepository.update).toHaveBeenCalledWith('2', {
      ...input,
      actorUserId: 'user-1',
    });
    expect(result).toEqual(mockUpdated);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.SCHEMA_CHANGE,
        resourceType: 'schema',
        resourceId: '2',
        beforeState,
        actorUserId: 'test-user',
      }),
    );
  });

  it('should delete a schema and emit audit log', async () => {
    const beforeState = { id: '2', name: 'Post' };
    mockRepository.getById.mockResolvedValue(beforeState as any);
    mockRepository.delete.mockResolvedValue({ success: true } as any);

    const result = await schemaService.delete('2', true);

    expect(mockRepository.getById).toHaveBeenCalledWith('2');
    expect(mockRepository.delete).toHaveBeenCalledWith('2', true);
    expect(result).toEqual({ success: true });
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.SCHEMA_CHANGE,
        resourceType: 'schema',
        resourceId: '2',
        beforeState,
        actorUserId: 'test-user',
      }),
    );
  });
});
