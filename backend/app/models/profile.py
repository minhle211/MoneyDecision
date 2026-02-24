"""Financial profile and related entities."""
from sqlalchemy import Column, Integer, Numeric, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import Base


class Goal(Base):
    """Savings goal: house, travel, retirement, etc."""
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g. "Mua nhà", "Du lịch", "Retirement"
    goal_type = Column(String(50), nullable=False)  # house, travel, retirement, other
    target_amount = Column(Numeric(precision=14, scale=2), nullable=False)
    target_months = Column(Integer, nullable=True)  # optional: target time in months

    profile = relationship("FinancialProfile", back_populates="goals")


class FinancialProfile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    monthly_income = Column(Numeric(precision=12, scale=2), nullable=True)
    fixed_costs = Column(Numeric(precision=12, scale=2), nullable=True)
    current_savings = Column(Numeric(precision=14, scale=2), nullable=True, default=0)  # savings hiện tại
    risk_score = Column(Integer, default=5, nullable=True)  # 1-10 for allocation tuning

    user = relationship("User", back_populates="profile")
    debts = relationship("Debt", back_populates="profile", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="profile", cascade="all, delete-orphan")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g. "Credit Card", "Car Loan"
    balance = Column(Numeric(precision=12, scale=2), nullable=False)
    apr = Column(Numeric(precision=5, scale=2), nullable=False)  # annual % rate
    monthly_payment = Column(Numeric(precision=12, scale=2), nullable=False)

    profile = relationship("FinancialProfile", back_populates="debts")
