# Pulse SMS API

Standalone Node.js REST API for the Pulse SMS dashboard.

## Quick start

```bash
# Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# Install & configure
cp .env.example .env
npm install

# Run migrations
npm run db:migrate

# Start API (port 3001)
npm run dev

# Start SMS worker (separate terminal)
npm run dev:worker
```

## Environment

See [.env.example](.env.example). Required:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)

## API docs

Swagger UI: http://localhost:3001/docs

Health check: http://localhost:3001/health

## Architecture

- **Fastify** — HTTP server
- **Drizzle ORM** — PostgreSQL
- **Redis** — cache, rate limits, BullMQ queues
- **BullMQ** — async SMS sending & CSV import
- **Razorpay** — wallet top-ups
