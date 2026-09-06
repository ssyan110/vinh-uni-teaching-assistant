"""Shared structured blocker normalization for workflow command boundaries."""
from __future__ import annotations

from typing import Any

HUMAN_TOKENS = (
    "approval", "approved", "manual", "rehearsal", "teacher", "review", "boundary confirmation",
)

BLOCKER_CODE_RULES = (
    ("human_gate_required", ("approval", "approved", "manual", "rehearsal", "teacher", "review", "boundary confirmation")),
    ("identity_mismatch", ("identity", "lesson_key", "textbook", "offering")),
    ("path_unsafe", ("path", "symlink", "traversal", "outside", "unsafe")),
    ("artifact_missing", ("missing", "not found", "does not exist")),
    ("hash_mismatch", ("hash", "sha256", "changed after")),
    ("schema_invalid", ("schema", "must be an object", "malformed", "invalid json")),
    ("artifact_conflict", ("already exists", "duplicate", "collision", "partial")),
)


def blocker_record(value: Any, *, scope: str = "workflow") -> dict[str, str]:
    if isinstance(value, dict):
        return {
            "code": str(value.get("code", "workflow_blocked")),
            "message": str(value.get("message", value.get("detail", "blocker"))),
            "scope": str(value.get("scope", scope)),
        }
    message = str(value)
    lowered = message.lower()
    code = "workflow_blocked"
    for candidate, tokens in BLOCKER_CODE_RULES:
        if any(token in lowered for token in tokens):
            code = candidate
            break
    return {"code": code, "message": message, "scope": scope}


def blocker_records(values: list[Any], *, scope: str = "workflow") -> list[dict[str, str]]:
    return [blocker_record(value, scope=scope) for value in values]


def with_blocker_records(result: dict[str, Any], *, scope: str = "workflow") -> dict[str, Any]:
    raw = result.get("blockers", [])
    if not isinstance(raw, list):
        raw = [raw]
    records = blocker_records(raw, scope=scope)
    return {**result, "blockers": [item["message"] for item in records], "blocker_records": records}
