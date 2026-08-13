import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { E2E_DATABASE_URL } from './constants';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

async function ensureDatabaseExists() {
  const target = new URL(E2E_DATABASE_URL);
  const dbName = target.pathname.replace(/^\//, '');

  const adminUrl = new URL(E2E_DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }
}

export default async function globalSetup() {
  await ensureDatabaseExists();

  const testDbEnv = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: E2E_DATABASE_URL,
  };

  // drizzle-kit directly, not the `db:migrate` package script - that script
  // rebuilds @repo/shared-db first, and this runs concurrently with the
  // backend webServer (already started, in `tsx watch` mode against the
  // same workspace symlink), so a rebuild here restarts it mid-run.
  execSync('pnpm exec drizzle-kit migrate', {
    cwd: path.join(repoRoot, 'packages/shared-db'),
    stdio: 'inherit',
    env: testDbEnv,
  });

  execSync('pnpm --filter @repo/shared-db run seed:admin', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: testDbEnv,
  });
  execSync('pnpm --filter @repo/shared-db run seed:e2e-expired-invite', {
    cwd: repoRoot,
    stdio: 'inherit',
    env: testDbEnv,
  });
}
