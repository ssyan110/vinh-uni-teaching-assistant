"""Shared structured blocker normalization for workflow command boundaries."""
from __future__ import annotations

import re
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

BLOCKER_REQUIREMENT_RULES = {
    "human_gate_required": ["QA-001", "DELIVERY-001"],
    "identity_mismatch": ["ID-001", "ID-002"],
    "path_unsafe": ["OPS-001"],
    "artifact_missing": ["SOURCE-001"],
    "hash_mismatch": ["AUTH-001"],
    "schema_invalid": ["QA-001"],
    "artifact_conflict": ["RELEASE-001", "RELEASE-002"],
}


def blocker_record(value: Any, *, scope: str = "workflow") -> dict[str, Any]:
    if isinstance(value, dict):
        code = str(value.get("code", "workflow_blocked"))
        return {
            "code": code,
            "message": str(value.get("message", value.get("detail", "blocker"))),
            "scope": str(value.get("scope", scope)),
            "requirement_ids": list(value.get("requirement_ids", BLOCKER_REQUIREMENT_RULES.get(code, []))),
        }
    message = str(value)
    lowered = message.lower()
    code = "workflow_blocked"
    for candidate, tokens in BLOCKER_CODE_RULES:
        if any(re.search(rf"(?<!\\w){re.escape(token)}(?!\\w)", lowered) for token in tokens):
            code = candidate
            break
    if code == "workflow_blocked":
        if "source" in lowered:
            requirement_ids = ["SOURCE-001"]
        elif "audio" in lowered or "media" in lowered:
            requirement_ids = ["MEDIA-001"]
        elif "qa" in lowered or "quality" in lowered:
            requirement_ids = ["QA-001"]
        elif "pbi" in lowered or "teaching-design" in lowered or "teacher manual" in lowered:
            requirement_ids = ["PBI-001"]
        elif "authority" in lowered:
            requirement_ids = ["AUTH-001"]
        elif "release" in lowered:
            requirement_ids = ["RELEASE-001"]
        else:
            requirement_ids = ["QA-001"]
    elif code == "artifact_missing":
        if "qa" in lowered or "quality" in lowered:
            requirement_ids = ["QA-001"]
        elif "audio" in lowered or "media" in lowered:
            requirement_ids = ["MEDIA-001"]
        elif "authority" in lowered:
            requirement_ids = ["AUTH-001"]
        elif "release" in lowered:
            requirement_ids = ["RELEASE-001"]
        else:
            requirement_ids = BLOCKER_REQUIREMENT_RULES[code]
    else:
        requirement_ids = BLOCKER_REQUIREMENT_RULES.get(code, [])
    return {"code": code, "message": message, "scope": scope,
            "requirement_ids": list(requirement_ids)}


def blocker_records(values: list[Any], *, scope: str = "workflow") -> list[dict[str, Any]]:
    return [blocker_record(value, scope=scope) for value in values]


def with_blocker_records(result: dict[str, Any], *, scope: str = "workflow") -> dict[str, Any]:
    raw = result.get("blockers", [])
    if not isinstance(raw, list):
        raw = [raw]
    records = blocker_records(raw, scope=scope)
    return {**result, "blockers": [item["message"] for item in records], "blocker_records": records}
