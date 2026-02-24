"""Profile and debt CRUD + FinanceEngine calculations."""
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.models import get_db, User, FinancialProfile, Debt, Goal
from app.schemas import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
    DebtCreate,
    DebtResponse,
    DebtPayoffResult,
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    AllocationRecommendation,
    MentorNoteResponse,
)
from app.services import FinanceEngine
from app.services.mentor_note import generate_mentor_note

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_create_profile(user_id: int, db: Session) -> FinancialProfile:
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        profile = FinancialProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    if data.monthly_income is not None:
        profile.monthly_income = data.monthly_income
    if data.fixed_costs is not None:
        profile.fixed_costs = data.fixed_costs
    if data.current_savings is not None:
        profile.current_savings = data.current_savings
    if data.risk_score is not None:
        profile.risk_score = data.risk_score
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me", response_model=ProfileResponse)
def create_my_profile(
    data: ProfileCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    if data.monthly_income is not None:
        profile.monthly_income = data.monthly_income
    if data.fixed_costs is not None:
        profile.fixed_costs = data.fixed_costs
    if data.current_savings is not None:
        profile.current_savings = data.current_savings
    profile.risk_score = data.risk_score
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/goals", response_model=list[GoalResponse])
def list_goals(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    return list(profile.goals) if profile.goals else []


@router.post("/goals", response_model=GoalResponse)
def add_goal(
    data: GoalCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    goal = Goal(
        profile_id=profile.id,
        name=data.name,
        goal_type=data.goal_type,
        target_amount=data.target_amount,
        target_months=data.target_months,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.profile_id == profile.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    if data.name is not None:
        goal.name = data.name
    if data.goal_type is not None:
        goal.goal_type = data.goal_type
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.target_months is not None:
        goal.target_months = data.target_months
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.profile_id == profile.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None


@router.post("/debts", response_model=DebtResponse)
def add_debt(
    data: DebtCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    debt = Debt(
        profile_id=profile.id,
        name=data.name,
        balance=data.balance,
        apr=data.apr,
        monthly_payment=data.monthly_payment,
    )
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.get("/debts/{debt_id}/payoff", response_model=DebtPayoffResult)
def get_debt_payoff(
    debt_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.profile_id == profile.id).first()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")
    months = FinanceEngine.calculate_debt_payoff(
        debt.balance, debt.apr, debt.monthly_payment
    )
    return DebtPayoffResult(months_to_payoff=months)


@router.get("/allocation", response_model=AllocationRecommendation)
def get_allocation(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    if not profile.monthly_income or profile.monthly_income <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Set monthly_income in profile first",
        )
    risk = profile.risk_score or 5
    alloc = FinanceEngine.recommend_allocation(Decimal(str(profile.monthly_income)), risk)
    return AllocationRecommendation(**alloc)


@router.get("/projection/{debt_id}")
def get_12_month_projection(
    debt_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(user_id, db)
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.profile_id == profile.id).first()
    if not debt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")
    return FinanceEngine.projection_12_months(debt.balance, debt.apr, debt.monthly_payment)


@router.get("/mentor-note", response_model=MentorNoteResponse)
def get_mentor_note(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db),
):
    """Returns a short mentor-style note based on profile and projections (uses OpenAI if configured)."""
    profile = _get_or_create_profile(user_id, db)
    income_str = str(profile.monthly_income) if profile.monthly_income else None
    debt_summary = "; ".join(
        f"{d.name} ${d.balance} @ {d.apr}%"
        for d in (profile.debts or [])
    ) or "No debts"
    allocation_summary = "not set"
    if profile.monthly_income and profile.monthly_income > 0:
        alloc = FinanceEngine.recommend_allocation(
            Decimal(str(profile.monthly_income)), profile.risk_score or 5
        )
        allocation_summary = f"needs ${alloc['needs']}, wants ${alloc['wants']}, savings ${alloc['savings']}"
    projection_parts = []
    for d in profile.debts or []:
        months = FinanceEngine.calculate_debt_payoff(d.balance, d.apr, d.monthly_payment)
        projection_parts.append(f"{d.name}: {months} months" if months != float("inf") else f"{d.name}: payoff not possible at current payment")
    projection_summary = "; ".join(projection_parts) if projection_parts else "No debts"
    note = generate_mentor_note(income_str, debt_summary, allocation_summary, projection_summary)
    return MentorNoteResponse(note=note)
