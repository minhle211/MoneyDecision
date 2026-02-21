"""SQLAlchemy declarative base and session."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base for all models."""
    pass


def get_db():
    """Dependency for FastAPI: yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
