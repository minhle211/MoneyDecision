# How to Run FinBud

## Connection flow

- **Frontend** (browser) → calls `/api/*` → **Backend** (FastAPI) → **PostgreSQL**
- In Docker: nginx proxies `/api` to the backend service; backend uses `DATABASE_URL` to reach the `db` service.
- Locally: Vite dev server proxies `/api` to `http://localhost:8000`; backend uses `.env` in project root for `DATABASE_URL` (e.g. `localhost:5432`).

## Option A: Docker (recommended)

From the project root (where `docker-compose.yml` is):

```bash
docker compose up --build
```

- App: **http://localhost**
- API: **http://localhost:8000**
- Ensure a `.env` file exists in the project root (copy from `.env.example` if needed).

## Option B: Run locally

1. **Database**: PostgreSQL must be running with user `finbud`, password `finbud`, database `finbud` on port 5432.  
   Either start only the DB with Docker:  
   `docker compose up -d db`  
   Or use a local PostgreSQL instance and set `DATABASE_URL` in the root `.env`.

2. **Backend** (must run from the `backend` folder so Python finds the `app` package):
   ```bash
   cd backend
   .venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   Or run `backend\run.bat` from anywhere.

3. **Frontend** (from project root):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend.

If you see "Cannot reach backend" or "Request failed" when creating an account, check:

- Backend is running from `backend/` (or via `run.bat`) on port 8000.
- Database is running and `DATABASE_URL` in the root `.env` is correct.
- When using Docker, run `docker compose up --build` from the project root and use **http://localhost**.
