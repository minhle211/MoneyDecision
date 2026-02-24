# Deploying FinBud

Vercel only runs the **frontend** (static + serverless). The **backend** (FastAPI + PostgreSQL) must run on a different host. Below are step-by-step guides for Railway and Render.

**Before you start:** Push your project to **GitHub** (or GitLab). Both Railway and Render deploy from a Git repo.

---

## 1. Deploy backend to Railway

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo** → choose your MoneyDecision repo.
3. Railway will add a service. Click it, then open **Settings**:
   - **Root Directory:** set to `backend` (so only the `backend/` folder is used).
   - **Start Command:**  
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`  
     (Railway sets `$PORT`; use it so the app listens on the right port.)
4. **Add a database:** In the project, click **+ New** → **Database** → **PostgreSQL**. Railway will create a Postgres instance and set `DATABASE_URL` for you. Link it to your backend service (same project is enough; Railway injects `DATABASE_URL` when you add the Postgres plugin to the project).
5. **Variables:** In your backend service, go to **Variables** and add:
   - `SECRET_KEY` – any long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)).
   - `CORS_ORIGINS` – your Vercel app URL, e.g. `https://your-app.vercel.app` (comma-separated if you have more).
   - If `DATABASE_URL` is not set automatically, copy it from the PostgreSQL service’s **Variables** and paste it into the backend service.
6. **Public URL:** In the backend service, open **Settings** → **Networking** → **Generate Domain**. You’ll get a URL like `https://something.up.railway.app`. That is your **backend URL**. Use `https://something.up.railway.app/api` for `VITE_API_URL` on Vercel.
7. Redeploy if needed (Railway usually deploys on every push to the linked branch).

---

## 2. Deploy backend to Render (alternative)

1. Go to [render.com](https://render.com) and sign in (e.g. with GitHub).
2. **Dashboard** → **New +** → **Web Service**.
3. Connect your GitHub account if needed, then select your **MoneyDecision** repo.
4. Configure the service:
   - **Name:** e.g. `moneydecision-api`.
   - **Region:** choose one close to you.
   - **Root Directory:** `backend`.
   - **Runtime:** Python 3.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add a database:** In the Dashboard, **New +** → **PostgreSQL**. Create the database, then in its **Info** tab copy the **Internal Database URL** (or **External** if you prefer; use one consistently).
6. Back in your **Web Service** → **Environment**:
   - Add `DATABASE_URL` and paste the Postgres URL from step 5.
   - Add `SECRET_KEY` (long random string).
   - Add `CORS_ORIGINS` = your Vercel URL, e.g. `https://your-app.vercel.app`.
7. Click **Create Web Service**. Render will build and deploy. When it’s live, the service URL (e.g. `https://moneydecision-api.onrender.com`) is your **backend URL**. Use `https://moneydecision-api.onrender.com/api` for `VITE_API_URL` on Vercel.

---

## 3. Backend env vars (summary)

On whichever host you use, the backend needs:

| Variable        | Description |
|----------------|-------------|
| `DATABASE_URL` | Postgres connection string (often set automatically when you add Postgres). |
| `SECRET_KEY`   | Long random string for JWT signing. |
| `CORS_ORIGINS` | Your Vercel frontend URL(s), comma-separated, e.g. `https://your-app.vercel.app`. |

## 4. Deploy frontend to Vercel

**Option A – Deploy from repo root (recommended)**  
The repo has a root `vercel.json` that builds the frontend and sets the SPA fallback. No need to change Root Directory.

1. **Import the repo** in the [Vercel Dashboard](https://vercel.com/new) and deploy.
2. **Environment variables** (Project → Settings → Environment Variables, for **Production** and **Preview**):
   - `VITE_API_URL` = your backend API base URL **including** `/api`, e.g. `https://your-backend.railway.app/api`.

**Option B – Root Directory = `frontend`**  
If you prefer to set Root Directory to `frontend`, use that and add `VITE_API_URL` as above.

**Important:** If you don’t set `VITE_API_URL`, the app will call `/api` on Vercel, which returns **404 NOT_FOUND** (Vercel has no backend). Set `VITE_API_URL` to your deployed backend URL and redeploy so the build picks it up.

## 5. CORS on the backend

The backend must allow your Vercel origin. Set on the backend:

- `CORS_ORIGINS=https://your-app.vercel.app`

If you use Vercel preview deployments, add those too, or use a pattern your host supports (e.g. `https://*-your-team.vercel.app`). Multiple origins: comma-separated, no spaces (or trim spaces in code – we do trim).

## Summary

| Where        | What to set |
|-------------|-------------|
| **Vercel** (frontend) | Env: `VITE_API_URL=https://<your-backend-host>/api` (e.g. Railway or Render URL + `/api`) |
| **Backend** (Railway/Render/etc.) | `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS=https://<your-vercel-app>.vercel.app` |

After deployment, open your Vercel URL; login and registration will use the backend URL you set in `VITE_API_URL`.

---

## If you see "connection to localhost (127.0.0.1), port 5432 failed"

The backend is **not** getting your Postgres URL. It’s using the default `DATABASE_URL` (localhost), so you must set **`DATABASE_URL`** on the **backend service** to the real Postgres URL.

- **Railway:**  
  - Open your **project** → click the **backend** service (not the Postgres one).  
  - Go to **Variables**.  
  - If there is no `DATABASE_URL`, click **+ New Variable** → **Add a variable reference** (or **Add from another service**). Choose the **PostgreSQL** service and select **DATABASE_URL**. That links the DB URL into the backend.  
  - If you don’t see “variable reference”, open the **PostgreSQL** service → **Variables** (or **Connect**), copy the full **Postgres URL** (e.g. `postgresql://postgres:xxx@xxx.railway.internal:5432/railway` or the public URL), then in the **backend** service add a variable: name `DATABASE_URL`, value = that URL.  
  - Save and **redeploy** the backend.
- **Render:**  
  - Open your **PostgreSQL** instance → **Info** (or **Connections**) → copy **Internal Database URL** (or External if your backend is in another account).  
  - Open your **Web Service** (backend) → **Environment** → Add: **Key** `DATABASE_URL`, **Value** = the pasted URL.  
  - Save and redeploy the backend.

After `DATABASE_URL` is set correctly on the backend, the “connection to localhost” error should stop.

---

## If you see 404 NOT_FOUND

- **Page 404 (e.g. opening `/login` or refreshing)** – The root `vercel.json` should send all non-file requests to `index.html`. If you still get 404, ensure you’re deploying from the repo root (no Root Directory override) so the root `vercel.json` is used.
- **API 404 (e.g. when registering or logging in)** – The frontend is calling Vercel’s `/api`, which doesn’t exist. Set **`VITE_API_URL`** to your backend URL (e.g. `https://your-backend.railway.app/api`), then trigger a new deploy so the variable is baked into the build.
