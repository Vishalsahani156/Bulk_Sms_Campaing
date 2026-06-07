# Pulse SMS — Frontend deployment (Vercel)

Deploy the dashboard UI on **Vercel**. The API runs separately on Render at  
`https://bulk-sms-campaing.onrender.com`.

## 1. Vercel project settings

| Setting | Value |
| -------- | ----- |
| **Root Directory** | `frontend` |
| **Framework Preset** | TanStack Start (or Other — `vercel.json` is included) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 20.x |

## 2. Vercel environment variables

Set these under **Project → Settings → Environment Variables** (Production + Preview):

| Variable | Value |
| -------- | ----- |
| `VITE_API_BASE_URL` | `https://bulk-sms-campaing.onrender.com/v1` |
| `VITE_RAZORPAY_KEY_ID` | Your Razorpay public key (optional, for billing top-ups) |

Optional (only if using Lovable/Supabase OAuth):

| Variable | Value |
| -------- | ----- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |

> Production builds also read [`/.env.production`](.env.production), but **always set `VITE_API_BASE_URL` in Vercel** so preview deployments work.

## 3. Deploy

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Set **Root Directory** to `frontend`.
4. Add the environment variables above.
5. Deploy.

After deploy, note your Vercel URL (e.g. `https://your-app.vercel.app`).

## 4. Link frontend to backend (Render)

In the **Render** dashboard for `bulk-sms-campaing`, set or update:

| Variable | Value |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `API_BASE_URL` | `https://bulk-sms-campaing.onrender.com` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `APP_FRONTEND_URL` | `https://your-app.vercel.app` |

Also ensure these are already set on Render:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET` (32+ characters)
- `JWT_REFRESH_SECRET` (32+ characters)

Redeploy the Render service after changing env vars.

> **Note:** If `CORS_ORIGIN` does not include a `vercel.app` URL, the backend automatically allows `*.vercel.app` origins in production so the first deploy works before you update CORS.

## 5. Verify

| Check | URL |
| ----- | --- |
| Backend health | https://bulk-sms-campaing.onrender.com/health |
| API docs | https://bulk-sms-campaing.onrender.com/docs |
| Dashboard | Your Vercel URL → `/login` |

Sign up or sign in on the Vercel URL. Email/password auth uses the Render API.

## 6. Local build test

```bash
cd frontend
npm install
npm run build
```

Build output must include `dist/client`, `dist/functions/__server.func`, and `dist/config.json`.

## Troubleshooting

| Problem | Fix |
| -------- | ----- |
| Login works locally but not on Vercel | Set `CORS_ORIGIN` and `APP_FRONTEND_URL` on Render to your Vercel URL; redeploy Render |
| API calls go to `localhost` | Set `VITE_API_BASE_URL` in Vercel env vars and redeploy frontend |
| Render root shows `localhost` in JSON | Set `NODE_ENV=production` on Render and redeploy backend |
| OAuth buttons missing | Expected unless `VITE_SUPABASE_*` vars are set; email/password auth still works |
