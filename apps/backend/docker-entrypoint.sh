#!/bin/sh
set -e

echo "[agentic-cms-backend] Booting container..."

# Run database migrations and seed default data unless explicitly disabled
if [ "$AUTO_MIGRATE" != "false" ]; then
  echo "[agentic-cms-backend] AUTO_MIGRATE is enabled. Running migrations and seed checks..."
  node dist/scripts/run-migrations-and-seed.js
  echo "[agentic-cms-backend] Database setup completed."
else
  echo "[agentic-cms-backend] AUTO_MIGRATE is disabled. Skipping startup migrations."
fi

echo "[agentic-cms-backend] Starting application..."
exec "$@"
