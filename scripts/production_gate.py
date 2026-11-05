#!/usr/bin/env python3
"""Fail-fast gates for the Boya lesson production workflow.

The gate is deliberately read-only. It checks the current authority and design
manifests before a generator is allowed to write a draft. A generator may never
write to authority, QA, release, or the historical archive.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from classroom_research_gate import check_classroom_research
from blocker_contract import blocker_records, with_blocker_records
from workflow_integrity import (
    audit_authority_manifest,
    audit_frozen_source_package,
    sha256,
)
from validate_lesson_identity import validate as validate_lesson_identity
from lesson_context import LessonContext, LessonContextError, resolve_lesson_context, _safe_project_path
from legacy_active_config import legacy_path, legacy_value
from workflow_integrity import resolve_relative_path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_ROOT = legacy_path("lesson_root", project_root=PROJECT_ROOT, config=CONFIG)
DESIGN_ROOT = legacy_path("draft_root", project_root=PROJECT_ROOT, config=CONFIG)
LESSON_REGISTRY = PROJECT_ROOT / CONFIG.get("lesson_registry", "course/lesson-registry.json")
OPENSLIDE_WORKSPACE_VALUE = CONFIG.get("open_slide_workspace")
OPENSLIDE_WORKSPACE = (
    _safe_project_path(PROJECT_ROOT, OPENSLIDE_WORKSPACE_VALUE)
    if isinstance(OPENSLIDE_WORKSPACE_VALUE, str) and OPENSLIDE_WORKSPACE_VALUE
    else None
)

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


def check_year1_online_objectives(review: Any, class_scope: str) -> None:
    """Fail closed for scoped Year 1 online reviews with no objectives page."""
    if not re.search(r"一年级|一年級|year[\s_-]*1|BOYA-LS-E[12]-Y1S[12]-[0-9]{4}[FS]", class_scope, re.IGNORECASE):
        return
    slides = review.get("slides") if isinstance(review, dict) else None
    expected = ["cover", "learning_flow", "learning_objectives"]
    if not isinstance(slides, list) or len(slides) < 3 or any(
        not isinstance(slides[i], dict) or slides[i].get("kind") != kind
        for i, kind in enumerate(expected)
    ):
        raise ValueError("Year 1 online review must begin with cover, learning_flow and learning_objectives")
    elements = slides[2].get("elements")
    if not isinstance(elements, list) or not any(
        isinstance(item, dict) and item.get("type") == "text"
        and isinstance(item.get("text"), str) and item["text"].strip()
        for item in elements
    ):
        raise ValueError("Year 1 online learning objectives page requires visible text")


def requires_year1_objectives(lesson_key: str, offering_id: str, class_scope: str, approved_at: datetime) -> bool:
    if not re.search(r"一年级|一年級|year[\s_-]*1|BOYA-LS-E[12]-Y1S[12]-[0-9]{4}[FS]", class_scope, re.IGNORECASE):
        return False
    cutoff = datetime.fromisoformat("2026-11-03T00:00:00+07:00")
    return (lesson_key == "boya-elementary-ii:lesson-01" and offering_id == "2027-spring") or approved_at >= cutoff


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
        context.authority_root if context else legacy_path("authority_root", project_root=PROJECT_ROOT, config=CONFIG),
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

    canonical = context.canonical_source if context else legacy_path("canonical_source", project_root=PROJECT_ROOT, config=CONFIG)
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
            if context else legacy_value("historical_package_evidence", project_root=PROJECT_ROOT, config=CONFIG)
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


def is_approved_status(value: Any) -> bool:
    """Accept explicit states, never a substring such as not_approved."""
    return isinstance(value, str) and (
        value == "approved" or value.startswith("approved_by_adam_")
        or value == "v5_approved_design_system_2026-08-20"
    )


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
    if not is_approved_status(visual.get("status")):
        blockers.append("visual storyboard is not approved")
    if visual.get("current_pptx_alignment_status") != "approved":
        blockers.append("visual storyboard is not explicitly aligned to the current PPTX")
    if not is_approved_status(prototype.get("status")):
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


def requires_classroom_research(approved_at: datetime) -> bool:
    """Only unchanged, hash-validated pre-rule approvals retain historical scope."""
    return approved_at >= datetime.fromisoformat("2026-11-04T00:00:00+07:00")


def check_content_approval(lesson_key: str | None, offering_id: str | None = None,
                           approval_record: str | None = None, artifact_scope: str | None = None,
                           artifact_id: str | None = None, class_scope: str | None = None,
                           research_record: str | None = None) -> dict[str, Any]:
    """Read-only prerequisite for new images, prototypes and PPTX, including drafts.

    Hashes prove which content was approved, not that a human actually approved it.
    Agents must record genuine explicit user evidence; never infer it from routing.
    """
    blockers: list[str] = []
    try:
        if not lesson_key:
            raise ValueError("explicit lesson_key is required")
        context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
        design = context.design_root
        scoped = approval_record is not None or artifact_scope is not None or artifact_id is not None or class_scope is not None
        if scoped:
            if not offering_id or not approval_record or artifact_scope not in {"online", "classroom"} or not artifact_id or not class_scope:
                raise ValueError("scoped approval requires offering_id, approval_record, artifact_scope, artifact_id and class_scope")
            if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", artifact_id) or not class_scope.strip():
                raise ValueError("artifact_id or class_scope is invalid")
            record_path, _ = resolve_relative_path(PROJECT_ROOT, approval_record, required_root=design / "approvals")
        else:
            record_path = design / "storyboard" / f"{context.lesson_id}-content-approval.json"
            resolve_relative_path(PROJECT_ROOT, record_path.relative_to(PROJECT_ROOT).as_posix(), required_root=design)
        record = read_json(record_path)
        if not isinstance(record, dict):
            raise ValueError("record must be an object")
        if record.get("status") != "approved":
            raise ValueError("current content is pending explicit human approval")
        if record.get("gate") != ("artifact-content" if scoped else "lesson-content"):
            raise ValueError("boundary/structure approval is not lesson-content approval")
        if scoped and (record.get("artifact_scope") != artifact_scope or record.get("artifact_id") != artifact_id
                       or record.get("class_scope") != class_scope):
            raise ValueError("approval artifact scope, identity or class scope does not match")
        if record.get("lesson_key") != lesson_key or record.get("offering_id") != context.offering_id:
            raise ValueError("lesson_key/offering_id mismatch")
        if not isinstance(record.get("approved_by"), str) or not record["approved_by"].strip():
            raise ValueError("named human approver is required")
        approved_at = datetime.fromisoformat(record.get("approved_at") or "")
        if approved_at.tzinfo is None:
            raise ValueError("approval timestamp must include timezone")
        artifacts = record.get("artifacts")
        if not isinstance(artifacts, list) or not artifacts:
            raise ValueError("approved content artifacts are required")
        paths: set[str] = set()
        for item in artifacts:
            if not isinstance(item, dict):
                raise ValueError("artifact must be an object")
            path, normalized = resolve_relative_path(PROJECT_ROOT, item.get("path"), required_root=context.lesson_root)
            if not (is_within(path, design) or is_within(path, context.source_root)) or path == record_path:
                raise ValueError("content must be a source/design input, not approval or authority")
            if normalized in paths or not path.is_file() or sha256(path) != item.get("sha256"):
                raise ValueError(f"duplicate, missing or changed content: {normalized}")
            paths.add(normalized)
        if scoped:
            source, source_name = resolve_relative_path(PROJECT_ROOT, record.get("source_path"), required_root=context.lesson_root)
            if not (is_within(source, context.source_root) or is_within(source, design / "source-snapshots")):
                raise ValueError("source must be a lesson source or a versioned source snapshot")
            review, review_name = resolve_relative_path(PROJECT_ROOT, record.get("review_path"), required_root=design)
            source_check, check_name = resolve_relative_path(PROJECT_ROOT, record.get("source_check_path"), required_root=design)
            if not source.is_file() or not review.is_file() or not source_check.is_file() or not source_check.read_text(encoding="utf-8").strip():
                raise ValueError("scoped approval requires source snapshot, review copy and source check")
            if (artifact_scope == "online" and requires_year1_objectives(
                    lesson_key, offering_id, class_scope, approved_at)):
                check_year1_online_objectives(read_json(review), class_scope)
            required = {source_name, review_name, check_name}
            if len(required) != 3:
                raise ValueError("source, review and source check must be distinct")
        else:
            required = {
                context.canonical_source.relative_to(PROJECT_ROOT).as_posix(),
                (design / "storyboard" / f"{context.lesson_id}-逐页文案审阅.md").relative_to(PROJECT_ROOT).as_posix(),
            }
        if not required.issubset(paths):
            raise ValueError("approval must bind canonical source and current slide-copy review")
        evidence, normalized = resolve_relative_path(PROJECT_ROOT, record.get("evidence"), required_root=design)
        if evidence == record_path or normalized in paths or not evidence.is_file():
            raise ValueError("independent human approval evidence is required")
        if sha256(evidence) != record.get("evidence_sha256") or not evidence.read_text(encoding="utf-8").strip():
            raise ValueError("human approval evidence is empty or changed")
    except (ValueError, TypeError, OSError, LessonContextError) as error:
        blockers.append(f"content approval required: {error}")
    # Hash checks above bind an unchanged pre-rule approval; no retrospective research.
    research_required = artifact_scope == "classroom" and (bool(blockers) or requires_classroom_research(approved_at))
    if research_required:
        research = check_classroom_research(PROJECT_ROOT, research_record, lesson_key or "", offering_id, artifact_id, class_scope)
        blockers.extend(research["blockers"])
        if research["status"] == "ready" and not blockers:
            try:
                research_data = read_json(PROJECT_ROOT / research_record)
                approved_data = read_json(record_path)
                if research_data["review"]["sha256"] != sha256(PROJECT_ROOT / approved_data["review_path"]):
                    blockers.append("classroom research review hash differs from the approved content version")
            except (ValueError, TypeError, KeyError, OSError) as error:
                blockers.append(f"classroom research approval binding: {error}")
    return with_blocker_records({"purpose": "content-approval", "lesson_key": lesson_key,
                                 "offering_id": offering_id, "artifact_scope": artifact_scope,
                                 "artifact_id": artifact_id, "class_scope": class_scope, "approval_record": approval_record,
                                 "status": "blocked" if blockers else "ready", "blockers": blockers},
                                scope="lesson-content")


def check_classroom_html_draft(lesson_key: str | None, output_dir: str | None = None,
                               offering_id: str | None = None, approval_record: str | None = None,
                               artifact_id: str | None = None, class_scope: str | None = None) -> dict[str, Any]:
    """Block new or revised in-person HTML drafts; historical HTML is read-only here."""
    blockers = [
        "new and revised Vinh in-person decks must use the classroom-native OpenSlide route; "
        "the classroom-html draft gate is disabled"
    ]
    return with_blocker_records({
        "purpose": "classroom-html", "stage": "draft", "lesson_key": lesson_key,
        "offering_id": offering_id, "output_dir": output_dir,
        "status": "blocked", "blockers": blockers,
        "write_performed": False, "artifact_state": "blocked",
        "approval_granted": False, "release_supported": False,
    }, scope="draft/classroom-html")


def validate_native_openslide_source(workspace_root: Path, artifact_id: str) -> dict[str, Any]:
    """Check the registered shared workspace source is a native editable React deck."""
    blockers: list[str] = []
    if not workspace_root.is_dir() or workspace_root.is_symlink():
        return {"status": "blocked", "blockers": ["shared OpenSlide workspace is missing or unsafe"]}

    deck_root = workspace_root / "slides" / artifact_id
    if not deck_root.is_dir() or deck_root.is_symlink():
        return {"status": "blocked", "blockers": [f"native OpenSlide deck folder is missing or unsafe: slides/{artifact_id}"]}

    symlinks = [path for path in deck_root.rglob("*") if path.is_symlink()]
    if symlinks:
        blockers.append(f"native OpenSlide deck contains a symlink: {symlinks[0].relative_to(deck_root)}")

    html_files = [path for path in deck_root.rglob("*") if path.is_file() and path.suffix.lower() in {".html", ".htm"}]
    if html_files:
        blockers.append(f"native OpenSlide deck contains an HTML file: {html_files[0].relative_to(deck_root)}")

    source = deck_root / "index.tsx"
    if not source.is_file() or source.is_symlink():
        blockers.append(f"native React slide source is missing: slides/{artifact_id}/index.tsx")
        return {"status": "blocked", "blockers": blockers}

    try:
        code = source.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        blockers.append(f"cannot read native React slide source: {error}")
        return {"status": "blocked", "blockers": blockers}

    if re.search(r"<\s*iframe\b|dangerouslySetInnerHTML\s*=|\bsrcDoc\s*=|data:text/html", code, re.IGNORECASE):
        blockers.append("native React source contains an HTML or iframe embedding mechanism")

    page_pattern = re.compile(
        rf"data-osd-stable-id\s*=\s*['\"]({re.escape(artifact_id)}-\d{{2}})['\"]"
    )
    pages = list(page_pattern.finditer(code))
    if not pages:
        blockers.append("native React source has no stable page IDs named <artifact-id>-<two-digit-page>")
    edit_boundary_count = len(re.findall(r"data-osd-edit-boundary\s*=\s*['\"]true['\"]", code))
    page_ids = [page.group(1) for page in pages]
    if len(page_ids) != len(set(page_ids)):
        blockers.append("native React source has duplicate stable page IDs")

    return {
        "status": "blocked" if blockers else "ready",
        "blockers": blockers,
        "source": str(source),
        "page_count": len(pages),
        "editable_text_boundary_count": edit_boundary_count,
    }


def check_classroom_native_draft(lesson_key: str | None, output_dir: str | None = None,
                                 offering_id: str | None = None, approval_record: str | None = None,
                                 artifact_id: str | None = None, class_scope: str | None = None,
                                 verify_output: bool = False,
                                 covered_approvals: list[str] | None = None,
                                 research_record: str | None = None) -> dict[str, Any]:
    """Gate a new native OpenSlide draft and optionally verify its generated React source."""
    blockers: list[str] = []
    target = None
    required = (lesson_key, offering_id, approval_record, artifact_id, class_scope)
    if any(not isinstance(value, str) or not value.strip() for value in required):
        blockers.append("classroom-native requires lesson_key, offering_id, scoped content approval, artifact_id and class_scope")
    else:
        bindings = [(lesson_key, approval_record)]
        for binding in covered_approvals or []:
            if not isinstance(binding, str) or "=" not in binding:
                blockers.append("each --covered-approval must use <lesson_key>=<approval-record-path>")
                continue
            covered_key, covered_record = binding.split("=", 1)
            if not covered_key.strip() or not covered_record.strip():
                blockers.append("each --covered-approval must include a lesson key and record path")
                continue
            bindings.append((covered_key.strip(), covered_record.strip()))
        seen_keys: set[str] = set()
        for covered_key, covered_record in bindings:
            if covered_key in seen_keys:
                blockers.append(f"duplicate native content approval for {covered_key}")
                continue
            seen_keys.add(covered_key)
            try:
                covered_context = resolve_lesson_context(PROJECT_ROOT, covered_key, offering_id)
                if covered_context.textbook_id != resolve_lesson_context(
                    PROJECT_ROOT, lesson_key, offering_id
                ).textbook_id:
                    blockers.append(f"covered lesson belongs to a different textbook: {covered_key}")
            except LessonContextError as error:
                blockers.append(f"covered lesson identity is invalid: {covered_key}: {error}")
                continue
            blockers.extend(check_content_approval(
                covered_key, offering_id, covered_record, "classroom", artifact_id, class_scope, research_record
            )["blockers"])

    try:
        if not lesson_key or not offering_id or not artifact_id:
            raise ValueError("lesson_key, offering_id and artifact_id are required")
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,99}", artifact_id):
            raise ValueError("artifact_id contains unsafe path characters")
        context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
        root = context.design_root / "open-slide-draft"
        if not isinstance(output_dir, str) or not output_dir.strip():
            raise ValueError("an explicit native OpenSlide draft output directory is required")
        raw = Path(output_dir)
        relative = raw.relative_to(PROJECT_ROOT).as_posix() if raw.is_absolute() else output_dir
        target, _ = resolve_relative_path(PROJECT_ROOT, relative, required_root=root)
        expected = _safe_project_path(root, f"{offering_id}/{artifact_id}")
        if target != expected:
            raise ValueError("scoped native output must use open-slide-draft/<offering>/<artifact-id>")
        if any(part in {"20-approved", "30-qa", "40-release", "90-archive", "archive"}
               for part in target.relative_to(context.design_root).parts):
            raise ValueError("protected directory names are not draft outputs")
    except (ValueError, TypeError, OSError, LessonContextError) as error:
        blockers.append(f"classroom-native draft: {error}")

    # Each scoped approval above enforces the research policy and binds the review hash.
    research_check = {"status": "checked-by-scoped-approvals", "blockers": []}
    source_check = None
    if verify_output and target is not None:
        if OPENSLIDE_WORKSPACE is None:
            source_check = {"status": "blocked", "blockers": ["project.config.json has no open_slide_workspace path"]}
        else:
            source_check = validate_native_openslide_source(OPENSLIDE_WORKSPACE, artifact_id or "")
        blockers.extend(source_check["blockers"])

    return with_blocker_records({
        "purpose": "classroom-native", "stage": "draft", "lesson_key": lesson_key,
        "offering_id": offering_id, "artifact_id": artifact_id,
        "class_scope": class_scope, "output_dir": str(target) if target else None,
        "source_check": source_check, "research_check": research_check,
        "status": "blocked" if blockers else "ready", "blockers": blockers,
        "write_performed": False, "artifact_state": "design_draft",
        "approval_granted": False, "release_supported": False,
    }, scope="draft/classroom-native")


def check_lesson_ppt_draft(lesson_key: str | None, output_dir: str | None = None,
                           offering_id: str | None = None, approval_record: str | None = None,
                           artifact_id: str | None = None, class_scope: str | None = None) -> dict[str, Any]:
    """Gate a lesson-specific PPTX draft without granting authority.

    The authority gate requires full approval evidence for its lesson scope. Later
    lessons need a safe, explicit draft stage while their own authority
    manifests are still being built.  This stage validates explicit content
    approval, identity, source integrity, boundary confirmation, and output scope; it never approves or
    writes an authority file.
    """
    blockers: list[str] = list(check_content_approval(lesson_key, offering_id, approval_record,
                               "online" if approval_record else None, artifact_id, class_scope)["blockers"])
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
        relative = candidate.relative_to(PROJECT_ROOT).as_posix()
        resolve_relative_path(PROJECT_ROOT, relative, required_root=draft_root)
        if approval_record and resolved != _safe_project_path(draft_root, f"online/{offering_id}/{artifact_id}"):
            raise ValueError("scoped online output must use pptx-draft/online/<offering>/<artifact-id>")
    except (ValueError, OSError, LessonContextError) as error:
        blockers.append(f"draft output is unsafe: {error}")
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

    if not approval_record:
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
        if not approval_record and (not boundary_path or not boundary_path.is_file()):
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
    if purpose in {"pptx", "prototype"}:
        blockers.extend(check_content_approval(lesson_key, offering_id)["blockers"])
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
            if not is_approved_status(visual.get("status")):
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
    parser.add_argument("--offering-id")
    parser.add_argument("--approval-record", help="Scoped, hash-bound artifact approval under this lesson's 10-design/approvals")
    parser.add_argument("--artifact-scope", choices=("online", "classroom"))
    parser.add_argument("--artifact-id", help="Exact online artifact or classroom session ID")
    parser.add_argument("--class-scope", help="Exact cohort or class group for the artifact")
    parser.add_argument("--covered-approval", action="append", default=[],
                        help="Additional covered lesson approval as <lesson_key>=<record-path>; repeat for combined decks")
    parser.add_argument("--research-record", help="Hash-bound actual ChatGPT research record; mandatory for classroom activity design")
    parser.add_argument("--exam-id")
    parser.add_argument("--verify-native-output", action="store_true",
                         help="Require and inspect native React OpenSlide source after authoring")
    args = parser.parse_args()
    if args.verify_native_output and args.purpose != "classroom-native":
        parser.error("--verify-native-output only applies to purpose=classroom-native")
    if args.purpose != "classroom-research" and any((args.approval_record, args.artifact_scope, args.artifact_id, args.class_scope)) and not all((args.approval_record, args.artifact_scope, args.artifact_id, args.class_scope, args.offering_id)):
        parser.error("scoped approval requires --offering-id, --approval-record, --artifact-scope, --artifact-id and --class-scope")
    if args.purpose in {"assessment-audio", "assessment-audio-current"}:
        try:
            from assessment_audio_gate import check_assessment_audio, check_current_assessment_audio
        except ModuleNotFoundError as error:
            result = with_blocker_records({"status": "blocked", "blockers": [f"assessment audio capability unavailable in this checkout: {error.name}; inspect vinh-uni-main read-only"], "write_performed": False})
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 1
        assessment_checker = check_current_assessment_audio if args.purpose == "assessment-audio-current" else check_assessment_audio
        result = assessment_checker(PROJECT_ROOT, args.exam_id, args.output_dir,
                                        args.offering_id, args.lesson_key)
        if args.stage != "authority":
            result["blockers"].append("assessment-audio uses its isolated exam route, not the lesson draft route")
            result["status"] = "blocked"
    elif args.exam_id is not None:
        result = {"status": "blocked", "blockers": ["exam-id only applies to assessment-audio or assessment-audio-current"]}
    elif args.purpose == "classroom-research":
        result = check_classroom_research(PROJECT_ROOT, args.research_record, args.lesson_key or "", args.offering_id, args.artifact_id, args.class_scope)
    elif args.purpose == "content-approval":
        result = check_content_approval(args.lesson_key, args.offering_id, args.approval_record, args.artifact_scope, args.artifact_id, args.class_scope, args.research_record)
    elif args.purpose == "classroom-html":
        if args.artifact_scope not in (None, "classroom"):
            result = {"status": "blocked", "blockers": ["classroom HTML requires classroom artifact scope"]}
        else:
            result = check_classroom_html_draft(args.lesson_key, args.output_dir, args.offering_id, args.approval_record, args.artifact_id, args.class_scope)
        if args.stage != "draft":
            result["blockers"].append("classroom-html production gate supports draft only; use the separately authorized classroom_release.py workflow for authority and release")
            result["status"] = "blocked"
            result["blocker_records"] = blocker_records(result["blockers"], scope="classroom-html")
    elif args.purpose == "classroom-native":
        if args.artifact_scope not in (None, "classroom"):
            result = {"status": "blocked", "blockers": ["native OpenSlide requires classroom artifact scope"]}
        elif args.stage != "draft":
            result = {"status": "blocked", "blockers": ["classroom-native production gate supports draft only"]}
        else:
            result = check_classroom_native_draft(
                args.lesson_key, args.output_dir, args.offering_id, args.approval_record,
                args.artifact_id, args.class_scope, args.verify_native_output, args.covered_approval, args.research_record,
            )
    elif args.stage == "draft":
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
            if args.artifact_scope not in (None, "online"):
                result = {"status": "blocked", "blockers": ["online PPT draft requires online artifact scope"]}
            else:
                result = check_lesson_ppt_draft(args.lesson_key, args.output_dir, args.offering_id, args.approval_record, args.artifact_id, args.class_scope)
    else:
        result = check(args.purpose, args.output_dir, lesson_key=args.lesson_key, offering_id=args.offering_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())
