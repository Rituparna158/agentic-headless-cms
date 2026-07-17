import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '../../config/database.js';
import {
  roles,
  permissions,
  users,
  apiTokens,
  userRoles,
  withTransaction,
  RecordNotFoundError,
} from '@repo/shared-db';
import { PermissionData } from '../../types/access.types.js';

export class AccessRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async listRoles() {
    const allRoles = await this.db.select().from(roles);
    const allPermissions = await this.db.select().from(permissions);

    return allRoles.map((role) => ({
      ...role,
      permissions: allPermissions.filter((p) => p.roleId === role.id),
    }));
  }

  async getRoleById(id: string) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    if (!role) return null;

    const rolePermissions = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.roleId, id));

    return { ...role, permissions: rolePermissions };
  }

  async createRole(
    data: { name: string; description?: string | null; isSystem?: boolean },
    perms: PermissionData[],
  ) {
    return withTransaction(this.db, async (tx) => {
      const [role] = await tx.insert(roles).values(data).returning();
      if (!role) throw new Error('Failed to create role');

      let rolePermissions: unknown[] = [];
      if (perms && perms.length > 0) {
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

      return { ...role, permissions: rolePermissions };
    });
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string | null },
    perms?: PermissionData[],
  ) {
    return withTransaction(this.db, async (tx) => {
      if (data && Object.keys(data).length > 0) {
        await tx.update(roles).set(data).where(eq(roles.id, id));
      }

      let rolePermissions: unknown[] = [];
      if (perms !== undefined) {
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
      return { ...updatedRole, permissions: rolePermissions };
    });
  }

  async deleteRole(id: string) {
    const [deleted] = await this.db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning({ id: roles.id });
    if (!deleted) throw new RecordNotFoundError('Role not found');
    return deleted;
  }

  async listUsers() {
    return this.db.select().from(users);
  }

  async getUserByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async createUser(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'invited' | 'active' | 'suspended';
    inviteTokenHash?: string;
    inviteExpiresAt?: Date;
  }) {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async assignUserRole(userId: string, roleId: string) {
    await this.db.insert(userRoles).values({ userId, roleId });
  }

  async listTokens() {
    return this.db.select().from(apiTokens);
  }

  async createToken(data: {
    name: string;
    type?: 'user' | 'agent';
    tokenHash: string;
    roleId?: string;
    createdBy?: string;
    scopes?: unknown;
  }) {
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
    return token;
  }

  async revokeToken(id: string) {
    const [revoked] = await this.db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(eq(apiTokens.id, id))
      .returning();
    if (!revoked) throw new RecordNotFoundError('Token not found');
    return revoked;
  }
}
