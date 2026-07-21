import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/shared-types';
import { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env.js';
import { PermissionData } from '../../types/access.types.js';
import {
  NotFoundError,
  BadRequestError,
} from '../../common/errors/http-error.js';
import { AccessService } from './access.service.js';

const accessService = new AccessService();

export const listRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = await accessService.listRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const getRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await accessService.getRole(req.params.id as string);
    if (!role) {
      throw new NotFoundError(ERROR_MESSAGES.ACCESS.ROLE_NOT_FOUND);
    }
    res.json(role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await accessService.createRole(
      req.body as {
        name: string;
        description?: string;
        isSystem?: boolean;
        permissions?: PermissionData[];
      },
    );
    res.status(HTTP_STATUS.CREATED).json(role);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await accessService.updateRole(
      req.params.id as string,
      req.body as {
        name?: string;
        description?: string;
        permissions?: PermissionData[];
      },
    );
    res.json(role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await accessService.deleteRole(req.params.id as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await accessService.listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as {
      email: string;
      firstName?: string;
      lastName?: string;
      roleId: string;
    };
    const { email, firstName, lastName, roleId } = body;

    if (!email || !roleId) {
      throw new BadRequestError(ERROR_MESSAGES.ACCESS.EMAIL_AND_ROLE_REQUIRED);
    }

    const { inviteUrl, user } = await accessService.inviteUser(
      email,
      firstName,
      lastName,
      roleId,
    );

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Invitation sent',
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
      // In development, return the inviteUrl testing
      inviteUrl: env.NODE_ENV !== 'production' ? inviteUrl : undefined,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const listTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tokens = await accessService.listTokens();
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const createToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = await accessService.createToken(
      req.body as {
        name: string;
        type?: 'user' | 'agent';
        roleId?: string;
        scopes?: unknown;
      },
      req.user!.id,
    );
    res.status(HTTP_STATUS.CREATED).json(token);
  } catch (error) {
    next(error);
  }
};

export const revokeToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await accessService.revokeToken(req.params.id as string);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
