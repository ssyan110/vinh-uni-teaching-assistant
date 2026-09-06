#!/usr/bin/env python3
"""Fail-fast gates for the Boya lesson production workflow.

The gate is deliberately read-only. It checks the current authority and design
manifests before a generator is allowed to write a draft. A generator may never
write to authority, QA, release, or the historical archive.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from blocker_contract import blocker_records, with_blocker_records
from workflow_integrity import (
    audit_authority_manifest,
    audit_frozen_source_package,
    sha256,
)
from validate_lesson_identity import validate as validate_lesson_identity
from lesson_context import LessonContext, LessonContextError, resolve_lesson_context
from workflow_integrity import resolve_relative_path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_ROOT = PROJECT_ROOT / CONFIG["lesson_root"]
DESIGN_ROOT = PROJECT_ROOT / CONFIG["draft_root"]
LESSON_REGISTRY = PROJECT_ROOT / CONFIG.get("lesson_registry", "course/lesson-registry.json")

PRODUCTION_SCRIPTS = (
    "scripts/build_lesson_01_teacher_guide.js",
    "scripts/build_lesson_01_support_materials.py",
    "scripts/build_lesson_01_activity_packages.py",
    "scripts/build_lesson_01_pptx.js",
    "scripts/build_lesson_01_pptx_native.js",
    "scripts/build_lesson_01_prototype.js",
    "scripts/build_lesson_01_visual_prototype.js",
    "scripts/build_l23_pptx_drafts.js",
    "scripts/build_full_teacher_manual.py",
    "scripts/build_release_package.py",
    "scripts/build_dashboard.py",
)
LEGACY_TOKENS = (
    "output/",
    "archive/legacy-materials-2026-08-27/",
    "share/",
)


class ProductionGateError(RuntimeError):
    """Raised when a generator is not allowed to write a draft."""


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


def default_output_dir(purpose: str, context: LessonContext | None = None) -> Path | None:
    design_root = context.design_root if context else DESIGN_ROOT
    defaults = {
        "teacher-guide": design_root / "teacher-manual-draft",
        "support": design_root / "support-draft",
        "prototype": design_root / "visual-prototype-draft",
        "pptx": design_root / "pptx-draft",
        "semester-manual": design_root / "teacher-manual-export-draft",
    }
    return defaults.get(purpose)


def validate_output_dir(value: str | None, purpose: str, blockers: list[str], context: LessonContext | None = None) -> Path | None:
    if purpose in {"audit", "release"}:
        return None
    default = default_output_dir(purpose, context)
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
    design_root = (context.design_root if context else DESIGN_ROOT).resolve()
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
    if context:
        for protected_path in (context.authority_root, context.qa_root, context.release_root, context.lesson_root / "90-archive"):
            if is_within(resolved, protected_path.resolve()):
                blockers.append(f"draft output is inside protected path: {protected_path}")
    return resolved


def add_file_status_blockers(manifest: dict[str, Any], blockers: list[str], context: LessonContext | None = None) -> None:
    audit = audit_authority_manifest(
        PROJECT_ROOT,
        context.authority_root if context else PROJECT_ROOT / CONFIG["authority_root"],
        manifest,
    )
    blockers.extend(audit["failures"])


def audit_production_paths(blockers: list[str], context: LessonContext | None = None) -> None:
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

    design_root = context.design_root if context else LESSON_ROOT / "10-design"
    for path in sorted(design_root.rglob("*.json")):
        text = path.read_text(encoding="utf-8")
        for token in LEGACY_TOKENS:
            if token in text:
                blockers.append(
                    f"design metadata contains legacy path token {token!r}: "
                    f"{path.relative_to(PROJECT_ROOT)}"
                )

    current_qa = (context.qa_root if context else LESSON_ROOT / "30-qa") / "current"
    if current_qa.is_dir():
        for path in sorted(current_qa.rglob("*.md")):
            text = path.read_text(encoding="utf-8")
            for token in LEGACY_TOKENS:
                if token in text:
                    blockers.append(
                        f"current QA points to legacy path token {token!r}: "
                        f"{path.relative_to(PROJECT_ROOT)}"
                    )


def audit_lesson_identity(blockers: list[str]) -> None:
    """Reject a generator run if the active textbook/lesson scope is ambiguous."""

    errors = validate_lesson_identity(LESSON_REGISTRY, PROJECT_ROOT / "project.config.json")
    blockers.extend(f"lesson identity: {error}" for error in errors)


def check_manifest_scope(manifest: dict[str, Any], label: str, context: LessonContext, blockers: list[str], *, require_key: bool = False) -> None:
    for field, expected in (("lesson_key", context.lesson_key), ("textbook_id", context.textbook_id), ("lesson_id", context.lesson_id)):
        actual = manifest.get(field)
        if field == "lesson_id" and actual == f"{context.textbook_id}-{context.lesson_id}":
            continue  # Historical manifest identity spelling.
        if (actual is not None and actual != expected) or (field == "lesson_key" and require_key and actual is None):
            blockers.append(f"lesson identity: {label} {field}={actual!r}, expected {expected!r}")


def scoped_manifest_path(value: Any, required_root: Path, label: str, blockers: list[str]) -> Path | None:
    try:
        return resolve_relative_path(PROJECT_ROOT, value, required_root=required_root)[0]
    except ValueError as error:
        blockers.append(f"{label} path is invalid: {error}")
        return None


def load_base_manifests(blockers: list[str], context: LessonContext | None = None) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    lesson_root = context.lesson_root if context else LESSON_ROOT
    source_manifest: dict[str, Any] = {}
    teaching_manifest: dict[str, Any] = {}
    authority_manifest: dict[str, Any] = {}
    try:
        source_manifest = read_json((context.source_root if context else lesson_root / "00-source") / "source-manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"source manifest is unavailable or invalid: {error}")
    try:
        teaching_manifest = read_json((context.design_root if context else lesson_root / "10-design") / "teaching-design/manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"teaching-design manifest is unavailable or invalid: {error}")
    try:
        authority_manifest = read_json((context.authority_root if context else lesson_root / "20-approved") / "lesson-manifest.json")
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"authority manifest is unavailable or invalid: {error}")

    if context:
        for label, manifest in (("source", source_manifest), ("teaching-design", teaching_manifest), ("authority", authority_manifest)):
            check_manifest_scope(manifest, label, context, blockers, require_key=label == "source")

    canonical = context.canonical_source if context else project_path(CONFIG["canonical_source"])
    if not canonical.is_file():
        blockers.append(f"canonical source is missing: {canonical.relative_to(PROJECT_ROOT)}")
    elif source_manifest.get("canonical_source_sha256") != sha256(canonical):
        blockers.append("canonical source hash differs from the approved source manifest")
    if source_manifest.get("source_status") != "verified":
        blockers.append("source gate is not verified")
    if source_manifest.get("source_qa_status") != "passed":
        blockers.append("source QA gate is not passed")
    if not str(teaching_manifest.get("status", "")).startswith("approved_by_adam_"):
        blockers.append("PBI teaching-design gate is not approved")
    if authority_manifest:
        # Explicit lessons own their evidence; never borrow the active L01 snapshot.
        source_package = authority_manifest.get("source_package")
        historical_source = (
            (source_package.get("path") if isinstance(source_package, dict) else None)
            if context else CONFIG.get("historical_package_evidence")
        )
        if not historical_source:
            blockers.append("configured historical package evidence is missing")
        else:
            source_audit = audit_frozen_source_package(
                PROJECT_ROOT,
                historical_source,
                authority_manifest,
            )
            blockers.extend(source_audit["failures"])
    return source_manifest, teaching_manifest, authority_manifest


def require_authority_manual(authority_manifest: dict[str, Any], blockers: list[str], context: LessonContext | None = None) -> None:
    if authority_manifest.get("authority_status") != "final_confirmed":
        blockers.append("authority manifest is not final_confirmed")
    teacher = authority_manifest.get("authority", {}).get("teacher_manual", {})
    teacher_path = project_path(teacher.get("path", "")) if teacher.get("path") else None
    if context and teacher.get("path"):
        teacher_path = scoped_manifest_path(teacher["path"], context.authority_root, "teacher manual", blockers)
    if not teacher_path or not teacher_path.is_file():
        blockers.append("approved teacher manual is missing from 20-approved")
    if teacher.get("status") != "final_confirmed":
        blockers.append("teacher manual is not marked final_confirmed")


def require_approved_design_inputs(blockers: list[str], context: LessonContext | None = None) -> None:
    design_root = context.design_root if context else LESSON_ROOT / "10-design"
    storyboard = read_json(design_root / "storyboard/manifest.json")
    visual = read_json(design_root / "visual-storyboard/manifest.json")
    prototype = read_json(design_root / "visual-prototype/manifest.json")

    if context:
        for label, manifest in (("storyboard", storyboard), ("visual storyboard", visual), ("visual prototype", prototype)):
            check_manifest_scope(manifest, label, context, blockers)

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
    if not (design_root / "activity-package-manifest.json").is_file():
        blockers.append("activity package manifest is missing")


def require_release_ready(authority_manifest: dict[str, Any], blockers: list[str], context: LessonContext | None = None) -> None:
    require_authority_manual(authority_manifest, blockers, context)
    try:
        require_approved_design_inputs(blockers, context)
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"release design input manifest is unavailable or invalid: {error}")
    qa = authority_manifest.get("qa", {})
    if not isinstance(qa, dict):
        blockers.append("authority qa must be an object")
        qa = {}
    if qa.get("status") not in {
        "recorded_current_pass",
        "passed",
        "static_qa_passed_pending_manual_acceptance",
    }:
        blockers.append("current QA is not recorded as passed")
    report_path = project_path(qa.get("current_report", "")) if qa.get("current_report") else None
    if context and qa.get("current_report"):
        report_path = scoped_manifest_path(qa["current_report"], context.qa_root / "current", "current QA report", blockers)
    if not report_path or not report_path.is_file():
        blockers.append("current QA report is missing")
    rehearsal = qa.get("rehearsal", {})
    if not isinstance(rehearsal, dict):
        blockers.append("authority qa.rehearsal must be an object")
        rehearsal = {}
    if rehearsal.get("audio_playback_status") != "passed":
        blockers.append("PPTX audio playback is not recorded as passed")
    if rehearsal.get("status") != "passed":
        blockers.append("approved contact-hour teacher rehearsal is not passed")


def check_lesson_ppt_draft(lesson_key: str | None, output_dir: str | None = None) -> dict[str, Any]:
    """Gate a lesson-specific PPTX draft without granting authority.

    The authority gate requires full approval evidence for its lesson scope. Later
    lessons need a safe, explicit draft stage while their own authority
    manifests are still being built.  This stage validates identity, source
    integrity, boundary confirmation, and output scope; it never approves or
    writes an authority file.
    """
    blockers: list[str] = []
    if not lesson_key:
        blockers.append("lesson-specific PPTX draft requires --lesson-key")
        return with_blocker_records({"purpose": "pptx", "stage": "draft", "status": "blocked", "output_dir": output_dir, "blockers": blockers}, scope="draft/pptx")

    try:
        registry = read_json(LESSON_REGISTRY)
    except (FileNotFoundError, json.JSONDecodeError) as error:
        blockers.append(f"lesson registry is unavailable or invalid: {error}")
        return with_blocker_records({"purpose": "pptx", "stage": "draft", "lesson_key": lesson_key, "status": "blocked", "output_dir": output_dir, "blockers": blockers}, scope="draft/pptx")

    entries = registry if isinstance(registry, list) else registry.get("lessons", [])
    entry = next((item for item in entries if item.get("lesson_key") == lesson_key), None)
    if not entry:
        blockers.append(f"lesson identity is not registered: {lesson_key}")
        return with_blocker_records({"purpose": "pptx", "stage": "draft", "lesson_key": lesson_key, "status": "blocked", "output_dir": output_dir, "blockers": blockers}, scope="draft/pptx")

    textbook_id = entry.get("textbook_id")
    lesson_id = entry.get("lesson_id")
    if not textbook_id or not lesson_id:
        blockers.append("registered lesson is missing textbook_id or lesson_id")
        return with_blocker_records({"purpose": "pptx", "stage": "draft", "lesson_key": lesson_key, "status": "blocked", "output_dir": output_dir, "blockers": blockers}, scope="draft/pptx")

    lesson_root = PROJECT_ROOT / "lessons" / textbook_id / lesson_id
    draft_root = lesson_root / "10-design" / "pptx-draft"
    candidate = Path(output_dir) if output_dir else draft_root
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    resolved = candidate.resolve()
    try:
        resolved.relative_to(draft_root.resolve())
    except ValueError:
        blockers.append(f"draft output must stay under {draft_root.resolve()}")
    for protected in (lesson_root / "20-approved", lesson_root / "30-qa", lesson_root / "40-release"):
        try:
            resolved.relative_to(protected.resolve())
            blockers.append(f"draft output is inside protected path: {protected}")
        except ValueError:
            pass

    canonical_path = lesson_root / "00-source" / "canonical-source.json"
    source_manifest_path = lesson_root / "00-source" / "source-manifest.json"
    refs_path = lesson_root / "10-design" / "storyboard" / f"{lesson_id}-source-refs.csv"
    boundary_dir = lesson_root / "10-design" / "storyboard"
    boundary_candidates = sorted(boundary_dir.glob(f"{lesson_id}-boundary-confirmation*.md"))
    boundary_path = boundary_candidates[-1] if boundary_candidates else None
    if not canonical_path.is_file():
        blockers.append(f"canonical source is missing: {canonical_path.relative_to(PROJECT_ROOT)}")
    if not source_manifest_path.is_file():
        blockers.append(f"source manifest is missing: {source_manifest_path.relative_to(PROJECT_ROOT)}")
    if not refs_path.is_file():
        blockers.append(f"source refs CSV is missing: {refs_path.relative_to(PROJECT_ROOT)}")
    if not boundary_path or not boundary_path.is_file():
        blockers.append(f"online/face boundary confirmation is missing under: {boundary_dir.relative_to(PROJECT_ROOT)}")
    if canonical_path.is_file() and source_manifest_path.is_file():
        try:
            canonical = read_json(canonical_path)
            source_manifest = read_json(source_manifest_path)
            canonical_key = canonical.get("lesson_key")
            if canonical_key and canonical_key != lesson_key:
                blockers.append("canonical source lesson_key does not match the requested lesson")
            elif not canonical_key:
                legacy_matches = (
                    canonical.get("textbook_id") == textbook_id
                    and canonical.get("lesson_id") == lesson_id
                    and lesson_id == "lesson-01"
                )
                if not legacy_matches:
                    blockers.append("canonical source lesson_key is missing for a non-legacy lesson")
            if source_manifest.get("lesson_key") != lesson_key:
                blockers.append("source manifest lesson_key does not match the requested lesson")
            expected = source_manifest.get("canonical_source_sha256")
            if expected and expected != sha256(canonical_path):
                blockers.append("canonical source hash differs from the lesson source manifest")
            if not (lesson_root / "00-source" / "audio-manifest.json").is_file():
                blockers.append("lesson audio manifest is missing")
            if not (lesson_root / "10-design" / "assets" / "image-manifest.json").is_file():
                blockers.append("lesson image manifest is missing")
        except (json.JSONDecodeError, OSError) as error:
            blockers.append(f"lesson source metadata is unavailable or invalid: {error}")

    return with_blocker_records({
        "purpose": "pptx",
        "stage": "draft",
        "lesson_key": lesson_key,
        "status": "ready" if not blockers else "blocked",
        "output_dir": str(resolved),
        "blockers": blockers,
    }, scope="draft/pptx")


def check(purpose: str, output_dir: str | None = None, lesson_key: str | None = None, offering_id: str | None = None) -> dict[str, Any]:
    """Check authority gates in an explicit scope, or the legacy active scope."""
    blockers: list[str] = []
    context = None
    if lesson_key is not None:
        try:
            context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
            # Resolve protected paths before any audit, so unsafe aliases fail closed.
            _ = (context.design_root, context.source_root, context.canonical_source,
                 context.authority_root, context.qa_root, context.release_root)
        except LessonContextError as error:
            return with_blocker_records({
                "purpose": purpose, "lesson_key": lesson_key, "status": "blocked",
                "output_dir": output_dir, "blockers": [f"lesson identity: {error}"],
            }, scope=f"authority/{purpose}")
    # Keep legacy helper call shapes for existing integrations and mocks.
    scope = (context,) if context else ()
    design_root = context.design_root if context else LESSON_ROOT / "10-design"
    if purpose not in {"audit", "teacher-guide", "support", "prototype", "pptx", "semester-manual", "release"}:
        blockers.append(f"unknown production purpose: {purpose}")

    draft_path = validate_output_dir(output_dir, purpose, blockers, *scope)
    if context is None:
        audit_lesson_identity(blockers)
    audit_production_paths(blockers, *scope)
    _source, _teaching, authority = load_base_manifests(blockers, *scope)

    if purpose in {"support", "pptx", "semester-manual", "release"}:
        require_authority_manual(authority, blockers, *scope)
    if purpose in {"audit", "support", "pptx", "semester-manual", "release"}:
        add_file_status_blockers(authority, blockers, *scope)
    if purpose == "prototype":
        try:
            visual = read_json(design_root / "visual-storyboard/manifest.json")
            if context:
                check_manifest_scope(visual, "visual storyboard", context, blockers)
            if "approved" not in str(visual.get("status", "")).lower():
                blockers.append("visual storyboard is not approved")
        except (FileNotFoundError, json.JSONDecodeError) as error:
            blockers.append(f"visual storyboard manifest is unavailable or invalid: {error}")
    if purpose == "pptx":
        try:
            require_approved_design_inputs(blockers, *scope)
        except (FileNotFoundError, json.JSONDecodeError) as error:
            blockers.append(f"PPTX design input manifest is unavailable or invalid: {error}")
    if purpose == "release":
        require_release_ready(authority, blockers, *scope)

    return with_blocker_records({
        "purpose": purpose,
        "status": "ready" if not blockers else "blocked",
        "output_dir": str(draft_path) if draft_path else None,
        **({"lesson_key": context.lesson_key} if context else {}),
        "blockers": blockers,
    }, scope=f"authority/{purpose}")


def assert_ready(purpose: str, output_dir: Path | str | None = None, lesson_key: str | None = None) -> dict[str, Any]:
    result = check(purpose, str(output_dir) if output_dir is not None else None, **({"lesson_key": lesson_key} if lesson_key is not None else {}))
    if result["status"] != "ready":
        lines = "\n".join(f"- {item}" for item in result["blockers"])
        raise ProductionGateError(f"Production gate blocked ({purpose}):\n{lines}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--purpose", required=True)
    parser.add_argument("--output-dir")
    parser.add_argument("--stage", choices=("authority", "draft"), default="authority")
    parser.add_argument("--lesson-key")
    args = parser.parse_args()
    if args.stage == "draft":
        if args.purpose != "pptx":
            result = {
                "purpose": args.purpose,
                "stage": "draft",
                "status": "blocked",
                "output_dir": args.output_dir,
                "blockers": ["draft stage is only available for purpose=pptx"],
                "blocker_records": blocker_records(["draft stage is only available for purpose=pptx"], scope="draft"),
            }
        else:
            result = check_lesson_ppt_draft(args.lesson_key, args.output_dir)
    else:
        result = check(args.purpose, args.output_dir, lesson_key=args.lesson_key)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())
