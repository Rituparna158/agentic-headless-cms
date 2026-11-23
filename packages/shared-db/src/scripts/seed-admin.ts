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
  applications,
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
  if (!adminEmail || !adminPassword) {
    logger.error(
      'CRITICAL: Admin environment variables are required in production.',
    );
    process.exit(1);
  }
  try {
    let headlessAppId: string;
    const existingHeadless = await db
      .select()
      .from(applications)
      .where(eq(applications.name, 'HEADLESS_CMS'))
      .limit(1);
    if (existingHeadless.length > 0) {
      headlessAppId = existingHeadless[0]!.id;
    } else {
      const newApp = await db
        .insert(applications)
        .values({ name: 'HEADLESS_CMS', apiKeyHash: 'seed_hash_headless' })
        .returning({ id: applications.id });
      headlessAppId = newApp[0]!.id;
    }

    let cmsUiAppId: string;
    const existingCmsUi = await db
      .select()
      .from(applications)
      .where(eq(applications.name, 'CMS_UI'))
      .limit(1);
    if (existingCmsUi.length > 0) {
      cmsUiAppId = existingCmsUi[0]!.id;
    } else {
      const newApp = await db
        .insert(applications)
        .values({
          name: 'CMS_UI',
          apiKeyHash: 'seed_hash_cms_ui',
          type: 'SYSTEM_DASHBOARD',
        })
        .returning({ id: applications.id });
      cmsUiAppId = newApp[0]!.id;
    }
    // Create admin role
    let roleId: string;
    const existingRole = await db
      .select()
      .from(roles)
      .where(
        and(eq(roles.name, 'admin'), eq(roles.applicationId, headlessAppId)),
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
          applicationId: headlessAppId,
          description: 'Super administrator with full access',
        })
        .returning({ id: roles.id });
      roleId = newRole[0]!.id;
      logger.info({ roleId }, 'Created new Admin role.');
      // Add wildcard permission
      await db.insert(permissions).values({
        roleId,
        applicationId: headlessAppId,
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
          eq(userApplications.applicationId, headlessAppId),
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
          applicationId: headlessAppId,
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

    // Create CMS_UI admin role
    let cmsRoleId: string;
    const existingCmsRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.name, 'admin'), eq(roles.applicationId, cmsUiAppId)))
      .limit(1);
    if (existingCmsRole.length > 0) {
      cmsRoleId = existingCmsRole[0]!.id;
      logger.info({ cmsRoleId }, 'CMS_UI Admin role already exists.');
    } else {
      const newRole = await db
        .insert(roles)
        .values({
          name: 'admin',
          applicationId: cmsUiAppId,
          description: 'CMS UI Administrator with full access',
        })
        .returning({ id: roles.id });
      cmsRoleId = newRole[0]!.id;
      logger.info({ cmsRoleId }, 'Created new CMS_UI Admin role.');
      await db.insert(permissions).values({
        roleId: cmsRoleId,
        applicationId: cmsUiAppId,
        action: '*',
        effect: 'allow',
      });
      logger.info('Granted wildcard (*) permission to CMS_UI Admin role.');
    }

    // Link user to CMS_UI role via user_applications
    let cmsUserAppId: string;
    const existingCmsUserApp = await db
      .select()
      .from(userApplications)
      .where(
        and(
          eq(userApplications.userId, userId),
          eq(userApplications.applicationId, cmsUiAppId),
        ),
      )
      .limit(1);
    if (existingCmsUserApp.length > 0) {
      cmsUserAppId = existingCmsUserApp[0]!.id;
    } else {
      const newUserApp = await db
        .insert(userApplications)
        .values({
          userId,
          applicationId: cmsUiAppId,
          status: 'active',
        })
        .returning({ id: userApplications.id });
      cmsUserAppId = newUserApp[0]!.id;
    }
    const existingCmsUserRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userApplicationId, cmsUserAppId))
      .limit(1);
    if (existingCmsUserRole.length === 0) {
      await db.insert(userRoles).values({
        userApplicationId: cmsUserAppId,
        roleId: cmsRoleId,
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
