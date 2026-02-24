"""FinBud FastAPI application."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.models.base import Base, engine

from starlette.responses import Response

settings = get_settings()

# If running on a host that sets PORT (e.g. Railway, Render) but DATABASE_URL is still localhost, fail with a clear message
_DEFAULT_DB = "postgresql://finbud:finbud@localhost:5432/finbud"
if os.environ.get("PORT") and (settings.database_url == _DEFAULT_DB or "localhost" in settings.database_url or "127.0.0.1" in settings.database_url):
    raise RuntimeError(
        "DATABASE_URL is not set or points to localhost. "
        "Set DATABASE_URL on this service to your Postgres URL (e.g. from Railway/Render PostgreSQL). "
        "See DEPLOY.md → 'connection to localhost (127.0.0.1), port 5432 failed'."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if not exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: nothing for now
    pass


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)
_origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:80",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if settings.cors_origins:
    _origins = [*_origins, *(o.strip() for o in settings.cors_origins.split(",") if o.strip())]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


@app.api_route("/api/{path:path}", methods=["OPTIONS"])
def options_handler(path: str):
    """Respond 200 to CORS preflight (OPTIONS) so the browser allows the actual request."""
    return Response(status_code=200)


@app.get("/health")
def health():
    return {"status": "ok"}
