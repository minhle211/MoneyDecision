"""Optional: generate a short 'Mentor Note' from projection using OpenAI."""
from __future__ import annotations

from app.core.config import get_settings


def generate_mentor_note(
    monthly_income: str | None,
    debt_summary: str,
    allocation_summary: str,
    projection_summary: str,
) -> str:
    """Returns a short mentor-style note. Uses OpenAI if OPENAI_API_KEY is set."""
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_note(allocation_summary, projection_summary)

    try:
        import openai  # optional: pip install openai
        client = openai.OpenAI(api_key=settings.openai_api_key)
        prompt = (
            "You are a friendly financial mentor. In 2-3 short sentences, give one practical tip "
            "based on this user snapshot. Be encouraging and specific.\n"
            f"Income: {monthly_income or 'not set'}. "
            f"Debts: {debt_summary}. "
            f"Allocation: {allocation_summary}. "
            f"Projection: {projection_summary}."
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
        )
        return (resp.choices[0].message.content or "").strip() or _fallback_note(
            allocation_summary, projection_summary
        )
    except Exception:
        return _fallback_note(allocation_summary, projection_summary)


def _fallback_note(allocation_summary: str, projection_summary: str) -> str:
    return (
        f"Your 50/30/20 split: {allocation_summary}. "
        f"Next 12 months: {projection_summary}. "
        "Stick to your plan and you'll get there."
    )
