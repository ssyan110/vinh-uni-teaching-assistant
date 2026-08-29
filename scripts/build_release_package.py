#!/usr/bin/env python3
"""Build a copy-only, immutable Lesson 1 release from approved authority."""

from __future__ import annotations

import json
import os
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from production_gate import assert_ready
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


if __name__ == "__main__":
    print(json.dumps(build_release(), ensure_ascii=False, indent=2))
