#!/usr/bin/env python3
"""Audit direct legacy active-config fallbacks outside the allowlist."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EXTENSIONS = {".py", ".js"}
LEGACY_FILES = {
    "build_full_teacher_manual.py",
    "build_lesson_01_support_materials.py",
    "build_lesson_01_blooket.py",
    "build_lesson_01_rubric.py",
}
DANGEROUS_PATTERNS = (
    r"CONFIG\s*\[\s*['\"](?:lesson_root|canonical_source|draft_root|authority_root|qa_root|release_root)['\"]\s*\]",
    r"CONFIG\s*\.get\(\s*['\"](?:lesson_root|canonical_source|draft_root|authority_root|qa_root|release_root|historical_package_evidence)['\"]",
    r"projectConfig\s*\.\s*(?:lesson_root|canonical_source|draft_root|authority_root|qa_root|release_root)",
)


def is_allowlisted(path: Path) -> bool:
    relative = path.relative_to(PROJECT_ROOT).as_posix()
    return relative.startswith("scripts/legacy/") or (
        path.parent == PROJECT_ROOT / "scripts"
        and (path.name in LEGACY_FILES or path.name.startswith("build_lesson_01_"))
    )


def audit(root: Path = PROJECT_ROOT) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    scanned = 0
    for path in sorted((root / "scripts").rglob("*")):
        if not path.is_file() or path.suffix not in DEFAULT_EXTENSIONS:
            continue
        scanned += 1
        if is_allowlisted(path):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in DANGEROUS_PATTERNS:
            for match in re.finditer(pattern, text):
                line = text.count("\n", 0, match.start()) + 1
                violations.append({
                    "path": path.relative_to(root).as_posix(),
                    "line": line,
                    "text": text.splitlines()[line - 1].strip(),
                })
    return {
        "status": "clear" if not violations else "blocked",
        "scanned_files": scanned,
        "allowlisted_scopes": ["scripts/legacy/", "four historical builder files"],
        "violations": violations,
        "write_performed": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON")
    args = parser.parse_args()
    result = audit()
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"legacy config audit: {result['status']} ({len(result['violations'])} violations)")
        for item in result["violations"]:
            print(f"ERROR: {item['path']}:{item['line']}: {item['text']}")
    return 0 if result["status"] == "clear" else 1


if __name__ == "__main__":
    raise SystemExit(main())
