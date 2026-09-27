#!/usr/bin/env python3
"""Audit lifecycle wording in the scripts command documentation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
README = PROJECT_ROOT / "scripts/README.md"

REQUIRED_PHRASES = (
    "This command writes only `dashboard/manifest.js`",
    "All statuses return\n`write_performed=false`",
    "Do not interpret `review` as authorization",
    "It does not grant\nauthority",
    "The record does not\napprove source content",
    "status=passed` and exit 0 mean integrity checks passed; inspect `delivery_status`",
    "This records evidence only; it does not approve, promote, recover, or\npublish anything.",
    "After reviewing a `ready` plan and receiving explicit release authorization",
)
FORBIDDEN_PHRASES = (
    "read-only dashboard cache",
    "technical pass means approved",
    "plan is authorization",
    "run packet is authority",
)


def audit() -> dict[str, Any]:
    text = README.read_text(encoding="utf-8")
    findings: list[str] = []
    for phrase in REQUIRED_PHRASES:
        if phrase not in text:
            findings.append(f"missing required lifecycle wording: {phrase}")
    for phrase in FORBIDDEN_PHRASES:
        if phrase in text:
            findings.append(f"forbidden lifecycle wording: {phrase}")
    return {
        "status": "clear" if not findings else "blocked",
        "required_phrase_count": len(REQUIRED_PHRASES),
        "forbidden_phrase_count": len(FORBIDDEN_PHRASES),
        "findings": findings,
        "write_performed": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = audit()
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"lifecycle wording audit: {result['status']} ({len(result['findings'])} findings)")
        for finding in result["findings"]:
            print(f"ERROR: {finding}")
    return 0 if result["status"] == "clear" else 1


if __name__ == "__main__":
    raise SystemExit(main())
