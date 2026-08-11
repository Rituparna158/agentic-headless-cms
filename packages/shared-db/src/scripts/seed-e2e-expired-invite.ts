import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users } from '../index.js';
import { logger } from '@repo/logger';

// E2E expired invite fixture
export const EXPIRED_INVITE_EMAIL = 'expired-invite-e2e@agentic-cms.com';
export const EXPIRED_INVITE_RAW_TOKEN = 'e2e-fixed-expired-invite-token';

async function seedExpiredInvite() {
  logger.info('Seeding expired-invite E2E fixture...');
  if (!process.env.DATABASE_URL) {
    logger.error('CRITICAL: DATABASE_URL environment variable is required.');
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const inviteTokenHash = crypto
    .createHash('sha256')
    .update(EXPIRED_INVITE_RAW_TOKEN)
    .digest('hex');
  const inviteExpiresAt = new Date(Date.now() - 60_000);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, EXPIRED_INVITE_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ status: 'invited', inviteTokenHash, inviteExpiresAt })
      .where(eq(users.email, EXPIRED_INVITE_EMAIL));
  } else {
    await db.insert(users).values({
      email: EXPIRED_INVITE_EMAIL,
      firstName: 'Expired',
      lastName: 'Invite',
      status: 'invited',
      inviteTokenHash,
      inviteExpiresAt,
    });
  }

  logger.info('Expired-invite E2E fixture ready.');
  process.exit(0);
}

void seedExpiredInvite();
