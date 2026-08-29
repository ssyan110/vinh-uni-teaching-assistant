#!/usr/bin/env python3
"""Validate textbook-scoped lesson identity and path isolation."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = PROJECT_ROOT / "course/lesson-registry.json"
DEFAULT_CONFIG = PROJECT_ROOT / "project.config.json"
TEXTBOOK_PATH_PATTERN = re.compile(r"(lessons|textbooks)/([^/]+)/lesson-(\d{2})")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_project_path(value: str | None) -> Path | None:
    if not value:
        return None
    path = PROJECT_ROOT / value
    try:
        path.relative_to(PROJECT_ROOT)
    except ValueError as exc:
        raise ValueError(f"path escapes project root: {value}") from exc
    return path


def check_manifest_identity(
    path: Path,
    textbook_id: str,
    lesson_id: str,
    errors: list[str],
    *,
    require_lesson_key: bool = False,
) -> None:
    if not path.is_file():
        return
    try:
        payload = read_json(path)
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{path.relative_to(PROJECT_ROOT)}: invalid JSON ({exc})")
        return
    for field, expected in (("textbook_id", textbook_id), ("lesson_id", lesson_id)):
        actual = payload.get(field)
        legacy_id = f"{textbook_id}-{lesson_id}"
        if field == "lesson_id" and actual in {expected, legacy_id}:
            continue
        if actual is not None and actual != expected:
            errors.append(
                f"{path.relative_to(PROJECT_ROOT)}: {field}={actual!r}, expected {expected!r}"
            )
    lesson_key = payload.get("lesson_key")
    expected_key = f"{textbook_id}:{lesson_id}"
    if lesson_key is None and require_lesson_key:
        errors.append(
            f"{path.relative_to(PROJECT_ROOT)}: missing required lesson_key {expected_key!r}"
        )
    elif lesson_key is not None and lesson_key != expected_key:
        errors.append(
            f"{path.relative_to(PROJECT_ROOT)}: lesson_key={lesson_key!r}, expected {expected_key!r}"
        )
    text = path.read_text(encoding="utf-8")
    for kind, found_textbook, found_number in TEXTBOOK_PATH_PATTERN.findall(text):
        if found_textbook != textbook_id:
            errors.append(
                f"{path.relative_to(PROJECT_ROOT)}: cross-textbook {kind} path "
                f"references {found_textbook}/lesson-{found_number}, expected {textbook_id}/{lesson_id}"
            )


def validate(registry_path: Path, config_path: Path) -> list[str]:
    errors: list[str] = []
    try:
        registry = read_json(registry_path)
        config = read_json(config_path)
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read identity inputs: {exc}"]

    expected_format = "<textbook_id>:<lesson_id>"
    if registry.get("lesson_key_format") != expected_format:
        errors.append(
            f"registry lesson_key_format must be {expected_format!r}, got {registry.get('lesson_key_format')!r}"
        )

    textbooks = registry.get("textbooks")
    lessons = registry.get("lessons")
    if not isinstance(textbooks, list) or not isinstance(lessons, list):
        return errors + ["registry must contain textbooks and lessons arrays"]
    textbook_ids = {str(item.get("textbook_id")) for item in textbooks}
    if None in textbook_ids:
        textbook_ids.discard("None")
        errors.append("registry contains a textbook without textbook_id")

    seen_keys: set[str] = set()
    seen_scopes: set[tuple[str, str]] = set()
    for item in lessons:
        textbook_id = item.get("textbook_id")
        lesson_id = item.get("lesson_id")
        lesson_key = item.get("lesson_key")
        if not textbook_id or not lesson_id or not lesson_key:
            errors.append(f"lesson entry missing identity fields: {item!r}")
            continue
        expected_key = f"{textbook_id}:{lesson_id}"
        if lesson_key != expected_key:
            errors.append(f"{lesson_key}: expected key {expected_key}")
        if lesson_key in seen_keys:
            errors.append(f"duplicate lesson_key: {lesson_key}")
        seen_keys.add(lesson_key)
        scope = (str(textbook_id), str(lesson_id))
        if scope in seen_scopes:
            errors.append(f"duplicate textbook/lesson scope: {textbook_id}/{lesson_id}")
        seen_scopes.add(scope)
        if textbook_id not in textbook_ids:
            errors.append(f"{lesson_key}: textbook_id is not in textbook registry")
        expected_path = f"lessons/{textbook_id}/{lesson_id}"
        if item.get("lesson_path") != expected_path:
            errors.append(
                f"{lesson_key}: lesson_path must be {expected_path!r}, got {item.get('lesson_path')!r}"
            )
        for field in ("source_manifest", "authority_manifest", "source_inventory"):
            value = item.get(field)
            try:
                path = resolve_project_path(value)
            except ValueError as exc:
                errors.append(f"{lesson_key}: {exc}")
                continue
            if path and field != "source_inventory" and path.is_file():
                check_manifest_identity(
                    path,
                    str(textbook_id),
                    str(lesson_id),
                    errors,
                    require_lesson_key=field == "source_manifest",
                )

    active = config.get("active_context", {})
    active_textbook = active.get("textbook_id")
    active_lesson = active.get("lesson_id")
    active_key = active.get("lesson_key") or config.get("active_lesson_key")
    if active_textbook and active_lesson:
        expected_active_key = f"{active_textbook}:{active_lesson}"
        if active_key != expected_active_key:
            errors.append(
                f"active context key mismatch: expected {expected_active_key}, got {active_key}"
            )
        if expected_active_key not in seen_keys:
            errors.append(f"active context is not registered: {expected_active_key}")
        matching = next(
            (item for item in lessons if item.get("lesson_key") == expected_active_key),
            None,
        )
        if matching:
            expected_root = matching.get("lesson_path")
            configured_root = config.get("lesson_root")
            if configured_root != expected_root:
                errors.append(
                    f"active lesson_root mismatch: expected {expected_root!r}, got {configured_root!r}"
                )
            expected_collection = str(expected_root).rsplit("/", 1)[0]
            configured_collection = config.get("lesson_collection_root")
            if configured_collection != expected_collection:
                errors.append(
                    "active lesson_collection_root mismatch: "
                    f"expected {expected_collection!r}, got {configured_collection!r}"
                )
            expected_canonical_prefix = f"{expected_root}/00-source/"
            canonical_source = config.get("canonical_source", "")
            if canonical_source and not str(canonical_source).startswith(expected_canonical_prefix):
                errors.append(
                    f"active canonical_source must stay under {expected_canonical_prefix!r}, got {canonical_source!r}"
                )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    args = parser.parse_args()
    registry_path = args.registry if args.registry.is_absolute() else PROJECT_ROOT / args.registry
    config_path = args.config if args.config.is_absolute() else PROJECT_ROOT / args.config
    errors = validate(registry_path, config_path)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(f"lesson identity OK: {len(json.loads(registry_path.read_text(encoding='utf-8')).get('lessons', []))} scoped lessons")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
