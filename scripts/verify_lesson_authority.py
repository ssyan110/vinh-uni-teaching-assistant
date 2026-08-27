#!/usr/bin/env python3
"""Read-only, end-to-end verification for lesson authority and release."""

from __future__ import annotations

import hashlib
import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

from production_gate import check as check_production_workflow
from workflow_integrity import (
    audit_authority_manifest,
    audit_frozen_source_package,
    expected_release_entries,
    material_files,
    resolve_relative_path,
    sha256,
    tree_hash,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
AUTHORITY_ROOT = PROJECT_ROOT / CONFIG["authority_root"]
RELEASE_ROOT = PROJECT_ROOT / CONFIG["release_root"]
MANIFEST_PATH = AUTHORITY_ROOT / "lesson-manifest.json"
LATEST_PATH = RELEASE_ROOT / "latest-release.json"
PACKAGE_NAME = "第一课-教学资料"
RELEASE_ID_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}")


def add_failure(failures: list[str], message: str) -> None:
    if message not in failures:
        failures.append(message)


def read_json(path: Path, failures: list[str], label: str) -> dict[str, Any] | None:
    if not path.is_file():
        add_failure(failures, f"{label} is missing: {path.relative_to(PROJECT_ROOT)}")
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        add_failure(failures, f"{label} is invalid: {error}")
        return None
    if not isinstance(value, dict):
        add_failure(failures, f"{label} root is not an object")
        return None
    return value


def safe_release_path(
    value: Any,
    failures: list[str],
    label: str,
) -> Path | None:
    try:
        path, _normalized = resolve_relative_path(
            PROJECT_ROOT,
            value,
            required_root=RELEASE_ROOT,
        )
    except ValueError as error:
        add_failure(failures, f"invalid {label}: {error}")
        return None
    return path


def audit_release_directory(
    package_dir: Path | None,
    entries: list[dict[str, Any]],
    failures: list[str],
) -> tuple[str | None, dict[str, Path]]:
    if package_dir is None or not package_dir.is_dir():
        add_failure(failures, "release package directory is missing")
        return None, {}
    expected = {entry["release_path"]: entry for entry in entries}
    actual = {
        path.relative_to(package_dir).as_posix(): path
        for path in material_files(package_dir)
    }
    for path in sorted(set(expected) - set(actual)):
        add_failure(failures, f"release file is missing: {path}")
    for path in sorted(set(actual) - set(expected)):
        add_failure(failures, f"unapproved release file: {path}")
    for relative in sorted(set(expected) & set(actual)):
        path = actual[relative]
        item = expected[relative]
        if sha256(path) != item.get("sha256"):
            add_failure(failures, f"release file hash mismatch: {relative}")
        if path.stat().st_size != item.get("bytes"):
            add_failure(failures, f"release file byte count mismatch: {relative}")
    try:
        return tree_hash(package_dir), actual
    except (FileNotFoundError, ValueError) as error:
        add_failure(failures, f"release tree is invalid: {error}")
        return None, actual


def audit_release_zip(
    zip_path: Path | None,
    entries: list[dict[str, Any]],
    failures: list[str],
) -> str | None:
    if zip_path is None or not zip_path.is_file():
        add_failure(failures, "release ZIP is missing")
        return None
    zip_digest = sha256(zip_path)
    expected = {
        f"{PACKAGE_NAME}/{entry['release_path']}": entry
        for entry in entries
    }
    try:
        with zipfile.ZipFile(zip_path) as archive:
            infos = [info for info in archive.infolist() if not info.is_dir()]
            names = [info.filename for info in infos]
            if len(names) != len(set(names)):
                add_failure(failures, "release ZIP contains duplicate entries")
            for name in names:
                pure = PurePosixPath(name)
                if pure.is_absolute() or ".." in pure.parts or pure.parts[:1] != (PACKAGE_NAME,):
                    add_failure(failures, f"release ZIP contains unsafe path: {name}")
            for name in sorted(set(expected) - set(names)):
                add_failure(failures, f"release ZIP file is missing: {name}")
            for name in sorted(set(names) - set(expected)):
                add_failure(failures, f"release ZIP contains unapproved file: {name}")
            bad_member = archive.testzip()
            if bad_member:
                add_failure(failures, f"release ZIP CRC failed: {bad_member}")
            info_by_name = {info.filename: info for info in infos}
            for name in sorted(set(expected) & set(names)):
                data = archive.read(name)
                item = expected[name]
                if hashlib.sha256(data).hexdigest() != item.get("sha256"):
                    add_failure(failures, f"release ZIP file hash mismatch: {name}")
                if info_by_name[name].file_size != item.get("bytes"):
                    add_failure(failures, f"release ZIP file byte count mismatch: {name}")
    except (OSError, zipfile.BadZipFile, RuntimeError) as error:
        add_failure(failures, f"release ZIP is invalid: {error}")
    return zip_digest


def audit_latest_release(
    latest: dict[str, Any] | None,
    release_dir: Path | None,
    zip_path: Path | None,
    tree_digest: str | None,
    zip_digest: str | None,
    actual_files: dict[str, Path],
    entries: list[dict[str, Any]],
    failures: list[str],
) -> None:
    if latest is None or release_dir is None or zip_path is None:
        return
    expected_release_id = release_dir.name
    expected_release_root = release_dir.relative_to(PROJECT_ROOT).as_posix()
    expected_zip_path = zip_path.relative_to(PROJECT_ROOT).as_posix()
    checks = {
        "release_id": expected_release_id,
        "release_root": expected_release_root,
        "zip_path": expected_zip_path,
        "status": "immutable",
        "delivery_status": "ready",
        "copy_only": True,
        "tree_sha256": tree_digest,
        "zip_sha256": zip_digest,
        "file_count": len(actual_files),
        "activity_docx_count": sum(
            entry["category"] == "activity" for entry in entries
        ),
    }
    for key, expected in checks.items():
        if latest.get(key) != expected:
            add_failure(
                failures,
                f"latest-release {key} mismatch: expected={expected!r}, actual={latest.get(key)!r}",
            )

    latest_files = latest.get("files")
    if not isinstance(latest_files, list):
        add_failure(failures, "latest-release files list is missing")
        return
    declared: dict[str, dict[str, Any]] = {}
    for item in latest_files:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            add_failure(failures, "latest-release contains an invalid file entry")
            continue
        if item["path"] in declared:
            add_failure(failures, f"latest-release has duplicate file path: {item['path']}")
            continue
        declared[item["path"]] = item

    actual = {
        f"{PACKAGE_NAME}/{relative}": path
        for relative, path in actual_files.items()
    }
    for path in sorted(set(actual) - set(declared)):
        add_failure(failures, f"latest-release file entry is missing: {path}")
    for path in sorted(set(declared) - set(actual)):
        add_failure(failures, f"latest-release has stale file entry: {path}")
    for relative in sorted(set(actual) & set(declared)):
        path = actual[relative]
        item = declared[relative]
        if item.get("sha256") != sha256(path):
            add_failure(failures, f"latest-release file hash mismatch: {relative}")
        if item.get("bytes") != path.stat().st_size:
            add_failure(failures, f"latest-release file byte count mismatch: {relative}")


def verify() -> dict[str, object]:
    failures: list[str] = []
    manifest = read_json(MANIFEST_PATH, failures, "authority manifest")
    if manifest is None:
        return {
            "manifest": str(MANIFEST_PATH),
            "checked_authority_files": 0,
            "status": "failed",
            "failures": failures,
        }

    authority_audit = audit_authority_manifest(
        PROJECT_ROOT,
        AUTHORITY_ROOT,
        manifest,
    )
    for failure in authority_audit["failures"]:
        add_failure(failures, failure)

    source_audit = audit_frozen_source_package(
        PROJECT_ROOT,
        CONFIG.get("historical_package_evidence", ""),
        manifest,
    )
    for failure in source_audit["failures"]:
        add_failure(failures, failure)

    entries, mapping_failures = expected_release_entries(manifest)
    for failure in mapping_failures:
        add_failure(failures, failure)

    release = manifest.get("release") if isinstance(manifest.get("release"), dict) else {}
    # A newly promoted authority can be valid while its next immutable release
    # is intentionally pending manual playback/rehearsal.  Keep the previous
    # immutable release as historical evidence, but do not compare its old
    # hashes to the new authority or call it the current delivery.
    release_pending = release.get("status") == "pending_manual_acceptance"
    release_dir = None
    zip_path = None
    package_dir = None
    release_tree = None
    release_zip_sha256 = None
    actual_release_files: list[dict[str, object]] = []
    if not release_pending:
        release_dir = safe_release_path(
            release.get("latest_release_path"),
            failures,
            "latest release path",
        )
        zip_path = safe_release_path(
            release.get("latest_zip_path"),
            failures,
            "latest release ZIP path",
        )
        if release_dir is not None:
            relative_parts = release_dir.relative_to(RELEASE_ROOT.resolve()).parts
            if len(relative_parts) != 1 or not RELEASE_ID_PATTERN.fullmatch(relative_parts[0]):
                add_failure(failures, "latest release path does not use one safe release id")
            package_dir = release_dir / PACKAGE_NAME
        if zip_path is not None and release_dir is not None:
            if zip_path.parent.resolve() != RELEASE_ROOT.resolve():
                add_failure(failures, "latest release ZIP is not directly under release root")
            if zip_path.name != f"{release_dir.name}.zip":
                add_failure(failures, "release directory and ZIP ids do not match")

        release_tree, actual_release_files = audit_release_directory(
            package_dir,
            entries,
            failures,
        )
        if release_tree != release.get("tree_sha256"):
            add_failure(failures, "release tree hash mismatch")
        release_zip_sha256 = audit_release_zip(zip_path, entries, failures)
        if release_zip_sha256 != release.get("zip_sha256"):
            add_failure(failures, "release ZIP hash mismatch")

        latest = read_json(LATEST_PATH, failures, "latest-release metadata")
        audit_latest_release(
            latest,
            release_dir,
            zip_path,
            release_tree,
            release_zip_sha256,
            actual_release_files,
            entries,
            failures,
        )

    activity_root = AUTHORITY_ROOT / "activities"
    if any("可编辑原稿" in path.parts for path in activity_root.rglob("*")):
        add_failure(failures, "legacy editable-source layer found under authority activities")

    workflow_audit = check_production_workflow("audit")
    for blocker in workflow_audit["blockers"]:
        if blocker not in failures:
            add_failure(failures, f"production workflow audit: {blocker}")

    rehearsal = manifest.get("qa", {}).get("rehearsal", {})
    delivery_blockers = []
    if rehearsal.get("audio_playback_status") != "passed":
        delivery_blockers.append("PPTX audio playback is not recorded as passed")
    if rehearsal.get("status") != "passed":
        delivery_blockers.append("300-minute teacher rehearsal is not passed")
    if failures:
        delivery_blockers.append("authority or release integrity verification failed")
    delivery_status = "ready" if not delivery_blockers else "blocked"

    return {
        "manifest": str(MANIFEST_PATH),
        "checked_authority_files": authority_audit["checked_files"],
        "actual_authority_files": authority_audit["actual_file_count"],
        "source_package_file_count": source_audit["file_count"],
        "source_package_tree_sha256": source_audit["tree_sha256"],
        "release_file_count": len(actual_release_files),
        "release_tree_sha256": release_tree,
        "release_zip_sha256": release_zip_sha256,
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
