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
        mfaEnabled: false,
      },
      headers: {
        'x-app-id': 'CMS_UI',
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

  it('should evaluate token permissions and never fetch creator DB permissions for API tokens', async () => {
    // Even though the creator user in DB has wildcard admin permissions, the viewer API token must be restricted.
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: '*',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);

    mockReq.user = {
      id: 'admin-creator-1',
      email: 'api-token@agentic-cms.local',
      firstName: 'Viewer Token',
      lastName: 'Token',
      roles: ['viewer'],
      mfaEnabled: false,
      isApiToken: true,
      permissions: [
        {
          action: 'read',
          effect: 'allow',
          schemaId: null,
        },
      ],
    };

    await requirePermission('read')(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );
    expect(mockNext).toHaveBeenCalledTimes(1);

    await requirePermission('create')(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(authService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('should return 403 for an API token with no permissions instead of falling back to creator DB permissions', async () => {
    vi.mocked(authService.getUserPermissions).mockResolvedValue([
      {
        action: '*',
        effect: 'allow',
        schemaId: null,
        fields: null,
        condition: null,
      },
    ]);

    mockReq.user = {
      id: 'admin-creator-1',
      email: 'api-token@agentic-cms.local',
      firstName: 'Unprivileged Token',
      lastName: 'Token',
      roles: ['user'],
      mfaEnabled: false,
      isApiToken: true,
      permissions: [],
    };

    await requirePermission('read')(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
    expect(authService.getUserPermissions).not.toHaveBeenCalled();
  });
});
