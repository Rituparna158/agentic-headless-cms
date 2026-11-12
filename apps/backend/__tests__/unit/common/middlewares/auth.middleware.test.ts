import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '@repo/middlewares';
import { getDatabaseAdapter } from '@repo/config';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('@repo/config', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
  },
  getDatabaseAdapter: vi.fn(),
}));

describe('Auth Middleware - Security Edge Cases', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      cookies: {},
      headers: {},
      context: { applicationId: 'app-1' } as any,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    };
    vi.mocked(getDatabaseAdapter).mockReturnValue({
      getDb: () => mockDb as any,
    } as any);
  });

  it('should return 401 when no token is present', async () => {
    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Unauthorized: No token provided',
        }),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is an unverified MFA challenge', async () => {
    mockReq.headers = { authorization: 'Bearer challenge-token' };
    vi.mocked(jwt.verify).mockReturnValue({
      id: 'u1',
      isMfaChallenge: true,
    } as any);

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Unauthorized: Invalid token',
        }),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with explicit message when API token is revoked', async () => {
    mockReq.headers = { authorization: 'Bearer revoked-api-token' };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const mockRevokedToken = {
      id: 'token-1',
      applicationId: 'app-1',
      revokedAt: new Date(),
      expiresAt: null,
      roleId: null,
    };

    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ token: mockRevokedToken, role: null }]),
          }),
        }),
      }),
    });

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Token has been revoked',
        }),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with explicit message when API token has expired', async () => {
    mockReq.headers = { authorization: 'Bearer expired-api-token' };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const mockExpiredToken = {
      id: 'token-2',
      applicationId: 'app-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
      roleId: null,
    };

    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ token: mockExpiredToken, role: null }]),
          }),
        }),
      }),
    });

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Token has expired',
        }),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() and attach user when valid JWT token is provided', async () => {
    const validUser = {
      id: 'user-123',
      email: 'test@example.com',
      roles: ['admin'],
    };
    mockReq.headers = { authorization: 'Bearer valid-jwt-token' };
    vi.mocked(jwt.verify).mockReturnValue(validUser as any);

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual(validUser);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should mark API-token req.user with isApiToken: true and attach token role permissions', async () => {
    mockReq.headers = { authorization: 'Bearer valid-api-token' };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const viewerPerms = [
      {
        action: 'read',
        effect: 'allow',
        schemaId: 'schema-blog',
        fields: null,
        condition: null,
      },
    ];

    mockDb.select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  token: {
                    id: 'token-viewer',
                    name: 'Viewer SDK Token',
                    applicationId: 'app-1',
                    createdBy: 'admin-creator-1',
                    revokedAt: null,
                    expiresAt: null,
                    roleId: 'role-viewer',
                  },
                  role: { id: 'role-viewer', name: 'viewer' },
                },
              ]),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(viewerPerms),
        }),
      });

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 'admin-creator-1',
      email: 'api-token@agentic-cms.local',
      firstName: 'Viewer SDK Token',
      lastName: 'Token',
      roles: ['viewer'],
      permissions: viewerPerms,
      mfaEnabled: false,
      isApiToken: true,
    });
  });

  it('should reject an API token belonging to a different application', async () => {
    mockReq.headers = { authorization: 'Bearer other-app-token' };
    mockReq.context = { applicationId: 'app-2' };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                token: {
                  id: 'token-app1',
                  name: 'App 1 Token',
                  applicationId: 'app-1',
                  createdBy: 'admin-1',
                  revokedAt: null,
                  expiresAt: null,
                  roleId: 'role-1',
                },
                role: { id: 'role-1', name: 'admin' },
              },
            ]),
          }),
        }),
      }),
    });

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Unauthorized: Invalid token',
        }),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should mark API-token req.user with isApiToken: true in optionalAuthenticateToken', async () => {
    mockReq.headers = { authorization: 'Bearer optional-api-token' };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    mockDb.select = vi.fn().mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                token: {
                  id: 'token-opt',
                  name: 'Optional Viewer Token',
                  applicationId: 'app-1',
                  createdBy: 'admin-1',
                  revokedAt: null,
                  expiresAt: null,
                  roleId: null,
                },
                role: { id: 'role-viewer', name: 'viewer' },
              },
            ]),
          }),
        }),
      }),
    });

    await optionalAuthenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 'admin-1',
      email: 'api-token@agentic-cms.local',
      firstName: 'Optional Viewer Token',
      lastName: 'Token',
      roles: ['viewer'],
      permissions: [],
      mfaEnabled: false,
      isApiToken: true,
    });
  });

  it('should strip isApiToken from JWT payloads so JWT users cannot spoof API token permissions', async () => {
    mockReq.headers = { authorization: 'Bearer crafted-jwt-token' };
    vi.mocked(jwt.verify).mockReturnValue({
      id: 'user-123',
      email: 'test@example.com',
      roles: ['viewer'],
      isApiToken: true,
      permissions: [{ action: '*', effect: 'allow', schemaId: null }],
    } as unknown as ReturnType<typeof jwt.verify>);

    await authenticateToken(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user?.isApiToken).toBeUndefined();
  });
});
