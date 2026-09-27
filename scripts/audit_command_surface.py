#!/usr/bin/env python3
"""Audit documented script commands against the repository command surface."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
README = PROJECT_ROOT / "scripts/README.md"
COMMAND_RE = re.compile(r"^python3 scripts/([^\s\\]+)(?:\s+(.*?))?\\?$", re.MULTILINE)
RETIRED = {"run_lesson_production.py"}
SIDE_EFFECT_FLAGS = ("--execute", "--confirm", "--legacy-active-build")


def documented_commands() -> list[dict[str, Any]]:
    text = README.read_text(encoding="utf-8")
    commands: list[dict[str, Any]] = []
    in_fence = False
    pending = ""
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence:
            continue
        if pending:
            pending += " " + line.strip()
            if not line.rstrip().endswith("\\"):
                commands.append(_parse(pending.rstrip("\\ ")))
                pending = ""
            continue
        if line.startswith("python3 scripts/"):
            pending = line.strip()
            if not line.rstrip().endswith("\\"):
                commands.append(_parse(pending.rstrip("\\ ")))
                pending = ""
    return commands


def _parse(command: str) -> dict[str, Any]:
    parts = command.split()
    script = parts[1].removeprefix("scripts/")
    return {"script": script, "command": command, "side_effect": any(flag in parts for flag in SIDE_EFFECT_FLAGS)}


def has_argparse(path: Path) -> bool:
    text = path.read_text(encoding="utf-8", errors="replace")
    return "import argparse" in text or "from argparse" in text


def audit(root: Path = PROJECT_ROOT) -> dict[str, Any]:
    commands = documented_commands()
    findings: list[dict[str, Any]] = []
    help_checked: list[str] = []
    for item in commands:
        script = item["script"]
        path = PROJECT_ROOT / "scripts" / script
        if not path.is_file():
            findings.append({"type": "missing_script", "script": script})
            continue
        if script in RETIRED:
            findings.append({"type": "retired_documented", "script": script})
            continue
        if has_argparse(path) and not item["side_effect"]:
            result = subprocess.run(
                [sys.executable, str(path), "--help"],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            help_checked.append(script)
            if result.returncode != 0:
                findings.append({
                    "type": "help_failed",
                    "script": script,
                    "returncode": result.returncode,
                    "stderr": result.stderr.strip(),
                })
    return {
        "status": "clear" if not findings else "blocked",
        "documented_command_count": len(commands),
        "help_checked": sorted(set(help_checked)),
        "side_effect_commands_not_executed": sorted({item["script"] for item in commands if item["side_effect"]}),
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
        print(
            f"command surface audit: {result['status']} "
            f"({result['documented_command_count']} documented commands; "
            f"{len(result['help_checked'])} help checks)"
        )
        for finding in result["findings"]:
            print(f"ERROR: {finding}")
    return 0 if result["status"] == "clear" else 1


if __name__ == "__main__":
    raise SystemExit(main())
