# Deploying FinBud

Vercel only runs the **frontend** (static + serverless). The **backend** (FastAPI + PostgreSQL) must run on a different host (Railway, Render, Fly.io, etc.).

## 1. Deploy backend elsewhere

Deploy the backend to a host that runs Python and allows a long-running process and a Postgres connection:

- **Railway** – Add a service from this repo, set **Root Directory** to `backend`, add a Postgres plugin or `DATABASE_URL`, and set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Render** – New Web Service from repo, root `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add a PostgreSQL database and set `DATABASE_URL`.
- **Fly.io** – Use a Dockerfile (e.g. the one in `backend/`) and set `DATABASE_URL` via secrets.

Set these env vars on the backend:

- `DATABASE_URL` – Postgres connection string (e.g. from Railway/Render/Neon).
- `SECRET_KEY` – A long random string for JWT.
- `CORS_ORIGINS` – Your Vercel frontend URL(s), comma-separated (e.g. `https://your-app.vercel.app,https://your-app-*.vercel.app` if you use preview URLs).

## 2. Deploy frontend to Vercel

1. **Import the repo** in the [Vercel Dashboard](https://vercel.com/new).
2. **Set Root Directory** to `frontend` (this repo is a monorepo; the frontend lives in `frontend/`).
3. **Environment variables** (for the **Build** step):
   - `VITE_API_URL` = your backend base URL, e.g. `https://your-backend.railway.app` or `https://your-app.onrender.com`.  
   Do **not** add `/api` at the end; the app already uses paths like `/api/v1/auth/register`. So if your backend is at `https://api.example.com`, set `VITE_API_URL=https://api.example.com` and the backend must serve the API under `/api` (this project does).
   - Actually in this project the backend serves at prefix `/api`, so the backend URL might be `https://xxx.railway.app` and the API is at `https://xxx.railway.app/api`. So `VITE_API_URL=https://xxx.railway.app` is correct (the frontend will call `baseURL + '/v1/auth/register'` = `https://xxx.railway.app/v1/auth/register` – wait, no. baseURL is VITE_API_URL or '/api'. So if VITE_API_URL is https://xxx.railway.app, then the frontend calls https://xxx.railway.app/v1/auth/register. But the backend has prefix "/api", so the route is at https://xxx.railway.app/api/v1/auth/register. So we need VITE_API_URL to be https://xxx.railway.app/api. So the user should set VITE_API_URL to the full API base including /api, e.g. https://your-backend.railway.app/api.
4. Deploy. The frontend will call `VITE_API_URL` for all API requests.

## 3. CORS on the backend

The backend must allow your Vercel origin. Set on the backend:

- `CORS_ORIGINS=https://your-app.vercel.app`

If you use Vercel preview deployments, add those too, or use a pattern your host supports (e.g. `https://*-your-team.vercel.app`). Multiple origins: comma-separated, no spaces (or trim spaces in code – we do trim).

## Summary

| Where        | What to set |
|-------------|-------------|
| **Vercel** (frontend) | Root Directory: `frontend`. Env: `VITE_API_URL=https://<your-backend-host>/api` |
| **Backend** (Railway/Render/etc.) | `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS=https://<your-vercel-app>.vercel.app` |

After deployment, open your Vercel URL; login and registration will use the backend URL you set in `VITE_API_URL`.
