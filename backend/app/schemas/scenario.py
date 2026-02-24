"""Pydantic schemas for scenario comparison (debt extra, invest, saving rate)."""
from decimal import Decimal
from pydantic import BaseModel


class DebtExtraScenarioRequest(BaseModel):
    debt_id: int
    extra_monthly: Decimal
    months: int = 12


class DebtExtraScenarioResponse(BaseModel):
    baseline_months_to_payoff: int | float
    scenario_months_to_payoff: int | float
    baseline_timeline: list[dict]
    scenario_timeline: list[dict]
    interest_saved: Decimal | None = None


class InvestScenarioRequest(BaseModel):
    monthly_amount: Decimal
    annual_return_pct: Decimal = Decimal("7")  # e.g. ETF ~7%
    months: int = 36


class InvestScenarioResponse(BaseModel):
    timeline: list[dict]  # month, balance, total_contributed
    final_balance: Decimal
    total_contributed: Decimal


class SavingRateScenarioRequest(BaseModel):
    current_saving_rate_pct: Decimal  # e.g. 10
    new_saving_rate_pct: Decimal  # e.g. 20
    goal_id: int
    monthly_income: Decimal
    current_savings: Decimal


class SavingRateScenarioResponse(BaseModel):
    baseline_months_to_goal: int | float
    scenario_months_to_goal: int | float
    target_amount: Decimal
    baseline_timeline: list[dict]
    scenario_timeline: list[dict]
