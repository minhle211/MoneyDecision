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
    current_savings: Decimal | None = None
    risk_score: int = 5


class ProfileUpdate(BaseModel):
    monthly_income: Decimal | None = None
    fixed_costs: Decimal | None = None
    current_savings: Decimal | None = None
    risk_score: int | None = None


class ProfileResponse(BaseModel):
    id: int
    monthly_income: Decimal | None
    fixed_costs: Decimal | None
    current_savings: Decimal | None
    risk_score: int | None
    debts: list[DebtResponse] = []
    goals: list["GoalResponse"] = []

    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    name: str
    goal_type: str  # house, travel, retirement, other
    target_amount: Decimal
    target_months: int | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    goal_type: str | None = None
    target_amount: Decimal | None = None
    target_months: int | None = None


class GoalResponse(BaseModel):
    id: int
    name: str
    goal_type: str
    target_amount: Decimal
    target_months: int | None

    class Config:
        from_attributes = True


# Forward ref for ProfileResponse
ProfileResponse.model_rebuild()


class AllocationRecommendation(BaseModel):
    needs: Decimal
    wants: Decimal
    savings: Decimal


class MentorNoteResponse(BaseModel):
    note: str
