"""Financial profile and related entities."""
from sqlalchemy import Column, Integer, Numeric, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import Base


class FinancialProfile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    monthly_income = Column(Numeric(precision=12, scale=2), nullable=True)
    fixed_costs = Column(Numeric(precision=12, scale=2), nullable=True)
    risk_score = Column(Integer, default=5, nullable=True)  # 1-10 for allocation tuning

    user = relationship("User", back_populates="profile")
    debts = relationship("Debt", back_populates="profile", cascade="all, delete-orphan")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g. "Credit Card", "Car Loan"
    balance = Column(Numeric(precision=12, scale=2), nullable=False)
    apr = Column(Numeric(precision=5, scale=2), nullable=False)  # annual % rate
    monthly_payment = Column(Numeric(precision=12, scale=2), nullable=False)

    profile = relationship("FinancialProfile", back_populates="debts")
