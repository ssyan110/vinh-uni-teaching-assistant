"""Validation rules for classroom learning feedback.

This module intentionally has no school-grade total, weighting function, or
ACTFL level conversion function or table.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


MODE_IDS = {
    "interpretive": ["I1", "I2", "I3", "I4", "I5"],
    "interpersonal": ["P1", "P2", "P3", "P4", "P5"],
    "presentational": ["PR1", "PR2", "PR3", "PR4", "PR5"],
}
ALL_CRITERIA = [criterion_id for ids in MODE_IDS.values() for criterion_id in ids]
VALID_NUMERIC_SCORES = {0, 1, 2, 3}
VALID_SPECIAL_SCORES = {"NR", "N/A"}


class RubricValidationError(ValueError):
    """Raised when a rubric or score record violates the course contract."""


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise RubricValidationError(message)


def validate_rubric(rubric_document: Mapping[str, Any]) -> None:
    """Validate the contract that must hold before a rubric can be used."""

    rubric = rubric_document.get("rubric")
    _require(isinstance(rubric, Mapping), "rubric metadata is required")
    _require(rubric.get("official_actfl_rating") is False, "official ACTFL rating must be false")
    _require(rubric.get("scale", {}).get("actfl_level_mapping") is None, "ACTFL level mapping must be null")
    _require(rubric.get("task_completion", {}).get("included_in_school_grade") is False, "task completion must stay outside school grading")
    _require(rubric.get("retry", {}).get("store_attempts_separately") is True, "A1 and A2 must be stored separately")
    feedback_use = rubric.get("feedback_use", {})
    _require(feedback_use.get("school_grading") is False, "feedback tool must not be a school-grade tool")
    _require(feedback_use.get("purpose_zh_cn"), "feedback purpose is required")

    criteria = rubric_document.get("criteria")
    _require(isinstance(criteria, list) and len(criteria) == 15, "exactly 15 full criteria are required")
    by_id = {criterion.get("id"): criterion for criterion in criteria if isinstance(criterion, Mapping)}
    _require(set(by_id) == set(ALL_CRITERIA), "full criteria must be I1-I5, P1-P5, and PR1-PR5")

    presentational_forbidden = ("追问", "澄清", "协商", "听者反应", "根据听者")
    for criterion_id, criterion in by_id.items():
        _require(criterion.get("student_language") == "zh-CN", f"{criterion_id} must be zh-CN")
        _require(set(criterion.get("scores", {})) == {"0", "1", "2", "3"}, f"{criterion_id} needs four descriptors")
        _require(criterion.get("source_ids"), f"{criterion_id} needs a source map")
        descriptor_text = " ".join(criterion["scores"].values())
        if criterion["mode"] == "presentational":
            _require(not any(term in descriptor_text for term in presentational_forbidden), f"{criterion_id} contains interpersonal behavior")

    _require("追问" in " ".join(by_id["P2"]["scores"].values()), "P2 must preserve follow-up evidence")
    _require(
        any(term in " ".join(by_id["P3"]["scores"].values()) for term in ("澄清", "确认", "重述", "换一种说法")),
        "P3 must preserve clarification or repair evidence",
    )


def validate_score(value: Any, *, allow_na: bool = False) -> None:
    if isinstance(value, bool):
        raise RubricValidationError("boolean is not a score")
    if isinstance(value, int) and value in VALID_NUMERIC_SCORES:
        return
    if value == "NR":
        return
    if allow_na and value == "N/A":
        return
    raise RubricValidationError(f"invalid score: {value!r}")


def validate_feedback_record(record: Mapping[str, Any]) -> None:
    """Validate one individual feedback record without calculating a total."""

    _require(record.get("attempt") in {"A1", "A2"}, "attempt must be A1 or A2")
    _require(record.get("student_id"), "student_id is required")
    _require(record.get("task_id"), "task_id is required")
    scores = record.get("scores")
    _require(isinstance(scores, Mapping), "scores are required")
    _require(set(scores).issubset(set(ALL_CRITERIA)), "unknown criterion in feedback record")
    for value in scores.values():
        validate_score(value, allow_na=True)

    task_score = record.get("task_completion_score")
    if task_score is not None:
        validate_score(task_score)
    _require("ability_total" not in record, "feedback record must not contain an ability total")
    _require("weighting" not in record, "feedback record must not contain weighting")
    _require("actfl_level" not in record, "feedback record must not contain an ACTFL level")
