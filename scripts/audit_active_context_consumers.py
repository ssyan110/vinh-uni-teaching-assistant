#!/usr/bin/env python3
"""Inventory active-context consumers without executing production operations."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ACTIVE_PATTERNS = (
    re.compile(r"active_context"),
)
HISTORICAL_NAMES = {
    "build_full_teacher_manual.py",
    "build_lesson_01_support_materials.py",
    "build_lesson_01_blooket.py",
    "build_lesson_01_rubric.py",
    "migrate_lesson_01_authority.py",
}
EXEMPT_NAMES = {"audit_active_context_consumers.py"}


def classify(path: Path, root: Path = PROJECT_ROOT) -> str:
    relative = path.relative_to(root).as_posix()
    if relative.startswith("scripts/legacy/") or path.name in HISTORICAL_NAMES or path.name.startswith("build_lesson_01_"):
        return "historical-legacy"
    if path.name in {"validate_lesson_identity.py", "lesson_context.py"}:
        return "identity-compatibility"
    if path.name == "dashboard_context.py":
        return "dashboard-compatibility"
    return "migration-required"


def audit(root: Path = PROJECT_ROOT) -> dict[str, Any]:
    consumers: list[dict[str, Any]] = []
    scripts_root = root / "scripts"
    for path in sorted(scripts_root.rglob("*")):
        if not path.is_file() or path.suffix not in {".py", ".js"} or path.name in EXEMPT_NAMES:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        matches = []
        for pattern in ACTIVE_PATTERNS:
            matches.extend(match.start() for match in pattern.finditer(text))
        if not matches:
            continue
        lines = sorted({text.count("\n", 0, position) + 1 for position in matches})
        consumers.append({
            "path": path.relative_to(root).as_posix(),
            "category": classify(path, root),
            "lines": lines,
            "write_performed": False,
        })
    counts: dict[str, int] = {}
    for consumer in consumers:
        category = consumer["category"]
        counts[category] = counts.get(category, 0) + 1
    return {
        "status": "blocked" if counts.get("migration-required") else "review" if consumers else "clear",
        "write_performed": False,
        "consumers": consumers,
        "counts": counts,
        "scope": "scripts/*.py and scripts/**/*.py|js",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON")
    args = parser.parse_args()
    result = audit()
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        total = len(result["consumers"])
        print(f"active-context consumer audit: {result['status']} ({total} consumers; read-only)")
        for item in result["consumers"]:
            print(f"- {item['category']}: {item['path']}:{','.join(map(str, item['lines']))}")
    return 1 if result["status"] == "blocked" else 0


if __name__ == "__main__":
    raise SystemExit(main())
