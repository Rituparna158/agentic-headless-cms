import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/constants';
import { Request, Response, RequestHandler } from 'express';
import { env } from '@repo/config';
import { PermissionData } from '@repo/types';
import {
  NotFoundError,
  BadRequestError,
  asyncHandler,
  ApiResponse,
} from '@repo/utils';
import { logger } from '@repo/logger';
import { AccessService } from './access.service.js';
import {
  parseQueryOptions,
  formatPaginatedResponse,
} from '../../utils/pagination.util.js';
const accessService = new AccessService();
export const listRoles: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listRoles start');
    const appId = req.headers['x-app-id'] as string;
    if (!appId) throw new BadRequestError('x-app-id header is required');
    const options = parseQueryOptions(req.query);
    const [roles, total] = await accessService.listRoles(options, appId);
    logger.debug(
      { count: roles.length, total },
      'AccessController: listRoles success',
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            roles,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Roles listed successfully',
        ),
      );
  },
);
export const getRole: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: getRole start');
    const role = await accessService.getRole(id as string);
    if (!role) {
      logger.warn({ id }, 'AccessController: role not found');
      throw new NotFoundError(ERROR_MESSAGES.ACCESS.ROLE_NOT_FOUND);
    }
    logger.debug({ id }, 'AccessController: getRole success');
    res
      .status(200)
      .json(new ApiResponse(200, role, 'Role retrieved successfully'));
  },
);
export const createRole: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      applicationId: string;
      description?: string;
      mfaRequired?: boolean;
      isSystem?: boolean;
      permissions?: PermissionData[];
    };
    logger.info({ name: body.name }, 'AccessController: createRole start');
    const role = await accessService.createRole(body);
    logger.debug({ id: role.id }, 'AccessController: createRole success');
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(201, role, 'Role created successfully'));
  },
);
export const updateRole: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: updateRole start');
    const role = await accessService.updateRole(
      id as string,
      req.body as {
        name?: string;
        description?: string;
        mfaRequired?: boolean;
        permissions?: PermissionData[];
      },
    );
    logger.debug({ id }, 'AccessController: updateRole success');
    res
      .status(200)
      .json(new ApiResponse(200, role, 'Role updated successfully'));
  },
);
export const deleteRole: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: deleteRole start');
    await accessService.deleteRole(id as string);
    logger.debug({ id }, 'AccessController: deleteRole success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);
export const listUsers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listUsers start');
    const appId = req.headers['x-app-id'] as string;
    if (!appId) throw new BadRequestError('x-app-id header is required');
    const options = parseQueryOptions(req.query);
    const [users, total] = await accessService.listUsers(options, appId);
    logger.debug(
      { count: users.length, total },
      'AccessController: listUsers success',
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            users,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Users listed successfully',
        ),
      );
  },
);
export const inviteUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      email: string;
      firstName?: string;
      lastName?: string;
      roleId: string;
    };
    const { email, firstName, lastName, roleId } = body;
    logger.info({ email, roleId }, 'AccessController: inviteUser start');
    if (!email || !roleId) {
      logger.warn('AccessController: inviteUser missing email or roleId');
      throw new BadRequestError(ERROR_MESSAGES.ACCESS.EMAIL_AND_ROLE_REQUIRED);
    }
    const origin = req.get('origin');
    const appId = req.headers['x-app-id'] as string | undefined;
    const { inviteUrl, user } = await accessService.inviteUser(
      email,
      firstName,
      lastName,
      roleId,
      origin,
      appId,
    );
    logger.debug({ userId: user.id }, 'AccessController: inviteUser success');
    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(
        201,
        {
          message: 'Invitation sent',
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
          },
          inviteUrl: env.NODE_ENV !== 'production' ? inviteUrl : undefined,
        },
        'Invitation sent successfully',
      ),
    );
  },
);
export const deleteUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: deleteUser start');
    await accessService.deleteUser(id as string);
    logger.debug({ id }, 'AccessController: deleteUser success');
    res.status(HTTP_STATUS.NO_CONTENT).send();
  },
);
export const updateUserRole: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { roleId } = req.body as { roleId: string };
    logger.info({ id, roleId }, 'AccessController: updateUserRole start');
    if (!roleId) {
      throw new BadRequestError('roleId is required');
    }
    await accessService.updateUserRole(id as string, roleId);
    logger.debug({ id, roleId }, 'AccessController: updateUserRole success');
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { success: true },
          'User role updated successfully',
        ),
      );
  },
);
export const listTokens: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listTokens start');
    const options = parseQueryOptions(req.query);
    const [tokens, total] = await accessService.listTokens(options);
    logger.debug(
      { count: tokens.length, total },
      'AccessController: listTokens success',
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatPaginatedResponse(
            tokens,
            total,
            options.page!,
            options.pageSize!,
          ),
          'Tokens listed successfully',
        ),
      );
  },
);
export const createToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      type?: 'user' | 'agent';
      roleId?: string;
      scopes?: unknown;
    };
    logger.info({ name: body.name }, 'AccessController: createToken start');
    const mfaCode = req.headers['x-mfa-code'] as string | undefined;
    await accessService.validateMfa(req.user!.id, mfaCode);
    const token = await accessService.createToken(body, req.user!.id);
    logger.debug(
      { tokenId: token.id },
      'AccessController: createToken success',
    );
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(201, token, 'Token created successfully'));
  },
);
export const revokeToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: revokeToken start');
    const mfaCode = req.headers['x-mfa-code'] as string | undefined;
    await accessService.validateMfa(req.user!.id, mfaCode);
    await accessService.revokeToken(id as string);
    logger.debug({ id }, 'AccessController: revokeToken success');
    res
      .status(200)
      .json(
        new ApiResponse(200, { success: true }, 'Token revoked successfully'),
      );
  },
);
export const listMfaRequests: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listMfaRequests start');
    const { status } = req.query as { status?: string };
    const appId = req.headers['x-app-id'] as string | undefined;
    const requests = await accessService.listMfaRequests(status, appId);
    res
      .status(200)
      .json(new ApiResponse(200, requests, 'MFA requests listed successfully'));
  },
);
export const approveMfaResetRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: approveMfaResetRequest start');
    const result = await accessService.approveMfaResetRequest(
      id as string,
      req.user!.id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, 'MFA reset request approved'));
  },
);
export const rejectMfaResetRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info({ id }, 'AccessController: rejectMfaResetRequest start');
    const result = await accessService.rejectMfaResetRequest(
      id as string,
      req.user!.id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, 'MFA reset request rejected'));
  },
);
