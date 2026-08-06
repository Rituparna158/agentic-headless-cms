import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { users, userRoles, roles, permissions } from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class AuthRepository {
  async getUserByEmail(email: string) {
    try {
      logger.info({ email }, 'AuthRepository: fetching user by email');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      logger.debug(
        { found: !!result[0] },
        'AuthRepository: getUserByEmail complete',
      );
      return result[0] || null;
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in getUserByEmail:');
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async getUserByInviteTokenHash(hash: string) {
    try {
      logger.info('AuthRepository: fetching user by invite token hash');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.inviteTokenHash, hash))
        .limit(1);
      logger.debug(
        { found: !!result[0] },
        'AuthRepository: getUserByInviteTokenHash complete',
      );
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getUserByInviteTokenHash:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async activateUser(userId: string, passwordHash: string) {
    try {
      logger.info({ userId }, 'AuthRepository: activating user');
      const db = getDatabaseAdapter().getDb();
      await db
        .update(users)
        .set({
          passwordHash,
          status: 'active',
          inviteTokenHash: null,
          inviteExpiresAt: null,
        })
        .where(eq(users.id, userId));
      logger.debug({ userId }, 'AuthRepository: activateUser complete');
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in activateUser:');
      throw new ApiError(500, REPO_ERRORS.ACTIVATE_USER_FAILED);
    }
  }

  async getUserRoles(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: fetching user roles');
      const db = getDatabaseAdapter().getDb();
      const rows = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      const roleNames = rows.map((r: { roleName: string }) => r.roleName);
      logger.debug(
        { userId, roles: roleNames },
        'AuthRepository: getUserRoles complete',
      );
      return roleNames;
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in getUserRoles:');
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_ROLES_FAILED);
    }
  }

  async getUserPermissions(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: fetching user permissions');
      const db = getDatabaseAdapter().getDb();
      const rows = await db
        .select({
          action: permissions.action,
          effect: permissions.effect,
          schemaId: permissions.schemaId,
          fields: permissions.fields,
          condition: permissions.condition,
        })
        .from(userRoles)
        .innerJoin(permissions, eq(userRoles.roleId, permissions.roleId))
        .where(eq(userRoles.userId, userId));

      logger.debug(
        { userId, permissionsCount: rows.length },
        'AuthRepository: getUserPermissions complete',
      );
      return rows;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getUserPermissions:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_PERMISSIONS_FAILED);
    }
  }
}

export const authRepository = new AuthRepository();
