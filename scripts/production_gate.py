#!/usr/bin/env python3
"""Fail-fast gates for the Boya lesson production workflow.

The gate is deliberately read-only. It checks the current authority and design
manifests before a generator is allowed to write a draft. A generator may never
write to authority, QA, release, or the frozen legacy package.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_ROOT = PROJECT_ROOT / CONFIG["lesson_root"]
DESIGN_ROOT = PROJECT_ROOT / CONFIG["draft_root"]

PRODUCTION_SCRIPTS = (
    "scripts/build_lesson_01_teacher_guide.js",
    "scripts/build_lesson_01_support_materials.py",
    "scripts/build_lesson_01_activity_packages.py",
    "scripts/build_lesson_01_pptx.js",
    "scripts/build_lesson_01_pptx_native.js",
    "scripts/build_lesson_01_prototype.js",
    "scripts/build_lesson_01_visual_prototype.js",
    "scripts/build_full_teacher_manual.py",
    "scripts/build_release_package.py",
    "scripts/build_dashboard.py",
)
LEGACY_TOKENS = (
    "output/boya-intermediate/lesson-01",
    "output/\\u0062oya-intermediate/lesson-01",
    "share/",
)


class ProductionGateError(RuntimeError):
    """Raised when a generator is not allowed to write a draft."""


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_path(relative_path: str) -> Path:
    return PROJECT_ROOT / relative_path


def read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def is_within(child: Path, parent: Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def default_output_dir(purpose: str) -> Path | None:
    defaults = {
        "teacher-guide": DESIGN_ROOT / "teacher-manual-draft",
        "support": DESIGN_ROOT / "support-draft",
        "prototype": DESIGN_ROOT / "visual-prototype-draft",
        "pptx": DESIGN_ROOT / "pptx-draft",
        "semester-manual": DESIGN_ROOT / "teacher-manual-export-draft",
    }
    return defaults.get(purpose)


def validate_output_dir(value: str | None, purpose: str, blockers: list[str]) -> Path | None:
    if purpose in {"audit", "release"}:
        return None
    default = default_output_dir(purpose)
    if default is None:
        blockers.append(f"no draft output root is configured for purpose: {purpose}")
        return None
    candidate_value = value or str(default)
    if candidate_value.startswith("~"):
        blockers.append("draft output must not use ~ or a home-directory path")
        return None
    candidate = Path(candidate_value)
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    resolved = candidate.resolve()
    design_root = DESIGN_ROOT.resolve()
    if resolved == design_root or not is_within(resolved, design_root):
        blockers.append(f"draft output is outside 10-design: {resolved}")
    expected_root = default.resolve()
    if resolved != expected_root and not is_within(resolved, expected_root):
        blockers.append(
            f"draft output must stay under the dedicated {purpose} draft root: {expected_root}"
        )
    for protected in CONFIG.get("protected_roots", []):
        protected_path = project_path(protected).resolve()
        if is_within(resolved, protected_path):
            blockers.append(f"draft output is inside protected path: {protected}")
    return resolved


def add_file_status_blockers(manifest: dict[str, Any], blockers: list[str]) -> None:
    for item in manifest.get("files", []):
        path = project_path(item["path"])
        if not path.is_file():
            blockers.append(f"missing authority file: {item['path']}")
        elif sha256(path) != item.get("sha256"):
            blockers.append(f"authority file changed after approval: {item['path']}")


def audit_production_paths(blockers: list[str]) -> None:
    for relative_path in PRODUCTION_SCRIPTS:
        path = project_path(relative_path)
        if not path.is_file():
            blockers.append(f"missing production script: {relative_path}")
            continue
        text = path.read_text(encoding="utf-8")
        for token in LEGACY_TOKENS:
            if token in text:
                blockers.append(
                    f"production script reads or writes legacy path token {token!r}: {relative_path}"
                )

    for path in sorted((LESSON_ROOT / "10-design").rglob("*.json")):
        text = path.read_text(encoding="utf-8")
        for token in LEGACY_TOKENS:
            if token in text:
                blockers.append(
                    f"design metadata contains legacy path token {token!r}: "
                    f"{path.relative_to(PROJECT_ROOT)}"
                )

    current_qa = LESSON_ROOT / "30-qa/current"
    if current_qa.is_dir():
        for path in sorted(current_qa.rglob("*.md")):
            text = path.read_text(encoding="utf-8")
            for token in LEGACY_TOKENS:
                if token in text:
                    blockers.append(
                        f"current QA points to legacy path token {token!r}: "
                        f"{path.relative_to(PROJECT_ROOT)}"
                    )


def load_base_manifests(blockers: list[str]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    source_manifest: dict[str, Any] = {}
    teaching_manifest: dict[str, Any] = {}
    authority_manifest: dict[str, Any] = {}
    try:
        source_manifest = read_json(LESSON_ROOT / "00-source/source-manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"source manifest is unavailable or invalid: {error}")
    try:
        teaching_manifest = read_json(LESSON_ROOT / "10-design/teaching-design/manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"teaching-design manifest is unavailable or invalid: {error}")
    try:
        authority_manifest = read_json(LESSON_ROOT / "20-approved/lesson-manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"authority manifest is unavailable or invalid: {error}")

    canonical = project_path(CONFIG["canonical_source"])
    if not canonical.is_file():
        blockers.append(f"canonical source is missing: {CONFIG['canonical_source']}")
    elif source_manifest.get("canonical_source_sha256") != sha256(canonical):
        blockers.append("canonical source hash differs from the approved source manifest")
    if source_manifest.get("source_status") != "verified":
        blockers.append("source gate is not verified")
    if source_manifest.get("source_qa_status") != "passed":
        blockers.append("source QA gate is not passed")
    if not str(teaching_manifest.get("status", "")).startswith("approved_by_adam_"):
        blockers.append("PBI teaching-design gate is not approved")
    return source_manifest, teaching_manifest, authority_manifest


def require_authority_manual(authority_manifest: dict[str, Any], blockers: list[str]) -> None:
    if authority_manifest.get("authority_status") != "final_confirmed":
        blockers.append("authority manifest is not final_confirmed")
    teacher = authority_manifest.get("authority", {}).get("teacher_manual", {})
    teacher_path = project_path(teacher.get("path", "")) if teacher.get("path") else None
    if not teacher_path or not teacher_path.is_file():
        blockers.append("approved teacher manual is missing from 20-approved")
    if teacher.get("status") != "final_confirmed":
        blockers.append("teacher manual is not marked final_confirmed")


def require_approved_design_inputs(blockers: list[str]) -> None:
    storyboard = read_json(LESSON_ROOT / "10-design/storyboard/manifest.json")
    visual = read_json(LESSON_ROOT / "10-design/visual-storyboard/manifest.json")
    prototype = read_json(LESSON_ROOT / "10-design/visual-prototype/manifest.json")

    if not storyboard.get("current_revision_approved_at"):
        blockers.append(
            "PPT storyboard current revision is not approved; full PPTX generation is blocked"
        )
    if "approved" not in str(visual.get("status", "")).lower():
        blockers.append("visual storyboard is not approved")
    if visual.get("current_pptx_alignment_status") != "approved":
        blockers.append("visual storyboard is not explicitly aligned to the current PPTX")
    if "approved" not in str(prototype.get("status", "")).lower():
        blockers.append("six-slide visual prototype is not approved")
    if not (LESSON_ROOT / "10-design/activity-package-manifest.json").is_file():
        blockers.append("activity package manifest is missing")


def require_release_ready(authority_manifest: dict[str, Any], blockers: list[str]) -> None:
    require_authority_manual(authority_manifest, blockers)
    try:
        require_approved_design_inputs(blockers)
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"release design input manifest is unavailable or invalid: {error}")
    qa = authority_manifest.get("qa", {})
    if qa.get("status") not in {"recorded_current_pass", "passed"}:
        blockers.append("current QA is not recorded as passed")
    report_path = project_path(qa.get("current_report", "")) if qa.get("current_report") else None
    if not report_path or not report_path.is_file():
        blockers.append("current QA report is missing")
    rehearsal = qa.get("rehearsal", {})
    if rehearsal.get("audio_playback_status") != "passed":
        blockers.append("PPTX audio playback is not recorded as passed")
    if rehearsal.get("status") != "passed":
        blockers.append("300-minute teacher rehearsal is not passed")


def check(purpose: str, output_dir: str | None = None) -> dict[str, Any]:
    blockers: list[str] = []
    if purpose not in {"audit", "teacher-guide", "support", "prototype", "pptx", "semester-manual", "release"}:
        blockers.append(f"unknown production purpose: {purpose}")

    draft_path = validate_output_dir(output_dir, purpose, blockers)
    audit_production_paths(blockers)
    _source, _teaching, authority = load_base_manifests(blockers)

    if purpose in {"support", "pptx", "semester-manual", "release"}:
        require_authority_manual(authority, blockers)
        if purpose != "release":
            add_file_status_blockers(authority, blockers)
    if purpose == "prototype":
        try:
            visual = read_json(LESSON_ROOT / "10-design/visual-storyboard/manifest.json")
            if "approved" not in str(visual.get("status", "")).lower():
                blockers.append("visual storyboard is not approved")
        except (FileNotFoundError, json.JSONDecodeError) as error:
            blockers.append(f"visual storyboard manifest is unavailable or invalid: {error}")
    if purpose == "pptx":
        try:
            require_approved_design_inputs(blockers)
        except (FileNotFoundError, json.JSONDecodeError) as error:
            blockers.append(f"PPTX design input manifest is unavailable or invalid: {error}")
    if purpose == "release":
        add_file_status_blockers(authority, blockers)
        require_release_ready(authority, blockers)

    return {
        "purpose": purpose,
        "status": "ready" if not blockers else "blocked",
        "output_dir": str(draft_path) if draft_path else None,
        "blockers": blockers,
    }


def assert_ready(purpose: str, output_dir: Path | str | None = None) -> dict[str, Any]:
    result = check(purpose, str(output_dir) if output_dir is not None else None)
    if result["status"] != "ready":
        lines = "\n".join(f"- {item}" for item in result["blockers"])
        raise ProductionGateError(f"Production gate blocked ({purpose}):\n{lines}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--purpose", required=True)
    parser.add_argument("--output-dir")
    args = parser.parse_args()
    result = check(args.purpose, args.output_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())
