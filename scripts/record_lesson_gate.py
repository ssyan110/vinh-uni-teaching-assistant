#!/usr/bin/env python3
"""Record a real human approval, playback check or rehearsal for one lesson.

This command changes workflow metadata only. It resolves an explicit lesson_key,
requires evidence from that lesson tree and never copies or regenerates teaching
artifacts.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from datetime import date
from pathlib import Path
from typing import Any

from lesson_context import LessonContext, resolve_lesson_context
from workflow_integrity import resolve_relative_path, sha256


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return value


def save_json(path: Path, data: dict[str, Any]) -> None:
    """Atomically replace workflow metadata after every validation has passed."""

    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def validate_date(value: str) -> str:
    date.fromisoformat(value)
    return value


def validate_evidence(
    project_root: Path,
    lesson_root: Path,
    value: str,
) -> tuple[str, str]:
    raw = Path(value)
    project = project_root.resolve()
    lesson = lesson_root.resolve()
    if raw.is_absolute():
        relative = None
        for project_alias in (project_root.absolute(), project):
            try:
                relative = raw.relative_to(project_alias).as_posix()
                break
            except ValueError:
                continue
        if relative is None:
            raise ValueError("evidence must be inside the project")
    else:
        relative = raw.as_posix()
    try:
        resolved, normalized = resolve_relative_path(
            project,
            relative,
            required_root=lesson,
        )
    except ValueError as error:
        raise ValueError("evidence must belong to the selected lesson tree") from error
    if not resolved.is_file():
        raise FileNotFoundError(f"evidence file is missing or unsafe: {resolved}")
    return normalized, sha256(resolved)


def validate_manifest_identity(data: dict[str, Any], context: LessonContext) -> None:
    checks = {
        "lesson_key": context.lesson_key,
        "textbook_id": context.textbook_id,
        "lesson_id": context.lesson_id,
        "offering_id": context.offering_id,
    }
    for field, expected in checks.items():
        actual = data.get(field)
        if actual is not None and actual != expected:
            raise RuntimeError(
                f"target manifest {field} does not match selected lesson: "
                f"{actual!r} != {expected!r}"
            )


def record(
    context: LessonContext,
    gate: str,
    approved_by: str,
    approved_at: str,
    evidence: str,
    evidence_sha256: str,
) -> Path:
    lesson_root = context.lesson_root
    if gate == "storyboard":
        path = lesson_root / "10-design/storyboard/manifest.json"
        data = load_json(path)
        validate_manifest_identity(data, context)
        if not data.get("current_revision"):
            raise RuntimeError("storyboard has no current revision to approve")
        data["current_revision_approved_at"] = approved_at
        data["current_revision_approved_by"] = approved_by
        data["current_revision_status"] = f"approved_by_{approved_by}_{approved_at}"
        data["current_revision_approval_evidence"] = evidence
        data["current_revision_approval_evidence_sha256"] = evidence_sha256
    elif gate == "visual-alignment":
        path = lesson_root / "10-design/visual-storyboard/manifest.json"
        data = load_json(path)
        validate_manifest_identity(data, context)
        data["current_pptx_alignment_status"] = "approved"
        data["current_pptx_alignment_approved_by"] = approved_by
        data["current_pptx_alignment_approved_at"] = approved_at
        data["current_pptx_alignment_evidence"] = evidence
        data["current_pptx_alignment_evidence_sha256"] = evidence_sha256
    elif gate == "audio-playback":
        path = lesson_root / "20-approved/lesson-manifest.json"
        data = load_json(path)
        validate_manifest_identity(data, context)
        qa = data.setdefault("qa", {})
        rehearsal = qa.setdefault("rehearsal", {})
        rehearsal["audio_playback_status"] = "passed"
        rehearsal["audio_playback_verified_by"] = approved_by
        rehearsal["audio_playback_verified_at"] = approved_at
        rehearsal["audio_playback_evidence"] = evidence
        rehearsal["audio_playback_evidence_sha256"] = evidence_sha256
        if rehearsal.get("status") in {
            "pending_teacher_playback",
            "pending_manual_acceptance",
        }:
            rehearsal["status"] = "pending_teacher_rehearsal"
    elif gate == "rehearsal":
        path = lesson_root / "20-approved/lesson-manifest.json"
        data = load_json(path)
        validate_manifest_identity(data, context)
        qa = data.setdefault("qa", {})
        rehearsal = qa.setdefault("rehearsal", {})
        rehearsal.update({
            "status": "passed",
            "verified_by": approved_by,
            "verified_at": approved_at,
            "evidence": evidence,
            "evidence_sha256": evidence_sha256,
        })
        data["delivery_status"] = "ready_for_release"
    else:
        raise ValueError(f"unsupported gate: {gate}")

    save_json(path, data)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-key", required=True)
    parser.add_argument("--offering-id")
    parser.add_argument(
        "--gate",
        required=True,
        choices=("storyboard", "visual-alignment", "audio-playback", "rehearsal"),
    )
    parser.add_argument("--approved-by", required=True)
    parser.add_argument("--approved-at", default=date.today().isoformat())
    parser.add_argument("--evidence", required=True)
    parser.add_argument(
        "--confirm",
        action="store_true",
        help=(
            "Required acknowledgement that this records a real human approval, "
            "completed playback check or completed rehearsal."
        ),
    )
    args = parser.parse_args()
    if not args.confirm:
        parser.error("--confirm is required; this command changes workflow status metadata")
    if not re.fullmatch(r"[A-Za-z0-9_. -]+", args.approved_by):
        parser.error("--approved-by contains unsupported characters")

    context = resolve_lesson_context(PROJECT_ROOT, args.lesson_key, args.offering_id)
    approved_at = validate_date(args.approved_at)
    evidence, evidence_hash = validate_evidence(
        PROJECT_ROOT,
        context.lesson_root,
        args.evidence,
    )
    path = record(
        context,
        args.gate,
        args.approved_by,
        approved_at,
        evidence,
        evidence_hash,
    )
    print(json.dumps({
        "gate": args.gate,
        "status": "recorded",
        "lesson_key": context.lesson_key,
        "offering_id": context.offering_id,
        "manifest": path.relative_to(PROJECT_ROOT).as_posix(),
        "approved_by": args.approved_by,
        "approved_at": approved_at,
        "evidence": evidence,
        "evidence_sha256": evidence_hash,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
