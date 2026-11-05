#!/usr/bin/env python3
"""Isolate the historical active-L01 config compatibility boundary.

Scoped operations must use LessonContext. This adapter exists only for the
retired active-context CLI path and legacy test/migration adapters.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PROJECT_ROOT / "project.config.json"


def _config(config_path: Path | None = None) -> dict[str, Any]:
    path = config_path or CONFIG_PATH
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("project.config.json root must be an object")
    boundary = payload.get("legacy_compatibility")
    if not isinstance(boundary, dict):
        raise RuntimeError("legacy compatibility boundary is missing")
    if boundary.get("status") != "read-only-legacy":
        raise RuntimeError("legacy compatibility boundary is not read-only-legacy")
    if boundary.get("not_for_scoped_operations") is not True:
        raise RuntimeError("legacy compatibility cannot be used by scoped operations")
    return payload


def legacy_path(field: str, *, project_root: Path = PROJECT_ROOT, config: dict[str, Any] | None = None) -> Path:
    """Return one explicitly deprecated project-relative path."""
    payload = config if config is not None else _config(project_root / "project.config.json")
    boundary = payload.get("legacy_compatibility")
    if not isinstance(boundary, dict):
        if config is None:
            raise RuntimeError("legacy compatibility boundary is missing")
        boundary = {"deprecated_fields": []}
    deprecated = boundary.get("deprecated_fields", [])
    if field not in deprecated and config is None:
        raise RuntimeError(f"config field is not declared legacy: {field}")
    if field not in deprecated and config is not None:
        # Synthetic/older compatibility fixtures predate the boundary block.
        # They are accepted only through this explicitly supplied legacy config.
        deprecated = [*deprecated, field]
    value = payload.get(field)
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"legacy config field is missing or invalid: {field}")
    path = (project_root / value).resolve()
    path.relative_to(project_root.resolve())
    return path


def legacy_value(
    field: str,
    default: Any = None,
    *,
    project_root: Path = PROJECT_ROOT,
    config: dict[str, Any] | None = None,
) -> Any:
    """Return a deprecated scalar/metadata value for compatibility only."""
    payload = config if config is not None else _config(project_root / "project.config.json")
    boundary = payload.get("legacy_compatibility")
    if not isinstance(boundary, dict):
        if config is None:
            raise RuntimeError("legacy compatibility boundary is missing")
        boundary = {"deprecated_fields": []}
    if field not in boundary.get("deprecated_fields", []) and config is None:
        raise RuntimeError(f"config field is not declared legacy: {field}")
    if field not in boundary.get("deprecated_fields", []) and config is not None:
        # Preserve older synthetic/legacy fixtures only at this adapter boundary.
        pass
    return payload.get(field, default)
