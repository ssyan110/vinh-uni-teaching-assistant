#!/usr/bin/env python3
"""Read-only coverage audit between PROJECT_REQUIREMENTS.md and its registry."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REQUIREMENTS = ROOT / "PROJECT_REQUIREMENTS.md"
REGISTRY = ROOT / "docs/workflow/requirements-registry.md"


def _top_level_sections(text: str) -> list[str]:
    return re.findall(r"^##\s+(\d+)\.\s+", text, flags=re.MULTILINE)


def _registry_rows(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for line in text.splitlines():
        if not line.startswith("|") or line.startswith("|---"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 6 or cells[0] == "requirement_id":
            continue
        rows.append({
            "requirement_id": cells[0],
            "owner": cells[2],
            "scope": cells[3],
            "verification": cells[4],
            "status": cells[5],
        })
    return rows


def audit(root: Path = ROOT) -> dict[str, Any]:
    requirements_path = root / REQUIREMENTS.relative_to(ROOT)
    registry_path = root / REGISTRY.relative_to(ROOT)
    requirements_text = requirements_path.read_text(encoding="utf-8")
    registry_text = registry_path.read_text(encoding="utf-8")
    sections = _top_level_sections(requirements_text)
    rows = _registry_rows(registry_text)
    findings: list[dict[str, str]] = []
    if not sections or not rows:
        findings.append({"code": "coverage_input_empty", "section": "", "message": "requirements sections and registry rows must not be empty"})
    coverage: dict[str, list[str]] = {}
    for section in sections:
        ids = [
            row["requirement_id"]
            for row in rows
            if "PROJECT_REQUIREMENTS.md" in row["owner"]
            and re.search(rf"§\s*{re.escape(section)}(?:\D|$)", row["owner"])
        ]
        coverage[section] = ids
        if not ids:
            findings.append({
                "code": "registry_section_unmapped",
                "section": section,
                "message": f"PROJECT_REQUIREMENTS.md §{section} has no registry mapping",
            })
    return {
        "status": "clear" if not findings else "blocked",
        "write_performed": False,
        "requirements_path": str(requirements_path),
        "registry_path": str(registry_path),
        "sections": sections,
        "coverage": coverage,
        "findings": findings,
    }


def main() -> int:
    result = audit()
    if result["status"] == "clear":
        print(
            "requirements coverage audit: clear "
            f"({len(result['sections'])} top-level sections mapped)"
        )
        return 0
    print(
        "requirements coverage audit: blocked "
        f"({len(result['findings'])} unmapped sections)"
    )
    for finding in result["findings"]:
        print(f"- {finding['message']}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
