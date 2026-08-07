import { eq, ne } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  users,
  userRoles,
  roles,
  permissions,
  mfaResetRequests,
  passwordResetRequests,
} from '@repo/shared-db';
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

  async getUserRolesWithMfaInfo(userId: string) {
    try {
      logger.info(
        { userId },
        'AuthRepository: fetching user roles with mfa info',
      );
      const db = getDatabaseAdapter().getDb();
      const rows = await db
        .select({
          id: roles.id,
          name: roles.name,
          mfaRequired: roles.mfaRequired,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      logger.debug(
        { userId, roles: rows },
        'AuthRepository: getUserRolesWithMfaInfo complete',
      );
      return rows;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getUserRolesWithMfaInfo:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_ROLES_FAILED);
    }
  }

  async getUserById(id: string) {
    try {
      logger.info({ id }, 'AuthRepository: fetching user by ID');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in getUserById:');
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async updateMfaSecret(userId: string, secret: string | null) {
    try {
      logger.info({ userId }, 'AuthRepository: updating user MFA secret');
      const db = getDatabaseAdapter().getDb();
      await db
        .update(users)
        .set({ mfaSecret: secret, mfaEnabled: false }) // Disable MFA until verified
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in updateMfaSecret:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async enableMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: enabling MFA for user');
      const db = getDatabaseAdapter().getDb();
      await db
        .update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in enableMfa:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async disableMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: disabling MFA for user');
      const db = getDatabaseAdapter().getDb();
      await db
        .update(users)
        .set({ mfaEnabled: false, mfaSecret: null })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in disableMfa:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async createMfaResetRequest(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: creating MFA reset request');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .insert(mfaResetRequests)
        .values({ userId })
        .returning();
      return result[0];
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in createMfaResetRequest:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async getMfaResetRequestById(id: string) {
    try {
      logger.info({ id }, 'AuthRepository: fetching MFA reset request by ID');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(mfaResetRequests)
        .where(eq(mfaResetRequests.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getMfaResetRequestById:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED); // or custom error
    }
  }

  async getAllMfaResetRequests(statusFilter?: string) {
    try {
      logger.info('AuthRepository: fetching MFA reset requests');
      const db = getDatabaseAdapter().getDb();
      let whereClause;
      if (statusFilter === 'history') {
        whereClause = ne(mfaResetRequests.status, 'pending');
      } else if (statusFilter) {
        whereClause = eq(mfaResetRequests.status, statusFilter as 'pending');
      }

      const result = await db.query.mfaResetRequests.findMany({
        where: whereClause,
        with: {
          user: true,
          admin: true,
        },
        orderBy: (mfaResetRequests, { desc }) => [
          desc(mfaResetRequests.createdAt),
        ],
      });

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getAllMfaResetRequests:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async getMfaResetRequestByTokenHash(hash: string) {
    try {
      logger.info('AuthRepository: fetching MFA reset request by token hash');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(mfaResetRequests)
        .where(eq(mfaResetRequests.tokenHash, hash))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getMfaResetRequestByTokenHash:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async updateMfaResetRequest(
    id: string,
    data: {
      status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
      adminId?: string;
      tokenHash?: string;
      expiresAt?: Date;
    },
  ) {
    try {
      logger.info({ id }, 'AuthRepository: updating MFA reset request');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .update(mfaResetRequests)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(mfaResetRequests.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in updateMfaResetRequest:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async createPasswordResetRequest(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    try {
      logger.info(
        { userId },
        'AuthRepository: creating password reset request',
      );
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .insert(passwordResetRequests)
        .values({ userId, tokenHash, expiresAt })
        .returning();
      return result[0];
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in createPasswordResetRequest:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async getPasswordResetRequestByTokenHash(hash: string) {
    try {
      logger.info('AuthRepository: fetching password reset request by hash');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .select()
        .from(passwordResetRequests)
        .where(eq(passwordResetRequests.tokenHash, hash))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getPasswordResetRequestByTokenHash:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED);
    }
  }

  async updatePasswordResetRequest(id: string, usedAt: Date) {
    try {
      logger.info({ id }, 'AuthRepository: updating password reset request');
      const db = getDatabaseAdapter().getDb();
      const result = await db
        .update(passwordResetRequests)
        .set({ usedAt, updatedAt: new Date() })
        .where(eq(passwordResetRequests.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in updatePasswordResetRequest:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    try {
      logger.info({ userId }, 'AuthRepository: updating user password');
      const db = getDatabaseAdapter().getDb();
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in updateUserPassword:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
}

export const authRepository = new AuthRepository();
