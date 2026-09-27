#!/usr/bin/env python3
"""Resolve the selected course dashboard view without spreading active-context reads."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from lesson_context import LessonContext, LessonContextError, resolve_lesson_context


@dataclass(frozen=True)
class DashboardContext:
    config: dict[str, Any]
    lesson_context: LessonContext
    lesson_registry_path: Path
    dashboard_root: Path
    course_manifest: str | None
    textbook_registry: str | None
    textbook_manifest: str | None
    textbook_title: str | None
    lesson_key_format: str

    @property
    def lesson_key(self) -> str:
        return self.lesson_context.lesson_key

    @property
    def offering_id(self) -> str:
        return self.lesson_context.offering_id

    @property
    def textbook_id(self) -> str:
        return self.lesson_context.textbook_id


def _safe_project_path(project_root: Path, value: str, label: str) -> Path:
    if not value.strip() or (label == "dashboard" and value != "dashboard"):
        raise LessonContextError("dashboard output must use the dedicated dashboard directory")
    raw = Path(value)
    if raw.is_absolute() or any(part in {"", ".", ".."} for part in raw.parts):
        raise LessonContextError(f"unsafe {label} path: {value!r}")
    project = project_root.resolve()
    resolved = (project / raw).resolve()
    try:
        resolved.relative_to(project)
    except ValueError as error:
        raise LessonContextError(f"{label} path escapes project: {value!r}") from error
    cursor = project
    for part in raw.parts:
        cursor /= part
        if cursor.is_symlink():
            raise LessonContextError(f"{label} path is a symlink: {value!r}")
    return resolved


def load_dashboard_context(project_root: Path) -> DashboardContext:
    project = project_root.resolve()
    config_path = project / "project.config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if not isinstance(config, dict):
        raise LessonContextError("project config must be an object")
    active = config.get("active_context")
    if not isinstance(active, dict):
        raise LessonContextError("dashboard active_context must be an object")
    lesson_key = active.get("lesson_key")
    offering_id = active.get("offering_id")
    textbook_id = active.get("textbook_id")
    if not all(isinstance(value, str) and value for value in (lesson_key, offering_id, textbook_id)):
        raise LessonContextError("dashboard active_context needs lesson_key, textbook_id and offering_id")
    lesson_key = str(lesson_key)
    offering_id = str(offering_id)
    textbook_id = str(textbook_id)
    context = resolve_lesson_context(project, lesson_key, offering_id)
    if context.textbook_id != textbook_id:
        raise LessonContextError("dashboard active textbook does not match lesson registry context")
    registry_value = config.get("lesson_registry", "course/lesson-registry.json")
    dashboard_value = config.get("dashboard_root")
    if not isinstance(registry_value, str) or not isinstance(dashboard_value, str):
        raise LessonContextError("dashboard config has invalid registry or dashboard root")
    return DashboardContext(
        config=config,
        lesson_context=context,
        lesson_registry_path=_safe_project_path(project, registry_value, "lesson registry"),
        dashboard_root=_safe_project_path(project, dashboard_value, "dashboard"),
        course_manifest=config.get("course_manifest"),
        textbook_registry=config.get("textbook_registry"),
        textbook_manifest=(config.get("textbook") or {}).get("manifest") if isinstance(config.get("textbook"), dict) else None,
        textbook_title=config.get("active_textbook_title"),
        lesson_key_format=str(config.get("lesson_key_format", "<textbook_id>:<lesson_id>")),
    )
