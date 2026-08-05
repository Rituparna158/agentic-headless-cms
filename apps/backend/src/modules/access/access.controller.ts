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

const accessService = new AccessService();

export const listRoles: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listRoles start');
    const roles = await accessService.listRoles();
    logger.debug(
      { count: roles.length },
      'AccessController: listRoles success',
    );
    res
      .status(200)
      .json(new ApiResponse(200, roles, 'Roles listed successfully'));
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
      description?: string;
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
    const users = await accessService.listUsers();
    logger.debug(
      { count: users.length },
      'AccessController: listUsers success',
    );
    res
      .status(200)
      .json(new ApiResponse(200, users, 'Users listed successfully'));
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

    const { inviteUrl, user } = await accessService.inviteUser(
      email,
      firstName,
      lastName,
      roleId,
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

export const listTokens: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('AccessController: listTokens start');
    const tokens = await accessService.listTokens();
    logger.debug(
      { count: tokens.length },
      'AccessController: listTokens success',
    );
    res
      .status(200)
      .json(new ApiResponse(200, tokens, 'Tokens listed successfully'));
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
    await accessService.revokeToken(id as string);
    logger.debug({ id }, 'AccessController: revokeToken success');
    res
      .status(200)
      .json(
        new ApiResponse(200, { success: true }, 'Token revoked successfully'),
      );
  },
);
