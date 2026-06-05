# Bulk SMS Campaign

## Run locally (no Docker)

```bash
npm install

# first time only — create DB (see backend/README.md), then migrate
npm run setup:local

npm start             # frontend (8080) + backend (3001) — single command
```

Or run the shell script:

```bash
./scripts/start.sh
```

Frontend only: `npm run dev:frontend`  
Backend only: `npm run dev:backend`
