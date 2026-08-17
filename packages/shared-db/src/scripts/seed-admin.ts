import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  users,
  roles,
  userRoles,
  permissions,
  userApplications,
} from '../index.js';
import { logger } from '@repo/logger';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function seedAdmin() {
  logger.info('Starting admin seeding process...');
  if (!process.env.DATABASE_URL) {
    logger.error('CRITICAL: DATABASE_URL environment variable is required.');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const isDevOrTest =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ||
    (isDevOrTest ? 'admin@agentic-cms.com' : null);
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || (isDevOrTest ? 'admin' : null);

  const cmsAdminEmail =
    process.env.SEED_CMS_ADMIN_EMAIL ||
    (isDevOrTest ? 'cms-admin@agentic-cms.com' : null);
  const cmsAdminPassword =
    process.env.SEED_CMS_ADMIN_PASSWORD || (isDevOrTest ? 'admin' : null);

  if (!adminEmail || !adminPassword || !cmsAdminEmail || !cmsAdminPassword) {
    logger.error(
      'CRITICAL: Admin environment variables are required in production.',
    );
    process.exit(1);
  }

  try {
    // Create admin role
    let roleId: string;
    const existingRole = await db
      .select()
      .from(roles)
      .where(
        and(eq(roles.name, 'admin'), eq(roles.application, 'HEADLESS_CMS')),
      )
      .limit(1);

    if (existingRole.length > 0) {
      roleId = existingRole[0]!.id;
      logger.info({ roleId }, 'Admin role already exists.');
    } else {
      const newRole = await db
        .insert(roles)
        .values({
          name: 'admin',
          application: 'HEADLESS_CMS',
          description: 'Super administrator with full access',
        })
        .returning({ id: roles.id });

      roleId = newRole[0]!.id;
      logger.info({ roleId }, 'Created new Admin role.');

      // Add wildcard permission
      await db.insert(permissions).values({
        roleId,
        action: '*',
        effect: 'allow',
      });
      logger.info('Granted wildcard (*) permission to Admin role.');
    }

    // Create admin user
    let userId: string;
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0]!.id;
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

      userId = newUser[0]!.id;
      logger.info(
        { userId, email: adminEmail, password: adminPassword },
        'Created new Admin user. PLEASE CHANGE PASSWORD AFTER LOGIN.',
      );
    }

    // Link user to role via user_applications
    let userAppId: string;
    const existingUserApp = await db
      .select()
      .from(userApplications)
      .where(
        and(
          eq(userApplications.userId, userId),
          eq(userApplications.application, 'HEADLESS_CMS'),
        ),
      )
      .limit(1);

    if (existingUserApp.length > 0) {
      userAppId = existingUserApp[0]!.id;
    } else {
      const newUserApp = await db
        .insert(userApplications)
        .values({
          userId,
          application: 'HEADLESS_CMS',
          status: 'active',
        })
        .returning({ id: userApplications.id });
      userAppId = newUserApp[0]!.id;
    }

    const existingUserRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userApplicationId, userAppId))
      .limit(1);

    if (existingUserRole.length === 0) {
      await db.insert(userRoles).values({
        userApplicationId: userAppId,
        roleId,
      });
      logger.info('Linked Admin user to HEADLESS_CMS Admin role.');
    }

    // --- PROVISION CMS_UI ACCESS ---
    let cmsUiRoleId: string;
    const existingCmsUiRole = await db
      .select()
      .from(roles)
      .where(
        and(eq(roles.name, 'System Admin'), eq(roles.application, 'CMS_UI')),
      )
      .limit(1);

    if (existingCmsUiRole.length > 0) {
      cmsUiRoleId = existingCmsUiRole[0]!.id;
      logger.info(
        { roleId: cmsUiRoleId },
        'CMS_UI System Admin role already exists.',
      );
    } else {
      const newRole = await db
        .insert(roles)
        .values({
          name: 'System Admin',
          application: 'CMS_UI',
          description: 'Super administrator with full access to CMS UI',
        })
        .returning({ id: roles.id });

      cmsUiRoleId = newRole[0]!.id;
      logger.info(
        { roleId: cmsUiRoleId },
        'Created new CMS_UI System Admin role.',
      );

      // Add wildcard permission
      await db.insert(permissions).values({
        roleId: cmsUiRoleId,
        action: '*',
        effect: 'allow',
      });
      logger.info('Granted wildcard (*) permission to CMS_UI Admin role.');
    }

    // Create admin user for CMS_UI
    let cmsUserId: string;
    const existingCmsUser = await db
      .select()
      .from(users)
      .where(eq(users.email, cmsAdminEmail))
      .limit(1);

    if (existingCmsUser.length > 0) {
      cmsUserId = existingCmsUser[0]!.id;
      logger.info(
        { userId: cmsUserId },
        'CMS_UI Admin user already exists. Checking roles...',
      );
    } else {
      const passwordHash = await bcrypt.hash(cmsAdminPassword, 10);
      const newUser = await db
        .insert(users)
        .values({
          email: cmsAdminEmail,
          firstName: 'System',
          lastName: 'Admin',
          passwordHash,
          status: 'active',
        })
        .returning({ id: users.id });

      cmsUserId = newUser[0]!.id;
      logger.info(
        { userId: cmsUserId, email: cmsAdminEmail, password: cmsAdminPassword },
        'Created new CMS_UI Admin user. PLEASE CHANGE PASSWORD AFTER LOGIN.',
      );
    }

    // Link user to role via user_applications for CMS_UI
    let userAppIdCmsUi: string;
    const existingUserAppCmsUi = await db
      .select()
      .from(userApplications)
      .where(
        and(
          eq(userApplications.userId, cmsUserId),
          eq(userApplications.application, 'CMS_UI'),
        ),
      )
      .limit(1);

    if (existingUserAppCmsUi.length > 0) {
      userAppIdCmsUi = existingUserAppCmsUi[0]!.id;
    } else {
      const newUserApp = await db
        .insert(userApplications)
        .values({
          userId: cmsUserId,
          application: 'CMS_UI',
          status: 'active',
        })
        .returning({ id: userApplications.id });
      userAppIdCmsUi = newUserApp[0]!.id;
    }

    const existingUserRoleCmsUi = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userApplicationId, userAppIdCmsUi))
      .limit(1);

    if (existingUserRoleCmsUi.length === 0) {
      await db.insert(userRoles).values({
        userApplicationId: userAppIdCmsUi,
        roleId: cmsUiRoleId,
      });
      logger.info('Linked Admin user to CMS_UI Admin role.');
    }

    logger.info('Admin seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed admin');
    process.exit(1);
  }
}

void seedAdmin();
