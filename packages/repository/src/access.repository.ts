import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  roles,
  permissions,
  users,
  apiTokens,
  userRoles,
  withTransaction,
  RecordNotFoundError,
} from '@repo/shared-db';
import type { PermissionData } from '@repo/types';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class AccessRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async listRoles() {
    try {
      logger.info('AccessRepository: listing roles');
      const allRoles = await this.db.select().from(roles);
      const allPermissions = await this.db.select().from(permissions);

      logger.debug(
        { roleCount: allRoles.length },
        'AccessRepository: listRoles complete',
      );
      return allRoles.map((role) => ({
        ...role,
        permissions: allPermissions.filter((p) => p.roleId === role.id),
      }));
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

  async listUsers() {
    try {
      logger.info('AccessRepository: listing users');
      const allUsers = await this.db.select().from(users);
      logger.debug(
        { userCount: allUsers.length },
        'AccessRepository: listUsers complete',
      );
      return allUsers;
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in listUsers:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
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
      await this.db.insert(userRoles).values({ userId, roleId });
      logger.debug('AccessRepository: assignUserRole complete');
    } catch (error) {
      logger.error({ err: error }, 'AccessRepository Error in assignUserRole:');
      throw new ApiError(500, REPO_ERRORS.DB_INSERT_FAILED);
    }
  }

  async listTokens() {
    try {
      logger.info('AccessRepository: listing API tokens');
      const tokens = await this.db.select().from(apiTokens);
      logger.debug(
        { tokenCount: tokens.length },
        'AccessRepository: listTokens complete',
      );
      return tokens;
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
