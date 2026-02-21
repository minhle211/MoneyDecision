# FinBud

Full-stack financial buddy: FastAPI backend + React (Vite + Tailwind) frontend. Tracks income, costs, debts; 50/30/20 allocation; debt payoff and 12‑month projection; optional AI “Mentor Note”.

## Structure

- **backend/** – FastAPI, SQLAlchemy (PostgreSQL), JWT, `FinanceEngine` (Decimal-based math), optional `mentor_note` (OpenAI)
- **frontend/** – React, Vite, Tailwind, Zustand, Recharts
- **docker-compose.yml** – Backend + Frontend + PostgreSQL
- **Makefile** – `make backend`, `make frontend`, `make test`, `make docker-up`

## Quick start

### Local (no Docker)

1. **Backend**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   # Optional: copy ../.env.example to ../.env and set DATABASE_URL
   uvicorn app.main:app --reload
   ```
   Or from root: `make backend` (requires backend deps installed).

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Or from root: `make frontend`. Open http://localhost:5173 (API proxy to :8000).

3. **API docs:** http://localhost:8000/docs

### With Docker

```bash
cp .env.example .env
docker compose up --build
# or: make docker-up
```

- App: http://localhost (frontend)
- API: http://localhost:8000 (backend)
- DB: PostgreSQL on port 5432 (user/pass/db: finbud/finbud/finbud)

## Data flow

1. User input (React) → Pydantic validation → FastAPI.
2. FastAPI persists to PostgreSQL and calls `FinanceEngine`.
3. `FinanceEngine` returns payoff months and 12‑month projection.
4. React renders with Recharts.
5. **Mentor Note:** GET `/api/v1/profile/mentor-note` uses the projection (and optionally OpenAI when `OPENAI_API_KEY` is set) to return a short tip; Dashboard shows it.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

- Lint & test: `pytest` for financial math.
- Build backend Docker image.
- Build frontend (npm build).

Deploy: push image(s) to Railway, Render, or any Docker-friendly host; use `docker-compose` or equivalent for backend + DB (+ frontend if desired).

## Env

See `.env.example`. Required for production: `SECRET_KEY`, `DATABASE_URL`. Optional: `OPENAI_API_KEY` (enables AI Mentor Note). Frontend: optional `VITE_API_URL` (default `/api` for dev proxy).
"# Money Decision" 
