"""Application configuration from environment variables."""
from pathlib import Path

from pydantic_settings import BaseSettings
from functools import lru_cache

# Project root .env (parent of backend/) so env loads when running from backend/
_ROOT_ENV = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Env-based config. Load from .env in project root or backend/."""

    app_name: str = "FinBud API"
    debug: bool = False

    # Database
    database_url: str = "postgresql://finbud:finbud@localhost:5432/finbud"

    # JWT / Security
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Optional: OpenAI for "Mentor Note"
    openai_api_key: str | None = None

    class Config:
        env_file = str(_ROOT_ENV) if _ROOT_ENV.exists() else ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
