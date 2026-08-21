#!/usr/bin/env python3
"""Record an explicit approval, audio-playback, or rehearsal result for Lesson 1.

This command changes workflow metadata only. It never copies, regenerates, or
overwrites PPTX, DOCX, activity cards, QA media, or release files.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_ROOT = PROJECT_ROOT / CONFIG["lesson_root"]


def project_path(value: str) -> Path:
    candidate = Path(value)
    return candidate if candidate.is_absolute() else PROJECT_ROOT / candidate


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate_date(value: str) -> str:
    date.fromisoformat(value)
    return value


def validate_evidence(value: str) -> str:
    path = project_path(value).resolve()
    try:
        path.relative_to(PROJECT_ROOT.resolve())
    except ValueError as error:
        raise ValueError("evidence must be inside the project") from error
    if not path.is_file():
        raise FileNotFoundError(f"evidence file is missing: {path}")
    return path.relative_to(PROJECT_ROOT).as_posix()


def record(gate: str, approved_by: str, approved_at: str, evidence: str) -> Path:
    if gate == "storyboard":
        path = LESSON_ROOT / "10-design/storyboard/manifest.json"
        data = load_json(path)
        if not data.get("current_revision"):
            raise RuntimeError("storyboard has no current revision to approve")
        data["current_revision_approved_at"] = approved_at
        data["current_revision_approved_by"] = approved_by
        data["current_revision_status"] = f"approved_by_{approved_by}_{approved_at}"
    elif gate == "visual-alignment":
        path = LESSON_ROOT / "10-design/visual-storyboard/manifest.json"
        data = load_json(path)
        data["current_pptx_alignment_status"] = "approved"
        data["current_pptx_alignment_approved_by"] = approved_by
        data["current_pptx_alignment_approved_at"] = approved_at
        data["current_pptx_alignment_evidence"] = evidence
    elif gate == "audio-playback":
        path = LESSON_ROOT / "20-approved/lesson-manifest.json"
        data = load_json(path)
        qa = data.setdefault("qa", {})
        rehearsal = qa.setdefault("rehearsal", {})
        rehearsal["audio_playback_status"] = "passed"
        rehearsal["audio_playback_verified_by"] = approved_by
        rehearsal["audio_playback_verified_at"] = approved_at
        rehearsal["audio_playback_evidence"] = evidence
        if rehearsal.get("status") == "pending_teacher_playback":
            rehearsal["status"] = "pending_300_minute_rehearsal"
    elif gate == "rehearsal":
        path = LESSON_ROOT / "20-approved/lesson-manifest.json"
        data = load_json(path)
        qa = data.setdefault("qa", {})
        qa["rehearsal"] = {
            "status": "passed",
            "verified_by": approved_by,
            "verified_at": approved_at,
            "evidence": evidence,
        }
        data["delivery_status"] = "ready_for_release"
    else:
        raise ValueError(f"unsupported gate: {gate}")

    save_json(path, data)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
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
        help="Required acknowledgement that this command records a real approval, completed audio playback, or completed rehearsal.",
    )
    args = parser.parse_args()
    if not args.confirm:
        parser.error("--confirm is required; this command changes workflow status metadata")
    if not re.fullmatch(r"[A-Za-z0-9_. -]+", args.approved_by):
        parser.error("--approved-by contains unsupported characters")
    approved_at = validate_date(args.approved_at)
    evidence = validate_evidence(args.evidence)
    path = record(args.gate, args.approved_by, approved_at, evidence)
    print(json.dumps({
        "gate": args.gate,
        "status": "recorded",
        "manifest": str(path),
        "approved_by": args.approved_by,
        "approved_at": approved_at,
        "evidence": evidence,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
