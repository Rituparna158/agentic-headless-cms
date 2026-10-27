#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env if present
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('[Error] DATABASE_URL is not set in environment or .env file');
  process.exit(1);
}

// Ensure backups output directory exists
const backupDir = path.join(rootDir, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamped backup filename
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

console.log(`[Backup] Starting PostgreSQL backup...`);
console.log(`[Backup] Target: ${backupFile}`);

try {
  // Check if pg_dump is available in PATH
  const checkPgDump = spawnSync('pg_dump', ['--version'], { shell: true });
  if (checkPgDump.status !== 0) {
    console.warn('[Warning] pg_dump not found in system PATH.');
    console.log('[Backup] Attempting backup via Docker compose container "postgres"...');
    execSync(
      `docker compose exec -T postgres pg_dump -U postgres --clean --if-exists agentic_cms > "${backupFile}"`,
      { cwd: rootDir, stdio: 'inherit', shell: true },
    );
  } else {
    // Run pg_dump directly using DATABASE_URL
    execSync(`pg_dump --dbname="${dbUrl}" --clean --if-exists --no-owner -f "${backupFile}"`, {
      stdio: 'inherit',
      shell: true,
    });
  }

  if (fs.existsSync(backupFile)) {
    const stats = fs.statSync(backupFile);
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`[Success] Database backup completed successfully!`);
    console.log(`[Success] File: ${backupFile} (${sizeKb} KB)`);
  } else {
    throw new Error('Backup file was not created.');
  }
} catch (error) {
  console.error(`[Error] Database backup failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
