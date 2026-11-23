/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listAuditLogs,
  getAuditLog,
} from '../../../../src/modules/audit/audit.controller.js';
import { auditService } from '../../../../src/modules/audit/audit.service.js';

vi.mock('../../../../src/modules/audit/audit.service.js', () => ({
  auditService: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

describe('AuditController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAuditLogs', () => {
    it('extracts applicationId from req.context and passes to auditService.list', async () => {
      const mockResult = {
        data: [{ id: '1', applicationId: 'cms-ui-id' }],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (auditService.list as any).mockResolvedValue(mockResult);

      const req: any = {
        query: { page: '1', limit: '15' },
        headers: { 'x-app-id': 'CMS_UI' },
        context: { applicationId: 'cms-ui-id' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await listAuditLogs(req, res, next);

      expect(auditService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 15,
          applicationId: 'cms-ui-id',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          data: mockResult,
        }),
      );
    });

    it('falls back to x-app-id or x-api-id header if context is not present', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 0,
      };
      (auditService.list as any).mockResolvedValue(mockResult);

      const req: any = {
        query: {},
        headers: { 'x-app-id': 'CMS_UI' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await listAuditLogs(req, res, next);

      expect(auditService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'CMS_UI',
        }),
      );
    });

    it('supports x-api-id header when provided', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 0,
      };
      (auditService.list as any).mockResolvedValue(mockResult);

      const req: any = {
        query: {},
        headers: { 'x-api-id': 'CMS_UI' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await listAuditLogs(req, res, next);

      expect(auditService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'CMS_UI',
        }),
      );
    });
  });

  describe('getAuditLog', () => {
    it('passes id and applicationId to auditService.getById', async () => {
      const mockLog = { id: 'log-123', applicationId: 'cms-ui-id' };
      (auditService.getById as any).mockResolvedValue(mockLog);

      const req: any = {
        params: { id: 'log-123' },
        headers: { 'x-app-id': 'CMS_UI' },
        context: { applicationId: 'cms-ui-id' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await getAuditLog(req, res, next);

      expect(auditService.getById).toHaveBeenCalledWith('log-123', 'cms-ui-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          data: mockLog,
        }),
      );
    });
  });
});
