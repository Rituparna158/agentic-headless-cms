import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '../config/database.js';
import { users, roles, userRoles, permissions } from '@repo/shared-db';
import { logger } from '../common/logger.js';

async function seedAdmin() {
  logger.info('Starting admin seeding process...');
  const db = getDatabaseAdapter().getDb();

  // Use environment variables for secure provisioning, with fallback only in development
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ||
    (process.env.NODE_ENV === 'development' ? 'admin@agentic-cms.com' : null);
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'development' ? 'admin' : null);

  if (!adminEmail || !adminPassword) {
    logger.error(
      'CRITICAL: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are required in production.',
    );
    process.exit(1);
  }

  try {
    // 1. Create or get Admin Role
    let roleId: string;
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'admin'))
      .limit(1);

    if (existingRole.length > 0) {
      roleId = existingRole[0].id;
      logger.info({ roleId }, 'Admin role already exists.');
    } else {
      const newRole = await db
        .insert(roles)
        .values({
          name: 'admin',
          description: 'Super administrator with full access',
        })
        .returning({ id: roles.id });

      roleId = newRole[0].id;
      logger.info({ roleId }, 'Created new Admin role.');

      // Add wildcard permission for the admin role
      await db.insert(permissions).values({
        roleId,
        action: '*',
        effect: 'allow',
      });
      logger.info('Granted wildcard (*) permission to Admin role.');
    }

    // 2. Create or get Admin User
    let userId: string;
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      logger.info({ userId }, 'Admin user already exists. Checking roles...');
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const newUser = await db
        .insert(users)
        .values({
          email: adminEmail,
          firstName: 'System',
          lastName: 'Administrator',
          passwordHash,
          status: 'active',
        })
        .returning({ id: users.id });

      userId = newUser[0].id;
      logger.info(
        { userId, email: adminEmail, password: adminPassword },
        'Created new Admin user. PLEASE CHANGE PASSWORD AFTER LOGIN.',
      );
    }

    // 3. Link User to Role
    const existingUserRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    if (existingUserRole.length === 0) {
      await db.insert(userRoles).values({
        userId,
        roleId,
      });
      logger.info('Linked Admin user to Admin role.');
    }

    logger.info('Admin seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed admin');
    process.exit(1);
  }
}

void seedAdmin();
