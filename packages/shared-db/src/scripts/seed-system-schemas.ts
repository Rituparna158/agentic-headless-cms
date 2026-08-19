import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { schemas, applications } from '../index.js';
import { logger } from '@repo/logger';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
async function seedSystemSchemas() {
  logger.info('Starting system schemas seeding process...');
  if (!process.env.DATABASE_URL) {
    logger.error('CRITICAL: DATABASE_URL environment variable is required.');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
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
    const systemSchemas = [
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
    for (const schema of systemSchemas) {
      const existing = await db
        .select()
        .from(schemas)
        .where(eq(schemas.slug, schema.slug))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(schemas).values(schema);
        logger.info(`Seeded system schema: ${schema.name}`);
      } else {
        logger.info(`System schema ${schema.name} already exists.`);
      }
    }
    logger.info('System schemas seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed system schemas');
    process.exit(1);
  }
}
void seedSystemSchemas();
