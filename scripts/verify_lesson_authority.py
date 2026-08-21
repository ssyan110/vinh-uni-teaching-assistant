#!/usr/bin/env python3
"""Read-only verification for a lesson authority manifest and release."""

from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

from production_gate import check as check_production_workflow


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
MANIFEST_PATH = PROJECT_ROOT / CONFIG["authority_root"] / "lesson-manifest.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(
        p
        for p in root.rglob("*")
        if p.is_file() and p.name != ".DS_Store" and not p.name.startswith("~$")
    ):
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(sha256(path)))
        digest.update(b"\n")
    return digest.hexdigest()


def verify() -> dict[str, object]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    failures: list[str] = []
    checked = 0
    for item in manifest.get("files", []):
        path = PROJECT_ROOT / item["path"]
        checked += 1
        if not path.is_file():
            failures.append(f"missing authority file: {item['path']}")
        elif sha256(path) != item["sha256"]:
            failures.append(f"authority hash mismatch: {item['path']}")

    source_path = PROJECT_ROOT / manifest["source_package"]["path"]
    source_tree = tree_hash(source_path)
    if source_tree != manifest["source_package"]["tree_sha256"]:
        failures.append("frozen final package changed since migration")

    release_zip_path = PROJECT_ROOT / manifest["release"]["latest_zip_path"]
    release_root = PROJECT_ROOT / manifest["release"]["latest_release_path"] / "第一课-教学资料"
    release_tree = tree_hash(release_root)
    if release_tree != manifest["release"].get("tree_sha256"):
        failures.append("release tree hash mismatch")
    if not release_zip_path.is_file():
        failures.append("release ZIP is missing")
    else:
        actual_zip_sha256 = sha256(release_zip_path)
        expected_zip_sha256 = manifest["release"].get("zip_sha256")
        if expected_zip_sha256 and actual_zip_sha256 != expected_zip_sha256:
            failures.append("release ZIP hash mismatch")
        with zipfile.ZipFile(release_zip_path) as archive:
            bad_activity_pdfs = [
                name for name in archive.namelist()
                if "/03-活动卡/" in name and name.lower().endswith(".pdf")
            ]
            if bad_activity_pdfs:
                failures.append("activity PDF found in release ZIP")

    activity_root = PROJECT_ROOT / CONFIG["authority_root"] / "activities"
    if any("可编辑原稿" in path.parts for path in activity_root.rglob("*")):
        failures.append("legacy editable-source layer found under authority activities")
    if list(activity_root.rglob("*.pdf")):
        failures.append("activity PDF found under authority activities")

    workflow_audit = check_production_workflow("audit")
    failures.extend(
        f"production workflow audit: {blocker}"
        for blocker in workflow_audit["blockers"]
    )

    rehearsal = manifest.get("qa", {}).get("rehearsal", {})
    delivery_blockers = []
    if rehearsal.get("audio_playback_status") != "passed":
        delivery_blockers.append("PPTX audio playback is not recorded as passed")
    if rehearsal.get("status") != "passed":
        delivery_blockers.append("300-minute teacher rehearsal is not passed")
    delivery_status = "ready" if not delivery_blockers else "blocked"

    return {
        "manifest": str(MANIFEST_PATH),
        "checked_authority_files": checked,
        "source_package_tree_sha256": source_tree,
        "release_tree_sha256": release_tree,
        "release_zip_sha256": sha256(release_zip_path) if release_zip_path.is_file() else None,
        "production_workflow_audit": workflow_audit,
        "delivery_status": delivery_status,
        "delivery_blockers": delivery_blockers,
        "status": "passed" if not failures else "failed",
        "failures": failures,
    }


if __name__ == "__main__":
    result = verify()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["status"] == "passed" else 1)
