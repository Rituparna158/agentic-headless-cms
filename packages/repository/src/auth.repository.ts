import { eq, ne, and, inArray, sql, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  users,
  userRoles,
  userApplications,
  roles,
  permissions,
  mfaResetRequests,
  mfaResetRequestStatusEnum,
  passwordResetRequests,
  userIdentities,
  applications,
  withTransaction,
  buildPaginationOptions,
} from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import type { BaseQueryOptions } from '@repo/types';
import { REPO_ERRORS } from './error-constants.js';
export class AuthRepository {
  async getUserByEmail(email: string) {
    try {
      logger.info({ email }, 'AuthRepository: fetching user by email');
      const db = getDatabaseAdapter().getDb();
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .select()
          .from(users)
          .where(eq(users.inviteTokenHash, hash))
          .limit(1);
      });
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
      await withTransaction(db, async (tx) => {
        return await tx
          .update(users)
          .set({
            passwordHash,
            status: 'active',
            inviteTokenHash: null,
            inviteExpiresAt: null,
          })
          .where(eq(users.id, userId));
      });
      logger.debug({ userId }, 'AuthRepository: activateUser complete');
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in activateUser:');
      throw new ApiError(500, REPO_ERRORS.ACTIVATE_USER_FAILED);
    }
  }
  async getUserRoles(userId: string, appId: string) {
    try {
      logger.info({ userId, appId }, 'AuthRepository: fetching user roles');
      const db = getDatabaseAdapter().getDb();
      const rows = await withTransaction(db, async (tx) => {
        return await tx
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(
            userApplications,
            eq(userRoles.userApplicationId, userApplications.id),
          )
          .innerJoin(
            applications,
            eq(userApplications.applicationId, applications.id),
          )
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(
            and(
              eq(userApplications.userId, userId),
              eq(userApplications.status, 'active'),
              eq(applications.name, appId),
            ),
          );
      });
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
  async getUserPermissions(userId: string, appId: string) {
    try {
      logger.info(
        { userId, appId },
        'AuthRepository: fetching user permissions',
      );
      const db = getDatabaseAdapter().getDb();
      const rows = await withTransaction(db, async (tx) => {
        return await tx
          .select({
            action: permissions.action,
            effect: permissions.effect,
            schemaId: permissions.schemaId,
            fields: permissions.fields,
            condition: permissions.condition,
          })
          .from(userRoles)
          .innerJoin(
            userApplications,
            eq(userRoles.userApplicationId, userApplications.id),
          )
          .innerJoin(
            applications,
            eq(userApplications.applicationId, applications.id),
          )
          .innerJoin(permissions, eq(userRoles.roleId, permissions.roleId))
          .where(
            and(
              eq(userApplications.userId, userId),
              eq(userApplications.status, 'active'),
              eq(applications.name, appId),
            ),
          );
      });
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
  async getUserRolesWithMfaInfo(userId: string, appId: string) {
    try {
      logger.info(
        { userId, appId },
        'AuthRepository: fetching user roles with mfa info',
      );
      const db = getDatabaseAdapter().getDb();
      const rows = await withTransaction(db, async (tx) => {
        return await tx
          .select({
            id: roles.id,
            name: roles.name,
            mfaRequired: roles.mfaRequired,
          })
          .from(userRoles)
          .innerJoin(
            userApplications,
            eq(userRoles.userApplicationId, userApplications.id),
          )
          .innerJoin(
            applications,
            eq(userApplications.applicationId, applications.id),
          )
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(
            and(
              eq(userApplications.userId, userId),
              eq(userApplications.status, 'active'),
              eq(applications.name, appId),
            ),
          );
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, id)).limit(1);
      });
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
      await withTransaction(db, async (tx) => {
        return await tx
          .update(users)
          .set({ mfaSecret: secret, mfaEnabled: false }) // Disable MFA until verified
          .where(eq(users.id, userId));
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in updateMfaSecret:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
  async enableMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: enabling MFA for user');
      const db = getDatabaseAdapter().getDb();
      await withTransaction(db, async (tx) => {
        return await tx
          .update(users)
          .set({ mfaEnabled: true })
          .where(eq(users.id, userId));
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in enableMfa:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
  async disableMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthRepository: disabling MFA for user');
      const db = getDatabaseAdapter().getDb();
      await withTransaction(db, async (tx) => {
        return await tx
          .update(users)
          .set({ mfaEnabled: false, mfaSecret: null })
          .where(eq(users.id, userId));
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in disableMfa:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
  async createMfaResetRequest(userId: string, sourceApp?: string) {
    try {
      logger.info({ userId }, 'AuthRepository: creating MFA reset request');
      const db = getDatabaseAdapter().getDb();
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .insert(mfaResetRequests)
          .values({ userId, sourceApp })
          .returning();
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .select()
          .from(mfaResetRequests)
          .where(eq(mfaResetRequests.id, id))
          .limit(1);
      });
      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in getMfaResetRequestById:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_USER_FAILED); // or custom error
    }
  }
  async getAllMfaResetRequests(
    appId?: string,
    statusFilter?: string,
    options: BaseQueryOptions = {},
  ) {
    try {
      logger.info({ appId }, 'AuthRepository: fetching MFA reset requests');
      const db = getDatabaseAdapter().getDb();
      let whereClause: import('drizzle-orm').SQL | undefined;
      if (statusFilter === 'history') {
        whereClause = ne(mfaResetRequests.status, 'pending');
      } else if (statusFilter) {
        whereClause = eq(
          mfaResetRequests.status,
          statusFilter as (typeof mfaResetRequestStatusEnum)['enumValues'][number],
        );
      }
      // If an appId is provided, restrict to users who belong to this application
      if (appId) {
        const appUserIds = await withTransaction(db, async (tx) => {
          return await tx
            .select({ userId: userApplications.userId })
            .from(userApplications)
            .innerJoin(
              applications,
              eq(userApplications.applicationId, applications.id),
            )
            .where(eq(applications.name, appId));
        });
        const ids = appUserIds.map((r) => r.userId);
        if (ids.length === 0) return [[], 0] as const;
        const appFilter = inArray(mfaResetRequests.userId, ids);
        whereClause = whereClause ? and(whereClause, appFilter) : appFilter;
      }
      const {
        limit,
        offset,
        orderBy,
        where: searchWhere,
      } = buildPaginationOptions(
        options,
        {
          createdAt: mfaResetRequests.createdAt,
          status: mfaResetRequests.status,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        [users.email, users.firstName, users.lastName],
      );
      const finalWhere = searchWhere
        ? whereClause
          ? and(whereClause, searchWhere)
          : searchWhere
        : whereClause;
      const adminUser = alias(users, 'admin_user');
      const result = await withTransaction(db, async (tx) => {
        const rows = await tx
          .select({
            ...getTableColumns(mfaResetRequests),
            user: getTableColumns(users),
            admin: getTableColumns(adminUser),
          })
          .from(mfaResetRequests)
          .innerJoin(users, eq(mfaResetRequests.userId, users.id))
          .leftJoin(adminUser, eq(mfaResetRequests.adminId, adminUser.id))
          .where(finalWhere)
          .orderBy(...orderBy)
          .limit(limit)
          .offset(offset);
        const countResult = await tx
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(mfaResetRequests)
          .innerJoin(users, eq(mfaResetRequests.userId, users.id))
          .leftJoin(adminUser, eq(mfaResetRequests.adminId, adminUser.id))
          .where(finalWhere);
        return [rows, countResult[0]?.count ?? 0] as const;
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .select()
          .from(mfaResetRequests)
          .where(eq(mfaResetRequests.tokenHash, hash))
          .limit(1);
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .update(mfaResetRequests)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(mfaResetRequests.id, id))
          .returning();
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .insert(passwordResetRequests)
          .values({ userId, tokenHash, expiresAt })
          .returning();
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .select()
          .from(passwordResetRequests)
          .where(eq(passwordResetRequests.tokenHash, hash))
          .limit(1);
      });
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
      const result = await withTransaction(db, async (tx) => {
        return await tx
          .update(passwordResetRequests)
          .set({ usedAt, updatedAt: new Date() })
          .where(eq(passwordResetRequests.id, id))
          .returning();
      });
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
      await withTransaction(db, async (tx) => {
        return await tx
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, userId));
      });
    } catch (error) {
      logger.error(
        { err: error },
        'AuthRepository Error in updateUserPassword:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
  async linkUserIdentity(
    userId: string,
    provider: string,
    providerUserId: string,
  ) {
    try {
      logger.info(
        { userId, provider },
        'AuthRepository: linking user identity',
      );
      const db = getDatabaseAdapter().getDb();
      await withTransaction(db, async (tx) => {
        return await tx
          .insert(userIdentities)
          .values({
            userId,
            provider,
            providerUserId,
          })
          .onConflictDoNothing({
            target: [userIdentities.provider, userIdentities.providerUserId],
          });
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthRepository Error in linkUserIdentity:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
}
export const authRepository = new AuthRepository();
