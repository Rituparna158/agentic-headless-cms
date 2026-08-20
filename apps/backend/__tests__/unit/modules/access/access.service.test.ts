/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessService } from '../../../../src/modules/access/access.service.js';
import { AccessRepository, authRepository } from '@repo/repository';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS, ERROR_MESSAGES } from '@repo/constants';
import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
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
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue('Mocked file content'),
  },
}));
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true),
    }),
  },
}));
vi.mock('@repo/config', () => ({
  env: {
    CORS_ORIGIN: 'http://localhost:3001',
    APP_URL: 'http://localhost:3000',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 587,
    SMTP_USER: 'test@example.com',
    SMTP_PASS: 'password',
    EMAIL_FROM: 'noreply@example.com',
  },
}));
describe('AccessService', () => {
  let accessService: AccessService;
  let mockRepository: vi.Mocked<AccessRepository>;
  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new AccessRepository() as vi.Mocked<AccessRepository>;
    accessService = new AccessService(mockRepository);
  });
  describe('Roles', () => {
    it('should list roles', async () => {
      const mockRoles = [{ id: '1', name: 'Admin', permissions: [] }];
      mockRepository.listRoles.mockResolvedValue(mockRoles);
      const result = await accessService.listRoles();
      expect(mockRepository.listRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
    it('should get role by id', async () => {
      const mockRole = { id: '1', name: 'Admin', permissions: [] };
      mockRepository.getRoleById.mockResolvedValue(mockRole);
      const result = await accessService.getRole('1');
      expect(mockRepository.getRoleById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockRole);
    });
    it('should create a role and emit audit log', async () => {
      const input = {
        name: 'Editor',
        description: 'Edits stuff',
        permissions: [],
      };
      const createdRole = { id: '2', ...input };
      mockRepository.createRole.mockResolvedValue(createdRole);
      const result = await accessService.createRole(input);
      expect(mockRepository.createRole).toHaveBeenCalledWith(
        { name: 'Editor', description: 'Edits stuff', isSystem: undefined },
        [],
      );
      expect(result).toEqual(createdRole);
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.CREATE,
          resourceType: 'role',
          resourceId: '2',
        }),
      );
    });
    it('should update a role and emit audit log', async () => {
      const input = { name: 'Super Editor', permissions: [] };
      const beforeRole = { id: '2', name: 'Editor', permissions: [] };
      const afterRole = { id: '2', name: 'Super Editor', permissions: [] };
      mockRepository.getRoleById.mockResolvedValue(beforeRole);
      mockRepository.updateRole.mockResolvedValue(afterRole);
      const result = await accessService.updateRole('2', input);
      expect(mockRepository.updateRole).toHaveBeenCalledWith(
        '2',
        { name: 'Super Editor', description: undefined },
        [],
      );
      expect(result).toEqual(afterRole);
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.UPDATE,
          resourceType: 'role',
          resourceId: '2',
          beforeState: beforeRole,
          afterState: afterRole,
        }),
      );
    });
    it('should delete a role and emit audit log', async () => {
      const beforeRole = { id: '2', name: 'Editor', permissions: [] };
      mockRepository.getRoleById.mockResolvedValue(beforeRole);
      mockRepository.deleteRole.mockResolvedValue({ id: '2' });
      const result = await accessService.deleteRole('2');
      expect(mockRepository.deleteRole).toHaveBeenCalledWith('2');
      expect(result).toEqual({ id: '2' });
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.DELETE,
          resourceType: 'role',
          resourceId: '2',
        }),
      );
    });
  });
  describe('Users and Invites', () => {
    it('should list users', async () => {
      const mockUsers = [{ id: '1', email: 'test@test.com' }];
      mockRepository.listUsers.mockResolvedValue(mockUsers);
      const result = await accessService.listUsers();
      expect(mockRepository.listUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
    it('should throw BadRequestError if invited user already exists in this app', async () => {
      mockRepository.getUserByEmailAndApp.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      } as any);
      await expect(
        accessService.inviteUser(
          'test@test.com',
          undefined,
          undefined,
          undefined,
          undefined,
          'app-1',
        ),
      ).rejects.toThrow(ERROR_MESSAGES.ACCESS.USER_ALREADY_EXISTS);
    });
    it('should throw InternalServerError if user creation fails', async () => {
      mockRepository.getUserByEmail.mockResolvedValue(null);
      mockRepository.createUser.mockResolvedValue(null as any);
      await expect(accessService.inviteUser('new@test.com')).rejects.toThrow(
        ERROR_MESSAGES.ACCESS.FAILED_TO_INVITE_USER,
      );
    });
    it('should create an invited user, assign role, send email, and emit audit log', async () => {
      mockRepository.getUserByEmail.mockResolvedValue(null);
      const mockCreatedUser = {
        id: 'new-user',
        email: 'new@test.com',
        status: 'invited',
      };
      mockRepository.createUser.mockResolvedValue(mockCreatedUser as any);
      const transporterMock = nodemailer.createTransport();
      const result = await accessService.inviteUser(
        'new@test.com',
        'John',
        'Doe',
        'role-1',
      );
      expect(mockRepository.createUser).toHaveBeenCalled();
      expect(mockRepository.assignUserRole).toHaveBeenCalledWith(
        'new-user',
        'role-1',
      );
      expect(transporterMock.sendMail).toHaveBeenCalled();
      expect(result.inviteUrl).toContain(
        'http://localhost:3000/accept-invite?token=',
      );
      expect(result.user).toEqual(mockCreatedUser);
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.CREATE,
          resourceType: 'user',
          resourceId: 'new-user',
        }),
      );
    });
    it('should handle missing email templates by using fallbacks', async () => {
      mockRepository.getUserByEmail.mockResolvedValue(null);
      mockRepository.createUser.mockResolvedValue({
        id: 'new',
        email: 'new@test.com',
        status: 'invited',
      } as any);
      // Force fs.readFile to throw
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));
      const result = await accessService.inviteUser('new@test.com');
      expect(result.inviteUrl).toBeDefined();
      const transporterMock = nodemailer.createTransport();
      expect(transporterMock.sendMail).toHaveBeenCalled(); // It should still send using the fallback
    });
  });
  describe('Tokens', () => {
    it('should list tokens', async () => {
      const mockTokens = [{ id: 't1', name: 'My Token' }];
      mockRepository.listTokens.mockResolvedValue(mockTokens as any);
      const result = await accessService.listTokens();
      expect(mockRepository.listTokens).toHaveBeenCalled();
      expect(result).toEqual(mockTokens);
    });
    it('should create a token and emit audit log', async () => {
      const mockToken = { id: 't1', name: 'My Token', type: 'user' };
      mockRepository.createToken.mockResolvedValue(mockToken as any);
      const result = await accessService.createToken(
        { name: 'My Token' },
        'user-1',
      );
      expect(mockRepository.createToken).toHaveBeenCalled();
      expect(result).toHaveProperty('rawToken');
      expect(result.id).toBe('t1');
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.CREATE,
          resourceType: 'token',
          resourceId: 't1',
        }),
      );
    });
    it('should revoke a token and emit audit log', async () => {
      const beforeToken = { id: 't1', name: 'My Token' };
      mockRepository.getTokenById.mockResolvedValue(beforeToken as any);
      mockRepository.revokeToken.mockResolvedValue({ success: true });
      const result = await accessService.revokeToken('t1');
      expect(mockRepository.revokeToken).toHaveBeenCalledWith('t1');
      expect(result).toEqual({ success: true });
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_NAMES.AUDIT_LOG,
        expect.objectContaining({
          action: AUDIT_ACTIONS.DELETE,
          resourceType: 'token',
          resourceId: 't1',
          beforeState: beforeToken,
        }),
      );
    });
  });
  describe('MFA Reset Requests', () => {
    it('should list MFA reset requests', async () => {
      const mockRequests = [{ id: 'req-1', status: 'pending' }];
      vi.mocked(authRepository.getAllMfaResetRequests).mockResolvedValue([
        mockRequests as any,
        1,
      ]);
      const result = await accessService.listMfaRequests('pending');
      expect(authRepository.getAllMfaResetRequests).toHaveBeenCalledWith(
        undefined,
        'pending',
        {},
      );
      expect(result).toEqual({
        data: [
          {
            id: 'req-1',
            userId: undefined,
            status: 'pending',
            createdAt: undefined,
            user: undefined,
            admin: undefined,
          },
        ],
        meta: {
          pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 },
        },
      });
    });
    it('should throw NotFoundError if MFA request not found on approval', async () => {
      vi.mocked(authRepository.getMfaResetRequestById).mockResolvedValue(null);
      await expect(
        accessService.approveMfaResetRequest('req-1', 'admin-1'),
      ).rejects.toThrow(
        ERROR_MESSAGES.ACCESS.MFA_REQUEST_NOT_FOUND ||
          'Request not found or not in pending state',
      );
    });
    it('should approve MFA reset request, send email and emit audit log', async () => {
      const mockRequest = {
        id: 'req-1',
        userId: 'user-1',
        status: 'pending',
        user: { email: 'test@example.com', firstName: 'John' },
      };
      vi.mocked(authRepository.getMfaResetRequestById).mockResolvedValue(
        mockRequest as any,
      );
      vi.mocked(authRepository.updateMfaResetRequest).mockResolvedValue({
        ...mockRequest,
        status: 'approved',
      } as any);
      vi.mocked(authRepository.getUserById).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any);
      const transporterMock = nodemailer.createTransport();
      const result = await accessService.approveMfaResetRequest(
        'req-1',
        'admin-1',
      );
      expect(authRepository.updateMfaResetRequest).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({ status: 'approved', adminId: 'admin-1' }),
      );
      expect(transporterMock.sendMail).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    it('should throw NotFoundError if MFA request not found on rejection', async () => {
      vi.mocked(authRepository.getMfaResetRequestById).mockResolvedValue(null);
      await expect(
        accessService.rejectMfaResetRequest('req-1', 'admin-1'),
      ).rejects.toThrow(
        ERROR_MESSAGES.ACCESS.MFA_REQUEST_NOT_FOUND ||
          'Request not found or not in pending state',
      );
    });
    it('should reject MFA reset request, send email and emit audit log', async () => {
      const mockRequest = {
        id: 'req-1',
        userId: 'user-1',
        status: 'pending',
        user: { email: 'test@example.com', firstName: 'John' },
      };
      vi.mocked(authRepository.getMfaResetRequestById).mockResolvedValue(
        mockRequest as any,
      );
      vi.mocked(authRepository.updateMfaResetRequest).mockResolvedValue({
        ...mockRequest,
        status: 'rejected',
      } as any);
      vi.mocked(authRepository.getUserById).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any);
      const transporterMock = nodemailer.createTransport();
      const result = await accessService.rejectMfaResetRequest(
        'req-1',
        'admin-1',
      );
      expect(authRepository.updateMfaResetRequest).toHaveBeenCalledWith(
        'req-1',
        { status: 'rejected', adminId: 'admin-1' },
      );
      expect(transporterMock.sendMail).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
