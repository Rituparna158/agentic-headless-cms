import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';
import { authRepository } from '@repo/repository';
import type { LoginInput } from '@repo/types';
import { UnauthorizedError, ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export class AuthService {
  async login(input: LoginInput) {
    try {
      logger.info({ email: input.email }, 'AuthService: login start');
      const user = await authRepository.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        logger.warn(
          { email: input.email },
          'AuthService: user not found or has no password',
        );
        throw new UnauthorizedError('Invalid email or password');
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        logger.warn({ email: input.email }, 'AuthService: password mismatch');
        throw new UnauthorizedError('Invalid email or password');
      }

      logger.debug({ userId: user.id }, 'AuthService: fetching user roles');
      const roles = await authRepository.getUserRoles(user.id);

      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      };

      logger.debug({ userId: user.id }, 'AuthService: signing JWT token');
      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      logger.debug(
        { userId: user.id },
        'AuthService: login successful, emitting audit log',
      );
      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.LOGIN,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: null,
        afterState: { email: user.email },
        context,
      });

      return {
        user: payload,
        token,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in login:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.LOGIN_FAILED);
    }
  }

  async getUserPermissions(userId: string) {
    try {
      logger.info({ userId }, 'AuthService: getUserPermissions start');
      const result = await authRepository.getUserPermissions(userId);
      logger.debug({ userId }, 'AuthService: getUserPermissions end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in getUserPermissions:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_USER_PROFILE_FAILED);
    }
  }

  async acceptInvite(rawToken: string, newPassword: string) {
    try {
      logger.info('AuthService: acceptInvite start');
      const inviteTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      logger.debug('AuthService: fetching user by invite token hash');
      const user =
        await authRepository.getUserByInviteTokenHash(inviteTokenHash);

      if (!user) {
        logger.warn('AuthService: user not found by token hash');
        throw new UnauthorizedError('Invalid or expired invitation token');
      }

      if (user.status !== 'invited') {
        logger.warn({ userId: user.id }, 'AuthService: user already active');
        throw new UnauthorizedError('User is already active');
      }

      if (user.inviteExpiresAt && new Date() > user.inviteExpiresAt) {
        logger.warn(
          { userId: user.id },
          'AuthService: invitation token expired',
        );
        throw new UnauthorizedError('Invitation token has expired');
      }

      logger.debug({ userId: user.id }, 'AuthService: hashing new password');
      const passwordHash = await bcrypt.hash(newPassword, 10);

      logger.debug({ userId: user.id }, 'AuthService: activating user');
      await authRepository.activateUser(user.id, passwordHash);

      logger.debug(
        { userId: user.id },
        'AuthService: acceptInvite successful, emitting audit log',
      );
      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: { status: 'invited' },
        afterState: { status: 'active' },
        context,
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in acceptInvite:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.ACTIVATE_ACCOUNT_FAILED);
    }
  }
}

export const authService = new AuthService();
