"""Pydantic schemas for financial profile and debts."""
from decimal import Decimal
from pydantic import BaseModel


class DebtCreate(BaseModel):
    name: str
    balance: Decimal
    apr: Decimal
    monthly_payment: Decimal


class DebtResponse(BaseModel):
    id: int
    name: str
    balance: Decimal
    apr: Decimal
    monthly_payment: Decimal

    class Config:
        from_attributes = True


class DebtPayoffResult(BaseModel):
    months_to_payoff: int | float  # float('inf') when payment <= interest
    total_interest: Decimal | None = None


class ProfileCreate(BaseModel):
    monthly_income: Decimal | None = None
    fixed_costs: Decimal | None = None
    risk_score: int = 5


class ProfileUpdate(BaseModel):
    monthly_income: Decimal | None = None
    fixed_costs: Decimal | None = None
    risk_score: int | None = None


class ProfileResponse(BaseModel):
    id: int
    monthly_income: Decimal | None
    fixed_costs: Decimal | None
    risk_score: int | None
    debts: list[DebtResponse] = []

    class Config:
        from_attributes = True


class AllocationRecommendation(BaseModel):
    needs: Decimal
    wants: Decimal
    savings: Decimal


class MentorNoteResponse(BaseModel):
    note: str
