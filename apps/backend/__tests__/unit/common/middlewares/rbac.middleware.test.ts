import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePermission } from '../../../../src/middlewares/rbac.middleware.js';
import { authService } from '../../../../src/modules/auth/auth.service.js';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../../../src/modules/auth/auth.service.js', () => ({
  authService: {
    getUserPermissions: vi.fn(),
  },
}));

describe('RBAC Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: [],
        firstName: 'Test',
        lastName: 'User',
      },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq.user = undefined;
    const middleware = requirePermission('read');
    await middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Unauthorized: User not authenticated',
        requestId: undefined,
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if user has the exact permission', async () => {
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: 'read',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);

    const middleware = requirePermission('read');
    await middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should call next() if user has wildcard permission', async () => {
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: '*',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);

    const middleware = requirePermission('update');
    await middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should return 403 if user lacks permission', async () => {
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: 'read',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);

    const middleware = requirePermission('update');
    await middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Forbidden: Insufficient permissions',
        requestId: undefined,
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
