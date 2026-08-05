/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalesService } from '../../../../src/modules/locales/locales.service.js';
import { LocalesRepository } from '@repo/repository';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS, ERROR_MESSAGES } from '@repo/constants';
import { ConflictError } from '@repo/utils';

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

describe('LocalesService', () => {
  let localesService: LocalesService;
  let mockRepository: vi.Mocked<LocalesRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new LocalesRepository() as vi.Mocked<LocalesRepository>;
    localesService = new LocalesService(mockRepository);
  });

  it('should list locales', async () => {
    const mockLocales = [{ id: '1', code: 'en', name: 'English' }];
    mockRepository.list.mockResolvedValue(mockLocales as any);

    const result = await localesService.list();

    expect(mockRepository.list).toHaveBeenCalled();
    expect(result).toEqual(mockLocales);
  });

  it('should throw ConflictError if locale code already exists', async () => {
    mockRepository.getByCode.mockResolvedValue({ id: '1', code: 'en' } as any);

    await expect(
      localesService.create({ code: 'en', name: 'English' }),
    ).rejects.toThrow(ConflictError);
    await expect(
      localesService.create({ code: 'en', name: 'English' }),
    ).rejects.toThrow(ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS);
  });

  it('should create a locale and emit audit log', async () => {
    mockRepository.getByCode.mockResolvedValue(null);
    const mockCreated = {
      id: '2',
      code: 'fr',
      name: 'French',
      isDefault: false,
    };
    mockRepository.create.mockResolvedValue(mockCreated as any);

    const result = await localesService.create({ code: 'fr', name: 'French' });

    expect(mockRepository.create).toHaveBeenCalledWith({
      code: 'fr',
      name: 'French',
      isDefault: false,
    });
    expect(result).toEqual(mockCreated);
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'locale',
        resourceId: '2',
      }),
    );
  });

  it('should delete a locale and emit audit log', async () => {
    const beforeState = { id: '2', code: 'fr' };
    mockRepository.getById.mockResolvedValue(beforeState as any);
    mockRepository.delete.mockResolvedValue({ id: '2' } as any);

    const result = await localesService.delete('2');

    expect(mockRepository.delete).toHaveBeenCalledWith('2');
    expect(result).toEqual({ id: '2' });
    expect(eventBus.emit).toHaveBeenCalledWith(
      EVENT_NAMES.AUDIT_LOG,
      expect.objectContaining({
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'locale',
        resourceId: '2',
        beforeState,
      }),
    );
  });
});
