# Pulse SMS Frontend

TanStack Start + React dashboard. Deploy this folder on **Vercel**.

Full step-by-step guide: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## Vercel settings

| Setting          | Value           |
| ---------------- | --------------- |
| Root Directory   | `frontend`      |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |
| Node.js Version  | 20.x            |

## Environment variables

| Variable            | Example                                     |
| ------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | `https://bulk-sms-campaing.onrender.com/v1` |
| `VITE_RAZORPAY_KEY_ID` | (optional) Razorpay public key         |

After Vercel deploy, set `CORS_ORIGIN` and `APP_FRONTEND_URL` on Render to your Vercel URL. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Local dev

From this folder:

```bash
npm install
npm run dev
```

API default: `http://localhost:3001/v1` (start the backend separately — see `../backend/README.md`).
