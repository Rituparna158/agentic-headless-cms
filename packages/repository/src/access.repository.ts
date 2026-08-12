import { eq, and, sql } from 'drizzle-orm';
import type { BaseQueryOptions } from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  roles,
  permissions,
  users,
  apiTokens,
  userRoles,
  userApplications,
  withTransaction,
  RecordNotFoundError,
  buildPaginationOptions,
} from '@repo/shared-db';
import type { PermissionData } from '@repo/types';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class AccessRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async listRoles(options: BaseQueryOptions = {}) {
    try {
      logger.info('AccessRepository: listing roles');

      const { limit, offset, orderBy, where } = buildPaginationOptions(
        options,
        {
          id: roles.id,
          name: roles.name,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        },
        [roles.name, roles.description],
      );

      const allRoles = await this.db
        .select()
        .from(roles)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(...orderBy);

      const countResult = await this.db
        .select({ count: sql<number>`cast(count(${roles.id}) as integer)` })
        .from(roles)
        .where(where);
      const total = countResult[0]?.count ?? 0;

      const allPermissions = await this.db.select().from(permissions);

      logger.debug(
        { roleCount: allRoles.length, total },
        'AccessRepository: listRoles complete',
      );

      const data = allRoles.map((role) => ({
        ...role,
        permissions: allPermissions.filter((p) => p.roleId === role.id),
      }));

      return [data, total] as const;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in listRoles:');
      throw new ApiError(500, REPO_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async getRoleById(id: string) {
    try {
      logger.info({ id }, 'AccessRepository: fetching role by ID');
      const [role] = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
      if (!role) {
        logger.debug({ id }, 'AccessRepository: role not found');
        return null;
      }

      const rolePermissions = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.roleId, id));

      logger.debug(
        { id, permissionsCount: rolePermissions.length },
        'AccessRepository: getRoleById complete',
      );
      return { ...role, permissions: rolePermissions };
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in getRoleById:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async createRole(
    data: {
      name: string;
      application: 'HEADLESS_CMS' | 'CMS_UI';
      description?: string | null;
      isSystem?: boolean;
      mfaRequired?: boolean;
    },
    perms: PermissionData[],
  ) {
    try {
      logger.info({ name: data.name }, 'AccessRepository: creating role');
      return await withTransaction(this.db, async (tx) => {
        const [role] = await tx.insert(roles).values(data).returning();
        if (!role) {
          logger.error('AccessRepository: failed to create role');
          throw new ApiError(500, REPO_ERRORS.CREATE_ROLE_FAILED);
        }

        let rolePermissions: unknown[] = [];
        if (perms && perms.length > 0) {
          logger.debug(
            { roleId: role.id, permsCount: perms.length },
            'AccessRepository: inserting permissions for role',
          );
          rolePermissions = await tx
            .insert(permissions)
            .values(
              perms.map((p) => ({
                roleId: role.id,
                schemaId: p.schemaId,
                action: p.action,
                effect: p.effect,
                fields: p.fields,
                condition: p.condition,
              })),
            )
            .returning();
        }

        logger.info(
          { roleId: role.id },
          'AccessRepository: createRole complete',
        );
        return { ...role, permissions: rolePermissions };
      });
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in createRole:');
      throw new ApiError(500, REPO_ERRORS.CREATE_ROLE_FAILED);
    }
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string | null; mfaRequired?: boolean },
    perms?: PermissionData[],
  ) {
    try {
      logger.info({ id }, 'AccessRepository: updating role');
      return await withTransaction(this.db, async (tx) => {
        if (data && Object.keys(data).length > 0) {
          logger.debug('AccessRepository: updating role fields');
          await tx.update(roles).set(data).where(eq(roles.id, id));
        }

        let rolePermissions: unknown[] = [];
        if (perms !== undefined) {
          logger.debug('AccessRepository: deleting and recreating permissions');
          await tx.delete(permissions).where(eq(permissions.roleId, id));
          if (perms.length > 0) {
            rolePermissions = await tx
              .insert(permissions)
              .values(
                perms.map((p) => ({
                  roleId: id,
                  schemaId: p.schemaId,
                  action: p.action,
                  effect: p.effect,
                  fields: p.fields,
                  condition: p.condition,
                })),
              )
              .returning();
          }
        } else {
          logger.debug('AccessRepository: fetching existing permissions');
          rolePermissions = await tx
            .select()
            .from(permissions)
            .where(eq(permissions.roleId, id));
        }

        const [updatedRole] = await tx
          .select()
          .from(roles)
          .where(eq(roles.id, id))
          .limit(1);

        logger.info({ id }, 'AccessRepository: updateRole complete');
        return { ...updatedRole, permissions: rolePermissions };
      });
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in updateRole:');
      throw new ApiError(500, REPO_ERRORS.UPDATE_ROLE_FAILED);
    }
  }

  async deleteRole(id: string) {
    try {
      logger.info({ id }, 'AccessRepository: deleting role');
      const [deleted] = await this.db
        .delete(roles)
        .where(eq(roles.id, id))
        .returning({ id: roles.id });
      if (!deleted) {
        logger.error({ id }, 'AccessRepository: role not found for deletion');
        throw new RecordNotFoundError('Role not found');
      }
      logger.info({ id }, 'AccessRepository: deleteRole complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in deleteRole:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DELETE_ROLE_FAILED);
    }
  }

  async listUsers(options: BaseQueryOptions = {}) {
    try {
      logger.info('AccessRepository: listing users');

      const { limit, offset, orderBy, where } = buildPaginationOptions(
        options,
        {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
          status: users.status,
        },
        [users.email, users.firstName, users.lastName],
      );

      const allUsers = await this.db
        .select()
        .from(users)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(...orderBy);

      const countResult = await this.db
        .select({ count: sql<number>`cast(count(${users.id}) as integer)` })
        .from(users)
        .where(where);
      const total = countResult[0]?.count ?? 0;

      const allUserApps = await this.db.select().from(userApplications);
      const allUserRoles = await this.db.select().from(userRoles);

      logger.debug(
        { userCount: allUsers.length, total },
        'AccessRepository: listUsers complete',
      );

      const data = allUsers.map((u) => {
        const userAppIds = allUserApps
          .filter((ua) => ua.userId === u.id)
          .map((ua) => ua.id);
        return {
          ...u,
          roleId:
            allUserRoles.find((ur) => userAppIds.includes(ur.userApplicationId))
              ?.roleId ?? null,
        };
      });

      return [data, total] as const;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in listUsers:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async deleteUser(id: string) {
    try {
      logger.info({ id }, 'AccessRepository: deleting user');
      await this.db
        .delete(userApplications)
        .where(eq(userApplications.userId, id));
      const [deleted] = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });
      if (!deleted) {
        throw new RecordNotFoundError('User not found');
      }
      logger.debug({ id }, 'AccessRepository: deleteUser complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in deleteUser:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DB_DELETE_FAILED);
    }
  }

  async updateUserRole(userId: string, roleId: string) {
    try {
      logger.info({ userId, roleId }, 'AccessRepository: updating user role');
      const [role] = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);
      if (!role) throw new ApiError(400, 'Role not found');

      let [userApp] = await this.db
        .select()
        .from(userApplications)
        .where(
          and(
            eq(userApplications.userId, userId),
            eq(userApplications.application, role.application),
          ),
        )
        .limit(1);

      if (!userApp) {
        const [newApp] = await this.db
          .insert(userApplications)
          .values({ userId, application: role.application, status: 'active' })
          .returning();
        userApp = newApp;
      }

      await this.db
        .delete(userRoles)
        .where(eq(userRoles.userApplicationId, userApp!.id));
      await this.db
        .insert(userRoles)
        .values({ userApplicationId: userApp!.id, roleId });
      logger.debug(
        { userId, roleId },
        'AccessRepository: updateUserRole complete',
      );
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in updateUserRole:');
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }

  async getUserByEmail(email: string) {
    try {
      logger.info({ email }, 'AccessRepository: fetching user by email');
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      logger.debug(
        { found: !!user },
        'AccessRepository: getUserByEmail complete',
      );
      return user;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in getUserByEmail:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async getAdminUsers() {
    try {
      logger.info('AccessRepository: fetching admin users');
      const adminUsers = await this.db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .innerJoin(userApplications, eq(users.id, userApplications.userId))
        .innerJoin(
          userRoles,
          eq(userApplications.id, userRoles.userApplicationId),
        )
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(eq(roles.name, 'admin'), eq(userApplications.status, 'active')),
        );

      return adminUsers;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in getAdminUsers:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async getUsersByRoleName(roleName: string) {
    try {
      logger.info(
        { roleName },
        'AccessRepository: fetching users by role name',
      );
      return await this.db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .innerJoin(userApplications, eq(users.id, userApplications.userId))
        .innerJoin(
          userRoles,
          eq(userApplications.id, userRoles.userApplicationId),
        )
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(eq(roles.name, roleName), eq(userApplications.status, 'active')),
        );
    } catch (error) {
      logger.error(
        { err: error },
        'AccessRepository Error in getUsersByRoleName:',
      );
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async createUser(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'invited' | 'active' | 'suspended';
    inviteTokenHash?: string;
    inviteExpiresAt?: Date;
  }) {
    try {
      logger.info({ email: data.email }, 'AccessRepository: creating user');
      const [user] = await this.db.insert(users).values(data).returning();
      logger.debug(
        { userId: user?.id },
        'AccessRepository: createUser complete',
      );
      return user;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in createUser:');
      throw new ApiError(500, REPO_ERRORS.DB_INSERT_FAILED);
    }
  }

  async assignUserRole(userId: string, roleId: string) {
    try {
      logger.info(
        { userId, roleId },
        'AccessRepository: assigning role to user',
      );
      const [role] = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);
      if (!role) throw new ApiError(400, 'Role not found');

      let [userApp] = await this.db
        .select()
        .from(userApplications)
        .where(
          and(
            eq(userApplications.userId, userId),
            eq(userApplications.application, role.application),
          ),
        )
        .limit(1);

      if (!userApp) {
        const [newApp] = await this.db
          .insert(userApplications)
          .values({ userId, application: role.application, status: 'active' })
          .returning();
        userApp = newApp;
      }

      await this.db
        .insert(userRoles)
        .values({ userApplicationId: userApp!.id, roleId });
      logger.debug('AccessRepository: assignUserRole complete');
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in assignUserRole:');
      throw new ApiError(500, REPO_ERRORS.DB_INSERT_FAILED);
    }
  }

  async listTokens(options: BaseQueryOptions = {}) {
    try {
      logger.info('AccessRepository: listing tokens');

      const { limit, offset, orderBy, where } = buildPaginationOptions(
        options,
        {
          id: apiTokens.id,
          name: apiTokens.name,
          createdAt: apiTokens.createdAt,
        },
        [apiTokens.name],
      );

      const allTokens = await this.db
        .select()
        .from(apiTokens)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(...orderBy);

      const countResult = await this.db
        .select({ count: sql<number>`cast(count(${apiTokens.id}) as integer)` })
        .from(apiTokens)
        .where(where);
      const total = countResult[0]?.count ?? 0;

      logger.debug(
        { tokenCount: allTokens.length, total },
        'AccessRepository: listTokens complete',
      );
      return [allTokens, total] as const;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in listTokens:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async createToken(data: {
    name: string;
    type?: 'user' | 'agent';
    tokenHash: string;
    roleId?: string;
    createdBy?: string;
    scopes?: unknown;
  }) {
    try {
      logger.info({ name: data.name }, 'AccessRepository: creating API token');
      const [token] = await this.db
        .insert(apiTokens)
        .values({
          name: data.name,
          type: data.type || 'user',
          tokenHash: data.tokenHash,
          roleId: data.roleId,
          createdBy: data.createdBy,
          scopes: data.scopes,
        })
        .returning();
      logger.debug(
        { tokenId: token?.id },
        'AccessRepository: createToken complete',
      );
      return token;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in createToken:');
      throw new ApiError(500, REPO_ERRORS.DB_INSERT_FAILED);
    }
  }

  async getTokenById(id: string) {
    try {
      logger.info({ id }, 'AccessRepository: fetching API token by ID');
      const [token] = await this.db
        .select()
        .from(apiTokens)
        .where(eq(apiTokens.id, id))
        .limit(1);
      logger.debug(
        { found: !!token },
        'AccessRepository: getTokenById complete',
      );
      return token;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in getTokenById:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async revokeToken(id: string) {
    try {
      logger.info({ id }, 'AccessRepository: revoking API token');
      const [revoked] = await this.db
        .update(apiTokens)
        .set({ revokedAt: new Date() })
        .where(eq(apiTokens.id, id))
        .returning();
      if (!revoked) {
        logger.error(
          { id },
          'AccessRepository: token not found for revocation',
        );
        throw new RecordNotFoundError('Token not found');
      }
      logger.info({ id }, 'AccessRepository: revokeToken complete');
      return revoked;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in revokeToken:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DB_UPDATE_FAILED);
    }
  }
}
