"""Pytest for financial math: ensure formulas are correct."""
import math
import pytest
from decimal import Decimal

from app.services.finance_engine import FinanceEngine


class TestCalculateDebtPayoff:
    def test_payoff_finite_months(self):
        balance = Decimal("10000")
        apr = Decimal("12")  # 12% APR
        monthly_payment = Decimal("500")
        n = FinanceEngine.calculate_debt_payoff(balance, apr, monthly_payment)
        assert isinstance(n, (int, float))
        assert n != math.inf
        assert n >= 20  # should take at least 20 months

    def test_interest_exceeds_payment_returns_inf(self):
        balance = Decimal("10000")
        apr = Decimal("24")  # 24% -> 2% per month = 200 interest
        monthly_payment = Decimal("150")  # less than 200
        n = FinanceEngine.calculate_debt_payoff(balance, apr, monthly_payment)
        assert n == math.inf

    def test_exact_payment_above_interest(self):
        balance = Decimal("1000")
        apr = Decimal("0")  # no interest
        monthly_payment = Decimal("100")
        n = FinanceEngine.calculate_debt_payoff(balance, apr, monthly_payment)
        assert n == 10


class TestRecommendAllocation:
    def test_50_30_20_sum(self):
        income = Decimal("5000")
        alloc = FinanceEngine.recommend_allocation(income, risk_score=5)
        assert alloc["needs"] == Decimal("2500")
        assert alloc["wants"] == Decimal("1500")
        assert alloc["savings"] == Decimal("1000")
        assert alloc["needs"] + alloc["wants"] + alloc["savings"] == income

    def test_no_float_errors(self):
        income = Decimal("1000.10")
        alloc = FinanceEngine.recommend_allocation(income, risk_score=1)
        total = alloc["needs"] + alloc["wants"] + alloc["savings"]
        assert total == income


class TestProjection12Months:
    def test_projection_decreases_balance(self):
        balance = Decimal("12000")
        apr = Decimal("12")
        monthly_payment = Decimal("1200")
        proj = FinanceEngine.projection_12_months(balance, apr, monthly_payment)
        assert len(proj) == 12
        # First month balance should be less than initial
        assert proj[0]["balance"] < balance
        assert proj[0]["month"] == 1
