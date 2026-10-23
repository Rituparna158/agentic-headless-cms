import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import {
  runMigrations,
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

async function seedSystemSchemas(db: Database): Promise<void> {
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

    logger.info('Verifying system schemas...');
    await seedSystemSchemas(db);
    logger.info('System schemas verification completed successfully.');
  } finally {
    await adapter.close();
  }
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].endsWith('run-migrations-and-seed.js')) {
  runMigrationsAndSeed()
    .then(() => {
      logger.info('Migration and system schemas script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.fatal({ err }, 'Migration and system schemas script failed.');
      process.exit(1);
    });
}
