import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '../../config/database.js';
import { users, userRoles, roles, permissions } from '@repo/shared-db';

export class AuthRepository {
  async getUserByEmail(email: string) {
    const db = getDatabaseAdapter().getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  }

  async getUserByInviteTokenHash(hash: string) {
    const db = getDatabaseAdapter().getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.inviteTokenHash, hash))
      .limit(1);
    return result[0] || null;
  }

  async activateUser(userId: string, passwordHash: string) {
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
  }

  async getUserRoles(userId: string) {
    const db = getDatabaseAdapter().getDb();
    const rows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((r: { roleName: string }) => r.roleName);
  }

  async getUserPermissions(userId: string) {
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
    return rows;
  }
}

export const authRepository = new AuthRepository();
