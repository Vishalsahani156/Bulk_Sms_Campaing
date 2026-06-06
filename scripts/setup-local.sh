#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-postgresql://pulse:pulse@localhost:5432/pulse_sms}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

echo "==> Checking Redis..."
REDIS_HOST="${REDIS_URL#redis://}"
REDIS_HOST="${REDIS_HOST%%/*}"
REDIS_PORT="${REDIS_HOST##*:}"
REDIS_HOST="${REDIS_HOST%%:*}"
REDIS_PORT="${REDIS_PORT:-6379}"

if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
  echo "Redis is not running on $REDIS_HOST:$REDIS_PORT."
  echo "Arch Linux: sudo pacman -S redis && sudo systemctl enable --now redis"
  exit 1
fi
echo "Redis OK"

echo "==> Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "PostgreSQL is not running on localhost:5432."
  echo "Arch Linux: sudo pacman -S postgresql && sudo systemctl enable --now postgresql"
  exit 1
fi

if ! psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
  echo "Database not ready yet. Creating pulse user + pulse_sms database..."
  if psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1; then
    psql -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pulse') THEN
    CREATE USER pulse WITH PASSWORD 'pulse';
  END IF;
END
$$;
ALTER USER pulse WITH PASSWORD 'pulse';
SELECT 'CREATE DATABASE pulse_sms OWNER pulse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pulse_sms')\gexec
GRANT ALL PRIVILEGES ON DATABASE pulse_sms TO pulse;
SQL
  else
    echo "Could not connect as postgres. Create the database manually:"
    echo ""
    echo "  sudo -u postgres psql <<'SQL'"
    echo "  CREATE USER pulse WITH PASSWORD 'pulse';"
    echo "  CREATE DATABASE pulse_sms OWNER pulse;"
    echo "  GRANT ALL PRIVILEGES ON DATABASE pulse_sms TO pulse;"
    echo "  SQL"
    echo ""
    echo "Then run again: npm run setup:local"
    exit 1
  fi

  if ! psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    echo "Database setup failed for: $DATABASE_URL"
    exit 1
  fi
fi
echo "PostgreSQL OK"

echo "==> Installing frontend dependencies..."
npm install --prefix "$ROOT_DIR/frontend"

echo "==> Installing backend dependencies..."
npm install --prefix "$ROOT_DIR/backend"

echo "==> Running database migrations..."
npm run db:migrate --prefix "$ROOT_DIR/backend"

echo ""
echo "Local setup complete."
echo "Start the app with: npm run dev"
