"""Core financial math. Uses Decimal to avoid floating-point errors."""
from decimal import Decimal
import math
from typing import Any


class FinanceEngine:
    @staticmethod
    def calculate_debt_payoff(
        balance: Decimal, apr: Decimal, monthly_payment: Decimal
    ) -> int | float:
        """Calculates how many months to pay off debt."""
        monthly_rate = (apr / 100) / 12
        if monthly_payment <= balance * monthly_rate:
            return float("inf")  # Interest exceeds payment

        # Formula: n = -log(1 - (B*r/P)) / log(1 + r)
        n = -math.log(
            1
            - (float(balance) * float(monthly_rate) / float(monthly_payment))
        ) / math.log(1 + float(monthly_rate))
        return math.ceil(n)

    @staticmethod
    def recommend_allocation(income: Decimal, risk_score: int = 5) -> dict[str, Decimal]:
        """Basic 50/30/20 rule adjusted by risk (placeholder for future tuning)."""
        return {
            "needs": income * Decimal("0.50"),
            "wants": income * Decimal("0.30"),
            "savings": income * Decimal("0.20"),
        }

    @staticmethod
    def projection_12_months(
        balance: Decimal, apr: Decimal, monthly_payment: Decimal
    ) -> list[dict[str, Any]]:
        """Returns month-by-month projection for the next 12 months (or until payoff)."""
        monthly_rate = (apr / 100) / 12
        b = float(balance)
        p = float(monthly_payment)
        r = float(monthly_rate)
        result: list[dict[str, Any]] = []
        for month in range(1, 13):
            if b <= 0:
                result.append({"month": month, "balance": Decimal("0"), "interest": Decimal("0")})
                continue
            interest = b * r
            principal = min(p - interest, b)
            b = b - principal
            result.append(
                {
                    "month": month,
                    "balance": Decimal(str(round(b, 2))),
                    "interest": Decimal(str(round(interest, 2))),
                }
            )
        return result

    @staticmethod
    def debt_payoff_timeline(
        balance: Decimal, apr: Decimal, monthly_payment: Decimal, max_months: int = 120
    ) -> tuple[int | float, list[dict[str, Any]], Decimal]:
        """Returns (months_to_payoff, month-by-month timeline, total_interest)."""
        monthly_rate = (apr / 100) / 12
        b = float(balance)
        p = float(monthly_payment)
        r = float(monthly_rate)
        total_interest = Decimal("0")
        result: list[dict[str, Any]] = []
        month = 0
        while b > 0 and month < max_months:
            month += 1
            interest = b * r
            total_interest += Decimal(str(round(interest, 2)))
            principal = min(p - interest, b)
            b = b - principal
            result.append({
                "month": month,
                "balance": Decimal(str(round(max(0, b), 2))),
                "interest": Decimal(str(round(interest, 2))),
            })
        months_to_payoff = float("inf") if b > 0 else month
        return months_to_payoff, result, total_interest

    @staticmethod
    def investment_projection(
        monthly_contribution: Decimal, annual_return_pct: Decimal, months: int
    ) -> list[dict[str, Any]]:
        """Compound growth: balance each month (e.g. ETF)."""
        r = float(annual_return_pct / 100) / 12
        contrib = float(monthly_contribution)
        balance = 0.0
        total_contributed = Decimal("0")
        result: list[dict[str, Any]] = []
        for m in range(1, months + 1):
            balance += contrib
            total_contributed += Decimal(str(round(contrib, 2)))
            balance *= 1 + r
            result.append({
                "month": m,
                "balance": Decimal(str(round(balance, 2))),
                "total_contributed": total_contributed,
            })
        return result

    @staticmethod
    def goal_timeline(
        current_savings: Decimal, monthly_saving: Decimal, target_amount: Decimal
    ) -> int | float:
        """Months until savings reach target (no growth for simplicity)."""
        current = float(current_savings)
        monthly = float(monthly_saving)
        target = float(target_amount)
        if monthly <= 0:
            return float("inf") if current < target else 0
        need = target - current
        if need <= 0:
            return 0
        return math.ceil(need / monthly)
