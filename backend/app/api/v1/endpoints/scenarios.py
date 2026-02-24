"""Scenario comparison: debt extra payment, invest ETF, saving rate change."""
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.models import get_db, FinancialProfile, Debt, Goal
from app.schemas import (
    DebtExtraScenarioRequest,
    DebtExtraScenarioResponse,
    InvestScenarioRequest,
    InvestScenarioResponse,
    SavingRateScenarioRequest,
    SavingRateScenarioResponse,
)
from app.services import FinanceEngine

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _get_or_create_profile(user_id: int, db: Session) -> FinancialProfile:
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        profile = FinancialProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.post("/debt-extra", response_model=DebtExtraScenarioResponse)
def scenario_debt_extra(
    data: DebtExtraScenarioRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    """Nếu trả thêm X/tháng vào nợ thì sau 12 tháng khác gì? Timeline + so sánh."""
    profile = _get_or_create_profile(user_id, db)
    debt = db.query(Debt).filter(Debt.id == data.debt_id, Debt.profile_id == profile.id).first()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")
    baseline_months, baseline_tl, baseline_interest = FinanceEngine.debt_payoff_timeline(
        debt.balance, debt.apr, debt.monthly_payment, max_months=data.months
    )
    new_payment = debt.monthly_payment + data.extra_monthly
    scenario_months, scenario_tl, scenario_interest = FinanceEngine.debt_payoff_timeline(
        debt.balance, debt.apr, new_payment, max_months=data.months
    )
    interest_saved = (baseline_interest - scenario_interest) if baseline_interest and scenario_interest else None
    return DebtExtraScenarioResponse(
        baseline_months_to_payoff=baseline_months,
        scenario_months_to_payoff=scenario_months,
        baseline_timeline=baseline_tl[: data.months],
        scenario_timeline=scenario_tl[: data.months],
        interest_saved=interest_saved,
    )


@router.post("/invest", response_model=InvestScenarioResponse)
def scenario_invest(
    data: InvestScenarioRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    """Nếu đầu tư X/tháng vào ETF (lãi Y%/năm) thì sau N tháng ra sao?"""
    timeline = FinanceEngine.investment_projection(
        data.monthly_amount, data.annual_return_pct, data.months
    )
    final = timeline[-1]["balance"] if timeline else Decimal("0")
    total_contrib = timeline[-1]["total_contributed"] if timeline else Decimal("0")
    return InvestScenarioResponse(
        timeline=timeline,
        final_balance=final,
        total_contributed=total_contrib,
    )


@router.post("/saving-rate", response_model=SavingRateScenarioResponse)
def scenario_saving_rate(
    data: SavingRateScenarioRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    """Nếu tăng saving rate từ X% lên Y% thì timeline mua nhà (goal) thay đổi thế nào?"""
    profile = _get_or_create_profile(user_id, db)
    goal = db.query(Goal).filter(Goal.id == data.goal_id, Goal.profile_id == profile.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    income = float(data.monthly_income)
    current_savings = data.current_savings
    target = goal.target_amount
    baseline_monthly = income * (float(data.current_saving_rate_pct) / 100)
    scenario_monthly = income * (float(data.new_saving_rate_pct) / 100)
    baseline_months = FinanceEngine.goal_timeline(current_savings, Decimal(str(baseline_monthly)), target)
    scenario_months = FinanceEngine.goal_timeline(current_savings, Decimal(str(scenario_monthly)), target)
    baseline_tl: list[dict] = []
    scenario_tl: list[dict] = []
    cur_b = float(current_savings)
    for m in range(1, int(baseline_months) + 1 if baseline_months != float("inf") else 120):
        cur_b += baseline_monthly
        baseline_tl.append({"month": m, "balance": round(cur_b, 2)})
    cur_s = float(current_savings)
    for m in range(1, int(scenario_months) + 1 if scenario_months != float("inf") else 120):
        cur_s += scenario_monthly
        scenario_tl.append({"month": m, "balance": round(cur_s, 2)})
    return SavingRateScenarioResponse(
        baseline_months_to_goal=baseline_months,
        scenario_months_to_goal=scenario_months,
        target_amount=target,
        baseline_timeline=baseline_tl[:60],
        scenario_timeline=scenario_tl[:60],
    )
