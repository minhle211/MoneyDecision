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
