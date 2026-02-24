"""FinBud FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.models.base import Base, engine

settings = get_settings()


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


@app.get("/health")
def health():
    return {"status": "ok"}
