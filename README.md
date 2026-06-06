# Bulk SMS Campaign

## Project structure

```
├── frontend/     # React + TanStack Start UI (deploy on Vercel)
├── backend/      # Fastify API + workers (deploy on Render)
└── scripts/      # Local dev helpers
```

## Run locally (no Docker)

```bash
npm install
npm install --prefix frontend
npm install --prefix backend

# first time only — create DB (see backend/README.md), then migrate
npm run setup:local

npm start             # frontend (8080) + backend (3001)
```

Or run the shell script:

```bash
./scripts/start.sh
```

Frontend only: `npm run dev:frontend`  
Backend only: `npm run dev:backend`

## Production deployment

- **Frontend** → [Vercel](https://vercel.com) (`frontend/`)
- **Backend** → [Render](https://render.com) (`backend/`)

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step setup.
