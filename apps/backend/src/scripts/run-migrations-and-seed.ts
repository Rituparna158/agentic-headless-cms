import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import {
  runMigrations,
  users,
  roles,
  userRoles,
  permissions,
  userApplications,
  applications,
  schemas,
  Database,
} from '@repo/shared-db';
import { logger } from '@repo/logger';

function resolveMigrationsFolder(): string {
  if (
    process.env.MIGRATIONS_FOLDER &&
    fs.existsSync(process.env.MIGRATIONS_FOLDER)
  ) {
    return process.env.MIGRATIONS_FOLDER;
  }

  const candidatePaths = [
    '/app/drizzle/migrations',
    path.resolve(process.cwd(), 'drizzle/migrations'),
    path.resolve(process.cwd(), '../../packages/shared-db/drizzle/migrations'),
    path.resolve(process.cwd(), 'packages/shared-db/drizzle/migrations'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Migrations folder not found. Checked: ${candidatePaths.join(', ')}`,
  );
}

async function seedAdminUser(db: Database): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@agentic-cms.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin';

  let headlessAppId: string;
  const existingHeadless = await db
    .select()
    .from(applications)
    .where(eq(applications.name, 'HEADLESS_CMS'))
    .limit(1);

  if (existingHeadless.length > 0 && existingHeadless[0]) {
    headlessAppId = existingHeadless[0].id;
  } else {
    const newApp = await db
      .insert(applications)
      .values({ name: 'HEADLESS_CMS', apiKeyHash: 'seed_hash_headless' })
      .returning({ id: applications.id });
    if (!newApp[0])
      throw new Error('Failed to create HEADLESS_CMS application');
    headlessAppId = newApp[0].id;
    logger.info({ headlessAppId }, 'Created HEADLESS_CMS application.');
  }

  let roleId: string;
  const existingRole = await db
    .select()
    .from(roles)
    .where(and(eq(roles.name, 'admin'), eq(roles.applicationId, headlessAppId)))
    .limit(1);

  if (existingRole.length > 0 && existingRole[0]) {
    roleId = existingRole[0].id;
  } else {
    const newRole = await db
      .insert(roles)
      .values({
        name: 'admin',
        applicationId: headlessAppId,
        description: 'Super administrator with full access',
      })
      .returning({ id: roles.id });
    if (!newRole[0]) throw new Error('Failed to create admin role');
    roleId = newRole[0].id;

    await db.insert(permissions).values({
      roleId,
      applicationId: headlessAppId,
      action: '*',
      effect: 'allow',
    });
    logger.info(
      { roleId },
      'Created new Admin role with wildcard permissions.',
    );
  }

  let userId: string;
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0]) {
    userId = existingUser[0].id;
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
    if (!newUser[0]) throw new Error('Failed to create admin user');
    userId = newUser[0].id;
    logger.info({ userId, email: adminEmail }, 'Created initial Admin user.');
  }

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

  if (existingUserApp.length > 0 && existingUserApp[0]) {
    userAppId = existingUserApp[0].id;
  } else {
    const newUserApp = await db
      .insert(userApplications)
      .values({
        userId,
        applicationId: headlessAppId,
        status: 'active',
      })
      .returning({ id: userApplications.id });
    if (!newUserApp[0]) throw new Error('Failed to link user to application');
    userAppId = newUserApp[0].id;
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
}

async function seedSystemSchemas(db: Database): Promise<void> {
  const existingHeadless = await db
    .select()
    .from(applications)
    .where(eq(applications.name, 'HEADLESS_CMS'))
    .limit(1);

  if (!existingHeadless[0]) {
    return;
  }
  const headlessAppId = existingHeadless[0].id;

  const defaultSchemas = [
    {
      name: 'Roles',
      slug: 'system-roles',
      type: 'single_type' as const,
      definition: {
        fields: [
          {
            apiId: 'name',
            displayName: 'Name',
            type: 'text',
          },
        ],
      },
      status: 'published' as const,
      isSystem: true,
      applicationId: headlessAppId,
    },
    {
      name: 'Users',
      slug: 'system-users',
      type: 'single_type' as const,
      definition: {
        fields: [
          {
            apiId: 'email',
            displayName: 'Email',
            type: 'text',
          },
        ],
      },
      status: 'published' as const,
      isSystem: true,
      applicationId: headlessAppId,
    },
  ];

  for (const s of defaultSchemas) {
    const existing = await db
      .select()
      .from(schemas)
      .where(eq(schemas.slug, s.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schemas).values(s);
      logger.info(`Seeded system schema: ${s.name}`);
    }
  }
}

export async function runMigrationsAndSeed(): Promise<void> {
  const adapter = getDatabaseAdapter();
  const db = adapter.getDb();

  try {
    const migrationsFolder = resolveMigrationsFolder();
    logger.info({ migrationsFolder }, 'Applying database migrations...');
    await runMigrations(db, {
      migrationsFolder,
      maxRetries: 10,
      retryDelayMs: 2000,
      onRetry: (attempt, max, error) => {
        logger.warn(
          { attempt, max, error },
          'Database not ready for migrations yet, retrying...',
        );
      },
    });
    logger.info('Database migrations applied successfully.');

    logger.info('Verifying seed state (Admin user and system schemas)...');
    await seedAdminUser(db);
    await seedSystemSchemas(db);
    logger.info('Seed verification completed successfully.');
  } finally {
    await adapter.close();
  }
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].endsWith('run-migrations-and-seed.js')) {
  runMigrationsAndSeed()
    .then(() => {
      logger.info('Migration and seeding script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.fatal({ err }, 'Migration and seeding script failed.');
      process.exit(1);
    });
}
