#!/usr/bin/env python3
"""Plan scoped releases read-only; retain the legacy active-context release builder."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from production_gate import assert_ready, check as check_release_gate, check_manifest_scope
from blocker_contract import blocker_records
from lesson_context import LessonContextError, resolve_lesson_context, _safe_project_path
from workflow_integrity import (
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
RELEASE_ID_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}")


def package_name() -> str:
    """Build the canonical package folder from the authority lesson identity.

    Existing historical packages keep their original names; only newly built
    releases use the current lesson-<nn>-教材包 convention.
    """
    lesson_id = "lesson-01"
    textbook_id = None
    if MANIFEST_PATH.is_file():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            lesson_id = str(manifest.get("lesson_id", lesson_id))
            textbook_id = manifest.get("textbook_id")
        except (OSError, json.JSONDecodeError):
            pass
    # Older test fixtures and historical authority snapshots predate the
    # compound textbook identity. Preserve their legacy package folder; new
    # lesson-key-scoped manifests use the canonical name below.
    if not textbook_id:
        return "第一课-教学资料"
    match = re.fullmatch(r"lesson-(\d{2})", lesson_id)
    if not match:
        raise ValueError(f"authority manifest has invalid lesson_id: {lesson_id}")
    return f"lesson-{match.group(1)}-教材包"


def validate_release_id(value: str | None) -> str:
    if not value:
        raise ValueError(
            "release id is required; set BOYA_RELEASE_ID to a new immutable version id"
        )
    if value in {".", ".."} or not RELEASE_ID_PATTERN.fullmatch(value):
        raise ValueError(
            "release id must use only letters, digits, dot, underscore, and hyphen"
        )
    return value


def release_paths(release_id: str) -> tuple[Path, Path, Path]:
    release_dir = RELEASE_ROOT / release_id
    package_dir = release_dir / package_name()
    zip_path = RELEASE_ROOT / f"{release_id}.zip"
    release_root = RELEASE_ROOT.resolve()
    for path in (release_dir.resolve(), package_dir.resolve(), zip_path.resolve()):
        path.relative_to(release_root)
    return release_dir, package_dir, zip_path


def copy_immutable(source: Path, destination: Path) -> None:
    if not source.is_file() or source.is_symlink():
        raise FileNotFoundError(f"Missing approved authority file: {source}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise RuntimeError(f"Refusing to overwrite release content: {destination}")
    shutil.copy2(source, destination)


def write_deterministic_zip(package_dir: Path, release_dir: Path, zip_path: Path) -> None:
    """Write a reproducible ZIP and publish it only after the archive closes."""

    if zip_path.exists():
        raise RuntimeError(f"Refusing to overwrite release ZIP: {zip_path}")
    pending = zip_path.with_name(f".{zip_path.name}.pending")
    if pending.exists():
        raise RuntimeError(f"Incomplete release ZIP requires review: {pending}")
    zip_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(pending, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in material_files(package_dir):
            archive_name = path.relative_to(release_dir).as_posix()
            info = zipfile.ZipInfo(archive_name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (0o100644 & 0xFFFF) << 16
            archive.writestr(
                info,
                path.read_bytes(),
                compress_type=zipfile.ZIP_DEFLATED,
                compresslevel=9,
            )
    os.replace(pending, zip_path)


def write_json_atomic(path: Path, data: dict[str, object]) -> None:
    pending = path.with_name(f".{path.name}.pending")
    if pending.exists():
        raise RuntimeError(f"Incomplete metadata write requires review: {pending}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with pending.open("x", encoding="utf-8") as handle:
        handle.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(pending, path)


def plan_release(
    lesson_key: str,
    release_id: str | None,
    offering_id: str | None = None,
) -> dict[str, object]:
    """Return a complete release plan without creating or modifying any file."""
    blockers: list[str] = []
    try:
        release_id = validate_release_id(release_id)
        context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
        authority_root = context.authority_root
        release_root = context.release_root
        manifest_path = _safe_project_path(authority_root, "lesson-manifest.json")
    except (ValueError, LessonContextError) as error:
        return {"command": "plan", "lesson_key": lesson_key, "release_id": release_id,
                "status": "blocked", "write_performed": False,
                "blockers": [str(error)],
                "blocker_records": blocker_records([str(error)], scope="release/plan"),
                "entries": []}

    gate = check_release_gate(
        "release", lesson_key=lesson_key, offering_id=context.offering_id
    )
    blockers.extend(f"release gate: {item}" for item in gate.get("blockers", []))
    manifest: dict[str, object] | None = None
    authority_manifest_sha256: str | None = None
    if not manifest_path.is_file() or manifest_path.is_symlink():
        blockers.append(f"authority manifest is missing or unsafe: {manifest_path}")
    else:
        try:
            loaded = json.loads(manifest_path.read_text(encoding="utf-8"))
            if not isinstance(loaded, dict):
                raise ValueError("authority manifest root must be an object")
            manifest = loaded
            authority_manifest_sha256 = sha256(manifest_path)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            blockers.append(f"authority manifest is invalid: {error}")

    entries: list[dict[str, object]] = []
    package = f"{context.lesson_id}-教材包"
    try:
        release_dir = _safe_project_path(release_root, release_id)
        transaction_dir = _safe_project_path(release_root, f".{release_id}.transaction")
        package_dir = _safe_project_path(release_dir, package)
        zip_path = _safe_project_path(release_root, f"{release_id}.zip")
    except LessonContextError as error:
        blockers.append(f"release destination is unsafe: {error}")
        release_dir = package_dir = zip_path = transaction_dir = release_root

    for path, label in ((release_dir, "release directory"), (zip_path, "release ZIP"),
                        (transaction_dir, "release transaction")):
        if path.exists() or path.is_symlink():
            blockers.append(f"{label} already exists or is unsafe: {path}")
    pending_zip = zip_path.with_name(f".{zip_path.name}.pending")
    if pending_zip.exists() or pending_zip.is_symlink():
        blockers.append(f"incomplete release ZIP requires review: {pending_zip}")
    recovery_artifacts = (
        release_root / ".latest-release.json.pending",
        release_root / ".latest-release.json.rollback",
        authority_root / ".lesson-manifest.json.pending",
        authority_root / ".lesson-manifest.json.rollback",
    )
    for recovery_path in recovery_artifacts:
        if recovery_path.exists() or recovery_path.is_symlink():
            blockers.append(f"incomplete metadata transaction requires review: {recovery_path}")

    if manifest is not None:
        check_manifest_scope(manifest, "authority", context, blockers, require_key=True)
        if manifest.get("lesson_id") != context.lesson_id:
            blockers.append("authority lesson_id must match the selected context")
        mapped, mapping_failures = expected_release_entries(manifest)
        blockers.extend(f"release mapping: {item}" for item in mapping_failures)
        seen_destinations: set[str] = set()
        for item in mapped:
            try:
                source, source_normalized = resolve_relative_path(
                    PROJECT_ROOT, item.get("source_path"), required_root=authority_root
                )
                destination = _safe_project_path(package_dir, str(item.get("release_path", "")))
                destination_normalized = destination.relative_to(PROJECT_ROOT.resolve()).as_posix()
                if destination_normalized in seen_destinations:
                    raise ValueError(f"duplicate release destination: {destination_normalized}")
                seen_destinations.add(destination_normalized)
                if not source.is_file() or source.is_symlink():
                    raise ValueError(f"approved authority source is missing or unsafe: {source_normalized}")
                actual_hash, actual_bytes = sha256(source), source.stat().st_size
                if actual_hash != item.get("sha256") or actual_bytes != item.get("bytes"):
                    raise ValueError(f"authority changed after approval: {source_normalized}")
                entries.append({
                    "category": item.get("category"), "source_path": source_normalized,
                    "destination_path": destination_normalized,
                    "sha256": actual_hash, "bytes": actual_bytes,
                })
            except (ValueError, LessonContextError, OSError) as error:
                blockers.append(f"release entry is invalid: {error}")

    return {
        "command": "plan", "lesson_key": lesson_key, "offering_id": context.offering_id,
        "release_id": release_id, "status": "ready" if not blockers else "blocked",
        "write_performed": False,
        "authority_manifest": manifest_path.relative_to(PROJECT_ROOT).as_posix(),
        "authority_manifest_sha256": authority_manifest_sha256,
        "release_dir": release_dir.relative_to(PROJECT_ROOT.resolve()).as_posix(),
        "transaction_dir": transaction_dir.relative_to(PROJECT_ROOT.resolve()).as_posix(),
        "package_dir": package_dir.relative_to(PROJECT_ROOT.resolve()).as_posix(),
        "zip_path": zip_path.relative_to(PROJECT_ROOT.resolve()).as_posix(),
        "entries": entries, "blockers": blockers,
        "blocker_records": blocker_records(blockers, scope="release/plan"),
    }


def _fsync_directory(path: Path) -> bool:
    """Best-effort parent-directory durability; unsupported filesystems return False."""
    try:
        descriptor = os.open(path, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        return True
    except OSError:
        return False


def _restore_bytes_atomic(path: Path, original: bytes | None) -> None:
    """Restore one metadata file during rollback; only used for this transaction."""
    if original is None:
        path.unlink(missing_ok=True)
        return
    pending = path.with_name(f".{path.name}.rollback")
    pending.unlink(missing_ok=True)
    pending.write_bytes(original)
    os.replace(pending, path)


def build_scoped_release(
    lesson_key: str,
    release_id: str | None,
    offering_id: str | None = None,
    confirmed_release_id: str | None = None,
) -> dict[str, object]:
    """Stage, verify, commit, and read back one exact lesson release."""
    if confirmed_release_id != release_id or not confirmed_release_id:
        raise PermissionError("confirmed release id must exactly match --release-id")
    plan = plan_release(lesson_key, release_id, offering_id)
    if plan.get("status") != "ready":
        blocker_values = plan.get("blockers", [])
        blocker_text = [str(item) for item in blocker_values] if isinstance(blocker_values, list) else [str(blocker_values)]
        raise RuntimeError("Release plan is blocked:\n- " + "\n- ".join(blocker_text))
    raw_entries = plan.get("entries", [])
    if not isinstance(raw_entries, list):
        raise RuntimeError("Release plan entries are malformed")
    plan_entries: list[dict[str, Any]] = [
        item for item in raw_entries if isinstance(item, dict)
    ]
    if len(plan_entries) != len(raw_entries):
        raise RuntimeError("Release plan contains a malformed entry")

    context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
    authority_root, release_root = context.authority_root, context.release_root
    manifest_path = _safe_project_path(authority_root, "lesson-manifest.json")
    latest_path = _safe_project_path(release_root, "latest-release.json")
    release_dir = PROJECT_ROOT / str(plan["release_dir"])
    package_dir = PROJECT_ROOT / str(plan["package_dir"])
    zip_path = PROJECT_ROOT / str(plan["zip_path"])
    transaction_dir = PROJECT_ROOT / str(plan["transaction_dir"])
    release_root_existed = release_root.exists()
    marker = transaction_dir / "transaction.json"
    staged_release = _safe_project_path(transaction_dir, "release")
    staged_package = _safe_project_path(staged_release, package_dir.name)
    staged_zip = _safe_project_path(transaction_dir, "release.zip")
    staged_latest = _safe_project_path(transaction_dir, "latest-release.json")
    staged_manifest = _safe_project_path(transaction_dir, "authority-manifest.json")
    original_manifest = manifest_path.read_bytes()
    if sha256(manifest_path) != plan.get("authority_manifest_sha256"):
        raise RuntimeError("Authority manifest changed after planning")
    original_latest = latest_path.read_bytes() if latest_path.is_file() and not latest_path.is_symlink() else None
    manifest = json.loads(original_manifest)
    published_dir = published_zip = latest_committed = manifest_committed = False
    transaction_acquired = False

    try:
        release_root.mkdir(parents=True, exist_ok=True)
        transaction_dir.mkdir(exist_ok=False)
        transaction_acquired = True
        write_json_atomic(marker, {
            "lesson_key": lesson_key, "release_id": release_id,
            "status": "staging", "write_scope": str(release_root),
        })
        for item in plan_entries:
            source, _ = resolve_relative_path(
                PROJECT_ROOT, item["source_path"], required_root=authority_root
            )
            final_destination = PROJECT_ROOT / str(item["destination_path"])
            relative_destination = final_destination.relative_to(release_dir)
            staged_destination = _safe_project_path(staged_release, relative_destination.as_posix())
            if sha256(source) != item["sha256"] or source.stat().st_size != item["bytes"]:
                raise RuntimeError(f"Authority changed after planning: {item['source_path']}")
            copy_immutable(source, staged_destination)

        staged_tree = tree_hash(staged_package)
        write_deterministic_zip(staged_package, staged_release, staged_zip)
        with zipfile.ZipFile(staged_zip) as archive:
            bad_member = archive.testzip()
            if bad_member:
                raise RuntimeError(f"Staged release ZIP CRC failed: {bad_member}")
        staged_zip_hash = sha256(staged_zip)
        release_files = [
            {"path": path.relative_to(staged_release).as_posix(),
             "sha256": sha256(path), "bytes": path.stat().st_size}
            for path in material_files(staged_release)
        ]
        if len(release_files) != len(plan_entries):
            raise RuntimeError("staged release file count differs from reviewed plan")
        for item in plan_entries:
            relative = (PROJECT_ROOT / str(item["destination_path"])).relative_to(release_dir).as_posix()
            match = next((entry for entry in release_files if entry["path"] == relative), None)
            if not match or match["sha256"] != item["sha256"] or match["bytes"] != item["bytes"]:
                raise RuntimeError(f"staged release differs from reviewed plan: {relative}")

        created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
        release = {
            "schema_version": "2.0", "release_id": release_id,
            "lesson_key": lesson_key, "offering_id": context.offering_id,
            "textbook_id": context.textbook_id,
            "lesson_id": context.lesson_id, "lesson_title": manifest.get("lesson_title"),
            "source_manifest": manifest_path.relative_to(PROJECT_ROOT).as_posix(),
            "source_authority_root": authority_root.relative_to(PROJECT_ROOT).as_posix(),
            "release_root": release_dir.relative_to(PROJECT_ROOT).as_posix(),
            "zip_path": zip_path.relative_to(PROJECT_ROOT).as_posix(),
            "status": "immutable", "delivery_status": "ready", "copy_only": True,
            "activity_docx_count": sum(item.get("category") == "activity" for item in plan_entries),
            "file_count": len(release_files), "tree_sha256": staged_tree,
            "zip_sha256": staged_zip_hash, "files": release_files, "created_at": created_at,
        }
        manifest["release"] = {
            "latest_release_path": release["release_root"], "latest_zip_path": release["zip_path"],
            "status": "immutable", "delivery_status": "ready",
            "tree_sha256": staged_tree, "zip_sha256": staged_zip_hash, "created_at": created_at,
        }
        write_json_atomic(staged_latest, release)
        write_json_atomic(staged_manifest, manifest)
        json.loads(staged_latest.read_text(encoding="utf-8"))
        json.loads(staged_manifest.read_text(encoding="utf-8"))
        staging_dir_synced = _fsync_directory(transaction_dir)
        if sha256(manifest_path) != plan.get("authority_manifest_sha256"):
            raise RuntimeError("Authority manifest changed during staging")
        for item in plan_entries:
            source, _ = resolve_relative_path(
                PROJECT_ROOT, item["source_path"], required_root=authority_root
            )
            if sha256(source) != item["sha256"] or source.stat().st_size != item["bytes"]:
                raise RuntimeError(f"Authority changed during staging: {item['source_path']}")
        if release_dir.exists() or zip_path.exists():
            raise RuntimeError("release target appeared after reservation; refusing to overwrite")

        os.replace(staged_release, release_dir)
        published_dir = True
        os.replace(staged_zip, zip_path)
        published_zip = True
        if tree_hash(release_dir / package_dir.name) != release["tree_sha256"]:
            raise RuntimeError("published release tree failed pre-pointer verification")
        if sha256(zip_path) != release["zip_sha256"]:
            raise RuntimeError("published release ZIP failed pre-pointer hash verification")
        with zipfile.ZipFile(zip_path) as archive:
            if archive.testzip():
                raise RuntimeError("published release ZIP failed pre-pointer CRC")
        payload_dir_synced = _fsync_directory(release_root)
        os.replace(staged_latest, latest_path)
        latest_committed = True
        os.replace(staged_manifest, manifest_path)
        manifest_committed = True
        pointer_dirs_synced = {
            "release_root": _fsync_directory(release_root),
            "authority_root": _fsync_directory(authority_root),
        }

        current_latest = json.loads(latest_path.read_text(encoding="utf-8"))
        current_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        expected_identity = {
            "lesson_key": lesson_key, "offering_id": context.offering_id,
            "textbook_id": context.textbook_id, "lesson_id": context.lesson_id,
        }
        if current_latest.get("release_id") != release_id or any(
            current_latest.get(field) != value for field, value in expected_identity.items()
        ):
            raise RuntimeError("latest-release read-back does not match committed release identity")
        if any(current_manifest.get(field) != value for field, value in {
            "lesson_key": lesson_key, "textbook_id": context.textbook_id,
            "lesson_id": context.lesson_id,
        }.items()):
            raise RuntimeError("authority manifest read-back changed lesson identity")
        if current_manifest.get("release", {}).get("zip_sha256") != sha256(zip_path):
            raise RuntimeError("authority manifest read-back does not match committed ZIP")
        if tree_hash(release_dir / package_dir.name) != release["tree_sha256"]:
            raise RuntimeError("committed release tree failed read-back verification")
        with zipfile.ZipFile(zip_path) as archive:
            if archive.testzip():
                raise RuntimeError("committed release ZIP failed read-back CRC")
        from verify_lesson_authority import verify as verify_authority_release
        end_to_end = verify_authority_release(lesson_key, context.offering_id)
        if end_to_end.get("status") != "passed" or end_to_end.get("delivery_status") != "ready":
            raise RuntimeError("scoped end-to-end release verification did not pass")
        if Path(str(end_to_end.get("manifest"))).resolve() != manifest_path.resolve():
            raise RuntimeError("scoped end-to-end verifier resolved a different authority manifest")
        shutil.rmtree(transaction_dir)
        return {**release, "command": "release", "write_performed": True,
                "transaction_status": "committed_and_verified",
                "directory_fsync": {"staging": staging_dir_synced,
                                    "payload": payload_dir_synced,
                                    **pointer_dirs_synced}}
    except Exception as error:
        rollback_errors: list[str] = []
        actions: list[tuple[str, Any]] = []
        if manifest_committed:
            actions.append(("restore authority manifest", lambda: _restore_bytes_atomic(manifest_path, original_manifest)))
        if latest_committed:
            actions.append(("restore latest-release", lambda: _restore_bytes_atomic(latest_path, original_latest)))
        if published_zip and zip_path.exists():
            actions.append(("remove published ZIP", zip_path.unlink))
        if published_dir and release_dir.exists():
            actions.append(("remove published directory", lambda: shutil.rmtree(release_dir)))
        for label, action in actions:
            try:
                action()
            except Exception as rollback_error:
                rollback_errors.append(f"{label}: {rollback_error}")
        if transaction_acquired and transaction_dir.is_dir():
            marker_data = {"lesson_key": lesson_key, "release_id": release_id,
                           "status": "rollback_incomplete" if rollback_errors else "rolled_back",
                           "error": str(error), "rollback_errors": rollback_errors}
            try:
                marker.write_text(json.dumps(marker_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            except Exception as rollback_error:
                rollback_errors.append(f"write rollback marker: {rollback_error}")
        if not rollback_errors:
            if transaction_acquired and transaction_dir.exists():
                shutil.rmtree(transaction_dir)
            if not release_root_existed and release_root.exists() and not any(release_root.iterdir()):
                release_root.rmdir()
            detail = f"Scoped release failed and was rolled back: {error}"
        else:
            detail = f"Scoped release failed; rollback requires review: {error}; " + "; ".join(rollback_errors)
        raise RuntimeError(detail) from error


def build_release(release_id: str | None = None) -> dict[str, object]:
    release_id = validate_release_id(release_id or os.environ.get("BOYA_RELEASE_ID"))
    release_dir, package_dir, zip_path = release_paths(release_id)

    assert_ready("release")
    if not MANIFEST_PATH.is_file():
        raise FileNotFoundError(f"Authority manifest not found: {MANIFEST_PATH}")
    if release_dir.exists() or zip_path.exists():
        raise RuntimeError(
            "release id already exists or is partially built; use a new release id: "
            f"{release_id}"
        )

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries, mapping_failures = expected_release_entries(manifest)
    if mapping_failures:
        raise RuntimeError("Invalid release mapping:\n- " + "\n- ".join(mapping_failures))

    for entry in entries:
        source, _normalized = resolve_relative_path(
            PROJECT_ROOT,
            entry["source_path"],
            required_root=AUTHORITY_ROOT,
        )
        if sha256(source) != entry["sha256"] or source.stat().st_size != entry["bytes"]:
            raise RuntimeError(
                f"Authority changed after release gate: {entry['source_path']}"
            )
        copy_immutable(source, package_dir / entry["release_path"])

    release_tree_sha256 = tree_hash(package_dir)
    release_files = [
        {
            "path": path.relative_to(release_dir).as_posix(),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
        for path in material_files(release_dir)
    ]

    write_deterministic_zip(package_dir, release_dir, zip_path)
    with zipfile.ZipFile(zip_path) as archive:
        bad_member = archive.testzip()
        if bad_member:
            raise RuntimeError(f"Release ZIP CRC failed: {bad_member}")

    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    release = {
        "schema_version": "1.0",
        "release_id": release_id,
        "lesson_id": manifest["lesson_id"],
        "lesson_title": manifest["lesson_title"],
        "source_manifest": MANIFEST_PATH.relative_to(PROJECT_ROOT).as_posix(),
        "source_authority_root": AUTHORITY_ROOT.relative_to(PROJECT_ROOT).as_posix(),
        "release_root": release_dir.relative_to(PROJECT_ROOT).as_posix(),
        "zip_path": zip_path.relative_to(PROJECT_ROOT).as_posix(),
        "status": "immutable",
        "delivery_status": "ready",
        "copy_only": True,
        "activity_docx_count": sum(
            entry["category"] == "activity" for entry in entries
        ),
        "file_count": len(release_files),
        "tree_sha256": release_tree_sha256,
        "zip_sha256": sha256(zip_path),
        "files": release_files,
        "created_at": created_at,
    }

    manifest["release"] = {
        "latest_release_path": release["release_root"],
        "latest_zip_path": release["zip_path"],
        "status": "immutable",
        "delivery_status": "ready",
        "tree_sha256": release_tree_sha256,
        "zip_sha256": release["zip_sha256"],
        "created_at": created_at,
    }
    write_json_atomic(LATEST_PATH, release)
    write_json_atomic(MANIFEST_PATH, manifest)
    return release


def inspect_transactions(
    lesson_key: str,
    release_id: str | None = None,
    offering_id: str | None = None,
) -> dict[str, object]:
    """Inspect scoped transaction/recovery state without creating or modifying files."""
    blockers: list[str] = []
    artifacts: list[dict[str, object]] = []
    try:
        context = resolve_lesson_context(PROJECT_ROOT, lesson_key, offering_id)
        release_root = context.release_root
        if release_id is not None:
            release_ids = [validate_release_id(release_id)]
        else:
            release_ids = sorted(
                path.name[1:-len(".transaction")]
                for path in release_root.glob(".*.transaction")
                if path.name.endswith(".transaction") and len(path.name) > len("..transaction")
            )
            release_ids = [item for item in release_ids if RELEASE_ID_PATTERN.fullmatch(item)]
    except (ValueError, LessonContextError, OSError) as error:
        return {"command": "inspect", "lesson_key": lesson_key,
                "release_id": release_id, "status": "blocked", "write_performed": False,
                "blockers": [str(error)],
                "blocker_records": blocker_records([str(error)], scope="release/inspect"),
                "artifacts": []}

    def describe(path: Path, kind: str, rid: str | None = None) -> None:
        item: dict[str, object] = {
            "kind": kind,
            "path": path.relative_to(PROJECT_ROOT.resolve()).as_posix(),
            "exists": path.exists() or path.is_symlink(),
        }
        if rid:
            item["release_id"] = rid
        if not item["exists"]:
            artifacts.append(item)
            return
        if path.is_symlink():
            item["status"] = "unsafe_symlink"
            blockers.append(f"{kind} is a symlink and requires review: {path}")
        elif path.is_dir():
            item["status"] = "directory"
        elif path.is_file():
            item["status"] = "file"
            item["bytes"] = path.stat().st_size
            item["sha256"] = sha256(path)
        else:
            item["status"] = "unsupported"
            blockers.append(f"{kind} has unsupported filesystem type: {path}")
        artifacts.append(item)

    for rid in release_ids:
        try:
            transaction = _safe_project_path(release_root, f".{rid}.transaction")
            release_dir = _safe_project_path(release_root, rid)
            zip_path = _safe_project_path(release_root, f"{rid}.zip")
            pending_zip = _safe_project_path(release_root, f".{rid}.zip.pending")
        except LessonContextError as error:
            blockers.append(f"transaction path is unsafe: {error}")
            continue
        describe(transaction, "transaction", rid)
        describe(release_dir, "release_directory", rid)
        describe(zip_path, "release_zip", rid)
        describe(pending_zip, "pending_release_zip", rid)
        if transaction.is_dir() and not transaction.is_symlink():
            marker = transaction / "transaction.json"
            if not marker.is_file() or marker.is_symlink():
                blockers.append(f"transaction marker is missing or unsafe: {marker}")
            else:
                try:
                    marker_data = json.loads(marker.read_text(encoding="utf-8"))
                    if not isinstance(marker_data, dict):
                        raise ValueError("marker root must be an object")
                    marker_item = {"kind": "transaction_marker",
                                   "path": marker.relative_to(PROJECT_ROOT.resolve()).as_posix(),
                                   "status": marker_data.get("status", "unknown"),
                                   "lesson_key": marker_data.get("lesson_key"),
                                   "release_id": marker_data.get("release_id")}
                    artifacts.append(marker_item)
                    if marker_data.get("lesson_key") != lesson_key or marker_data.get("release_id") != rid:
                        blockers.append(f"transaction marker identity mismatch: {marker}")
                except (OSError, json.JSONDecodeError, ValueError) as error:
                    blockers.append(f"transaction marker is invalid: {marker}: {error}")
            for root, directories, files in os.walk(transaction, followlinks=False):
                for name in directories + files:
                    candidate = Path(root) / name
                    if candidate.is_symlink():
                        blockers.append(f"transaction contains symlink requiring review: {candidate}")

    for path, kind in (
        (context.release_root / ".latest-release.json.pending", "pending_latest_metadata"),
        (context.release_root / ".latest-release.json.rollback", "rollback_latest_metadata"),
        (context.authority_root / ".lesson-manifest.json.pending", "pending_authority_metadata"),
        (context.authority_root / ".lesson-manifest.json.rollback", "rollback_authority_metadata"),
    ):
        describe(path, kind)

    status = "blocked" if blockers else ("clear" if not any(item.get("exists") for item in artifacts) else "review")
    return {"command": "inspect", "lesson_key": lesson_key, "offering_id": context.offering_id,
            "release_id": release_id, "status": status, "write_performed": False,
            "blockers": blockers,
            "blocker_records": blocker_records(blockers, scope="release/inspect"),
            "artifacts": artifacts}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", action="store_true", help="Print a read-only scoped release plan")
    parser.add_argument("--inspect", action="store_true", help="Inspect scoped transaction/recovery state without writing")
    parser.add_argument("--execute", action="store_true", help="Execute a scoped release after a fresh plan")
    parser.add_argument("--legacy-active-build", action="store_true", help="Explicitly run the legacy active-context builder")
    parser.add_argument("--lesson-key", help="Exact registry key; required for scoped plan/execute")
    parser.add_argument("--offering-id", help="Offering for the explicit lesson key")
    parser.add_argument("--release-id", help="Immutable release id")
    parser.add_argument("--confirm-release-id", help="Must exactly repeat --release-id for a write")
    args = parser.parse_args()
    if sum((args.plan, args.inspect, args.execute, args.legacy_active_build)) != 1:
        parser.error("choose exactly one of --plan, --inspect, --execute, or --legacy-active-build")
    if args.inspect:
        if not args.lesson_key:
            parser.error("--lesson-key is required for --inspect")
        result = inspect_transactions(args.lesson_key, args.release_id, args.offering_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] in {"clear", "review"} else 1
    if args.plan:
        if not args.lesson_key:
            result = {"command": "plan", "status": "blocked", "write_performed": False,
                      "blockers": ["--lesson-key is required for --plan"], "entries": []}
        else:
            result = plan_release(args.lesson_key, args.release_id, args.offering_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] == "ready" else 1
    if args.execute:
        if not args.lesson_key:
            parser.error("--lesson-key is required for --execute")
        result = build_scoped_release(
            args.lesson_key, args.release_id, args.offering_id, args.confirm_release_id
        )
    else:
        if args.lesson_key or args.offering_id:
            parser.error("legacy active build does not accept lesson scope")
        if args.confirm_release_id != args.release_id or not args.confirm_release_id:
            parser.error("--confirm-release-id must exactly repeat --release-id")
        result = build_release(args.release_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
