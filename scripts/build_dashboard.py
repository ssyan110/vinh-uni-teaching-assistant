#!/usr/bin/env python3
"""Build the local dashboard cache from the lesson authority manifest."""

from __future__ import annotations

import json
from pathlib import Path

from production_gate import check as check_production_gate


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
MANIFEST_PATH = PROJECT_ROOT / CONFIG["authority_root"] / "lesson-manifest.json"
DASHBOARD_ROOT = PROJECT_ROOT / CONFIG["dashboard_root"]
OUTPUT_PATH = DASHBOARD_ROOT / "manifest.js"


def build() -> Path:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest["production_gates"] = {
        purpose: {
            "status": result["status"],
            "blockers": result["blockers"],
        }
        for purpose in ("teacher-guide", "support", "prototype", "pptx", "release")
        for result in [check_production_gate(purpose)]
    }
    DASHBOARD_ROOT.mkdir(parents=True, exist_ok=True)
    output = "window.LESSON_MANIFEST = " + json.dumps(
        manifest, ensure_ascii=False, indent=2
    ) + ";\n"
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    return OUTPUT_PATH


if __name__ == "__main__":
    print(build())
