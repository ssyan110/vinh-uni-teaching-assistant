#!/usr/bin/env python3
"""Resolve a textbook-scoped lesson identity from the project registry."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class LessonContextError(RuntimeError):
    """Raised when a lesson identity is missing, ambiguous or unsafe."""


@dataclass(frozen=True)
class LessonContext:
    lesson_key: str
    offering_id: str
    textbook_id: str
    lesson_id: str
    lesson_root: Path
    registry_entry: dict[str, Any]


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise LessonContextError(f"cannot read JSON: {path}: {error}") from error
    if not isinstance(value, dict):
        raise LessonContextError(f"JSON root must be an object: {path}")
    return value


def _safe_project_path(project_root: Path, value: str) -> Path:
    raw = Path(value)
    if raw.is_absolute() or any(part in {"", ".", ".."} for part in raw.parts):
        raise LessonContextError(f"unsafe project-relative path: {value!r}")
    project = project_root.resolve()
    resolved = (project / raw).resolve()
    try:
        resolved.relative_to(project)
    except ValueError as error:
        raise LessonContextError(f"path escapes the project: {value!r}") from error
    cursor = project
    for part in raw.parts:
        cursor /= part
        if cursor.is_symlink():
            raise LessonContextError(f"symlink path is not allowed: {value!r}")
    return resolved


def resolve_lesson_context(
    project_root: Path,
    lesson_key: str,
    offering_id: str | None = None,
) -> LessonContext:
    """Return one exact lesson context and reject inferred bare lesson numbers."""

    project = project_root.resolve()
    if not lesson_key or ":" not in lesson_key:
        raise LessonContextError("lesson_key must use <textbook_id>:<lesson_id>")

    config = _read_json(project / "project.config.json")
    registry_value = config.get("lesson_registry", "course/lesson-registry.json")
    if not isinstance(registry_value, str) or not registry_value:
        raise LessonContextError("project config has no valid lesson registry path")
    registry_path = _safe_project_path(project, registry_value)
    registry = _read_json(registry_path)
    entries = registry.get("lessons")
    if not isinstance(entries, list):
        raise LessonContextError("lesson registry has no lessons list")

    matches = [
        item
        for item in entries
        if isinstance(item, dict) and item.get("lesson_key") == lesson_key
    ]
    if len(matches) != 1:
        raise LessonContextError(
            f"lesson_key must resolve to exactly one registry entry: {lesson_key}"
        )
    entry = matches[0]
    textbook_id = entry.get("textbook_id")
    lesson_id = entry.get("lesson_id")
    lesson_path = entry.get("lesson_path")
    if not all(isinstance(value, str) and value for value in (textbook_id, lesson_id, lesson_path)):
        raise LessonContextError("registry entry is missing textbook_id, lesson_id or lesson_path")
    if lesson_key != f"{textbook_id}:{lesson_id}":
        raise LessonContextError("registry entry components do not match lesson_key")

    expected_path = f"lessons/{textbook_id}/{lesson_id}"
    if lesson_path != expected_path:
        raise LessonContextError(
            f"registry lesson_path does not match lesson identity: {lesson_path!r}"
        )
    lesson_root = _safe_project_path(project, lesson_path)
    if not lesson_root.is_dir():
        raise LessonContextError(f"lesson root is missing: {lesson_path}")

    offering_ids = entry.get("offering_ids")
    if not isinstance(offering_ids, list) or not all(
        isinstance(value, str) and value for value in offering_ids
    ):
        raise LessonContextError("registry entry has no valid offering_ids")
    selected_offering = offering_id
    if selected_offering is None:
        active = config.get("active_context", {})
        if not isinstance(active, dict):
            active = {}
        active_offering = active.get("offering_id")
        if active.get("lesson_key") == lesson_key and active_offering in offering_ids:
            selected_offering = active_offering
        elif len(offering_ids) == 1:
            selected_offering = offering_ids[0]
        else:
            raise LessonContextError(
                f"offering_id is required for lesson with multiple offerings: {lesson_key}"
            )
    if selected_offering not in offering_ids:
        raise LessonContextError(
            f"offering_id {selected_offering!r} is not registered for {lesson_key}"
        )

    return LessonContext(
        lesson_key=lesson_key,
        offering_id=selected_offering,
        textbook_id=textbook_id,
        lesson_id=lesson_id,
        lesson_root=lesson_root,
        registry_entry=entry,
    )
