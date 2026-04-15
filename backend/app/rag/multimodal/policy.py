from __future__ import annotations

from datetime import datetime
from typing import Any

from ...models import Assessment
from .runtime import normalize_text, normalize_week_label


DIRECT_ANSWER_PATTERNS = (
    "give answer",
    "final answer",
    "solve this",
    "solve it",
    "correct option",
    "correct answer",
    "tell me the answer",
    "what is the answer",
    "answer this",
)


def find_active_assessment_guards(*, subject_id: int, week: str | None) -> list[Assessment]:
    normalized_week = normalize_week_label(week)
    if not normalized_week:
        return []

    candidates = Assessment.query.filter_by(subject_id=subject_id, published=True, week=normalized_week).all()
    now = datetime.utcnow()
    active: list[Assessment] = []
    for assessment in candidates:
        due_at = _parse_due_date(assessment.due_date)
        if due_at and due_at > now:
            active.append(assessment)
    return active


def should_block_direct_answer(question: str) -> bool:
    normalized = normalize_text(question).lower()
    return any(pattern in normalized for pattern in DIRECT_ANSWER_PATTERNS)


def build_deadline_guard_response(*, subject_name: str, week: str, assessments: list[Assessment]) -> dict[str, Any]:
    due_date = assessments[0].due_date if assessments else None
    due_fragment = f" until the due date passes ({due_date})" if due_date else " until the due date passes"
    return {
        "answer": (
            f"I can help you revise {subject_name} for {week}, but I cannot reveal direct answers for active assessments"
            f"{due_fragment}. Ask me for concept explanations, revision guidance, or similar practice instead."
        ),
        "citations": [],
        "followUpQuestions": [
            f"Explain the main concepts for {week} in {subject_name}.",
            f"Give me revision tips for {week} in {subject_name}.",
        ],
        "confidence": "high",
        "referencedImages": [],
        "guarded": True,
    }


def _parse_due_date(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None

    candidates = (
        raw,
        raw.replace("Z", "+00:00"),
        raw[:19],
    )
    for candidate in candidates:
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            continue
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None
