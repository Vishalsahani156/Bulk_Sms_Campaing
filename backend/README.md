# Pulse SMS API

Standalone Node.js REST API for the Pulse SMS dashboard.

## Quick start (local — no Docker)

Install and start PostgreSQL + Redis locally (Arch Linux):

```bash
sudo pacman -S postgresql redis
sudo systemctl enable --now postgresql redis
```

Create the database once:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER pulse WITH PASSWORD 'pulse';
CREATE DATABASE pulse_sms OWNER pulse;
GRANT ALL PRIVILEGES ON DATABASE pulse_sms TO pulse;
SQL
```

If you were using Docker before, stop those containers so local services can use the ports:

```bash
docker stop docker-postgres-1 docker-redis-1 2>/dev/null || true
```

From the project root:

```bash
# One-time setup: verify services + migrate tables
npm run setup:local

# Start frontend + backend together
npm run dev
```

Or run backend only:

```bash
cd backend
cp .env.example .env   # if you don't have .env yet
npm install
npm run db:migrate
npm run dev
```

API: http://localhost:3001  
Swagger: http://localhost:3001/docs

Optional — SMS worker (separate terminal):

```bash
npm run dev:worker --prefix backend
```

## Environment

See [.env.example](.env.example). Required:

- `DATABASE_URL` — default `postgresql://pulse:pulse@localhost:5432/pulse_sms`
- `REDIS_URL` — default `redis://localhost:6379`
- `JWT_ACCESS_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)

## Architecture

- **Fastify** — HTTP server
- **Drizzle ORM** — PostgreSQL
- **Redis** — cache, rate limits, BullMQ queues
- **BullMQ** — async SMS sending & CSV import
- **Razorpay** — wallet top-ups
