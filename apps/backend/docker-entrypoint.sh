#!/bin/sh
set -e

echo "[agentic-cms-backend] Booting container..."

if [ "$AUTO_MIGRATE" != "false" ]; then
  echo "[agentic-cms-backend] AUTO_MIGRATE is enabled. Step 1/2: Running database migrations & system schemas..."
  node dist/scripts/run-migrations-and-seed.js

  echo "[agentic-cms-backend] Step 2/2: Provisioning admin user and application via setup CLI..."
  node dist/cli.js setup --auto \
    --app-name "HEADLESS_CMS" \
    --email "${SEED_ADMIN_EMAIL:-admin@agentic-cms.com}" \
    --password "${SEED_ADMIN_PASSWORD:-admin}"

  echo "[agentic-cms-backend] Database setup completed."
else
  echo "[agentic-cms-backend] AUTO_MIGRATE is disabled. Skipping startup migrations."
fi

echo "[agentic-cms-backend] Starting application..."
exec "$@"
