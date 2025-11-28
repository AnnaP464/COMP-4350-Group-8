#!/bin/bash
set -euo pipefail

# Bitnami provides these env vars
DB="${POSTGRESQL_DATABASE:-postgres}"

export PGPASSWORD="${POSTGRESQL_POSTGRES_PASSWORD}"

echo "==> Creating extensions in $DB as superuser"
psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
echo "==> Extensions ready"