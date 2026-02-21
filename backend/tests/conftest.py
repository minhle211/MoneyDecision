"""Pytest fixtures."""
import os
import pytest
from decimal import Decimal

# Use in-memory SQLite for tests to avoid needing PostgreSQL
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.services.finance_engine import FinanceEngine  # noqa: E402


@pytest.fixture
def engine():
    return FinanceEngine
