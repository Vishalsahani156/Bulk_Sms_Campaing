# Production Deployment — Vercel + Render

Pulse SMS is split across two hosts:

| Service | Platform | Directory |
|---------|----------|-----------|
| Frontend (TanStack Start) | **Vercel** | `frontend/` |
| Backend API + Worker | **Render** | `backend/` |

---

## 1. Backend on Render

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the repo — Render reads [`render.yaml`](render.yaml).
4. Set **manual** env vars when prompted (all required unless noted):
   - `API_BASE_URL` — your Render web service URL, e.g. `https://pulse-sms-api.onrender.com`
   - `CORS_ORIGIN` — your Vercel frontend URL, e.g. `https://your-app.vercel.app`
   - `APP_FRONTEND_URL` — same Vercel URL (password reset links)
   - `REDIS_URL` — **required** — Render Key Value, Upstash, or other Redis (`rediss://` supported)
   - `RAZORPAY_*` — optional, if using payments

The blueprint creates:
- **pulse-sms-api** — web service (`/health` check, auto-migrate on deploy)
- **pulse-sms-worker** — background worker for SMS + CSV import
- **pulse-sms-db** — PostgreSQL (free tier)

### Option B — Manual web service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `bun install` |
| Pre-Deploy Command | `bun run db:migrate:prod` |
| Start Command | `bun run start` |
| Health Check Path | `/health` |

Add a second **Background Worker** service with build command `bun install` and start command `bun run start:worker`.

Production start scripts run TypeScript directly with **Bun** (no `dist/` compile step required on Render).

### Required backend env vars

```
NODE_ENV=production
API_BASE_URL=https://<your-api>.onrender.com
CORS_ORIGIN=https://<your-app>.vercel.app
APP_FRONTEND_URL=https://<your-app>.vercel.app
DATABASE_URL=<from Render Postgres or Neon>
REDIS_URL=<redis or rediss URL>
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
SMS_PROVIDER=mock
```

### Razorpay webhook

Point Razorpay to:

```
https://<your-api>.onrender.com/v1/webhooks/razorpay
```

---

## 2. Frontend on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. **Root Directory**: `frontend` (or leave repo root — root [`vercel.json`](vercel.json) also works)
3. Framework is auto-detected via Nitro (`vercel` preset in [`frontend/vite.config.ts`](frontend/vite.config.ts)).
4. Confirm build settings (in [`frontend/vercel.json`](frontend/vercel.json)):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://bulk-sms-campaing.onrender.com/v1` |
| `VITE_RAZORPAY_KEY_ID` | Your Razorpay public key |

6. Deploy.

> **Vercel `NOT_FOUND` fix:** If you see a 404, the Root Directory is wrong or Output Directory is not `dist`. TanStack Start + Nitro writes the Vercel Build Output to `frontend/dist/` (includes `config.json` + server routes).

[`frontend/vercel.json`](frontend/vercel.json) sets build command, install command, and **`outputDirectory: dist`** (required for Nitro on Vercel).

---

## 3. Cross-origin auth

Frontend (Vercel) and API (Render) run on different domains. The backend is configured for this:

- Refresh token cookie uses `SameSite=None; Secure` in production
- CORS allows credentials from your Vercel origin
- Access token stays in `localStorage` on the frontend

After deploying, verify login → dashboard → refresh (wait 15+ min or shorten `JWT_ACCESS_EXPIRES` in dev).

---

## 4. Local production build test

```bash
# Frontend (Vercel output)
cd frontend
VITE_API_BASE_URL=https://your-api.onrender.com/v1 npm run build

# Backend (Render — root directory must be `backend`)
cd backend
bun install
bun run db:migrate:prod   # requires DATABASE_URL
bun run start
```

---

## 5. Architecture reference

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full system design.
