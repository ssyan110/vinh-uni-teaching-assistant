#!/usr/bin/env python3
"""Shared integrity checks for Boya authority and release workflows."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from pathlib import Path, PurePosixPath
from typing import Any


IGNORED_FILE_NAMES = {".DS_Store"}
SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")
WINDOWS_RESERVED_NAMES = {
    "con", "prn", "aux", "nul", "clock$",
    *(f"com{number}" for number in range(1, 10)),
    *(f"lpt{number}" for number in range(1, 10)),
}


def portable_release_path_key(value: str) -> tuple[str | None, str | None]:
    """Return a portable collision key, or an error for unsafe release paths."""
    if not value or "\\" in value or any(ord(char) < 32 or ord(char) == 127 for char in value):
        return None, "contains a backslash or control character"
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        return None, "is not a canonical relative POSIX path"
    keys: list[str] = []
    for part in path.parts:
        if part != unicodedata.normalize("NFC", part):
            return None, "is not NFC-normalized"
        if part.endswith((".", " ")) or ":" in part:
            return None, "contains a non-portable component"
        stem = part.split(".", 1)[0].casefold()
        if stem in WINDOWS_RESERVED_NAMES:
            return None, f"uses reserved component {part!r}"
        keys.append(part.casefold())
    return "/".join(keys), None


def is_ignored_file(path: Path) -> bool:
    return path.name in IGNORED_FILE_NAMES or path.name.startswith("~$")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def material_files(root: Path) -> list[Path]:
    if not root.is_dir():
        raise FileNotFoundError(root)
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file() and not path.is_symlink() and not is_ignored_file(path)
    )


def symlinks_under(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    return sorted(path for path in root.rglob("*") if path.is_symlink())


def tree_hash(root: Path) -> str:
    links = symlinks_under(root)
    if links:
        raise ValueError(f"symlinks are not allowed in integrity trees: {links[0]}")
    digest = hashlib.sha256()
    for path in material_files(root):
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(sha256(path)))
        digest.update(b"\n")
    return digest.hexdigest()


def _is_within(child: Path, parent: Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def resolve_relative_path(
    project_root: Path,
    value: Any,
    *,
    required_root: Path | None = None,
) -> tuple[Path, str]:
    """Resolve a manifest path and reject absolute, aliased, or escaping paths."""

    if not isinstance(value, str) or not value.strip():
        raise ValueError("path must be a non-empty string")
    raw = Path(value)
    if raw.is_absolute():
        raise ValueError(f"absolute paths are not allowed: {value}")
    if any(part in {".", ".."} for part in raw.parts):
        raise ValueError(f"path aliases are not allowed: {value}")

    project = project_root.resolve()
    resolved = (project / raw).resolve()
    if not _is_within(resolved, project):
        raise ValueError(f"path escapes the project: {value}")
    if required_root is not None and not _is_within(resolved, required_root.resolve()):
        raise ValueError(f"path escapes the required root: {value}")

    cursor = project
    for part in raw.parts:
        cursor /= part
        if cursor.is_symlink():
            raise ValueError(f"symlink paths are not allowed: {value}")

    normalized = resolved.relative_to(project).as_posix()
    if raw.as_posix() != normalized:
        raise ValueError(f"path is not canonical: {value}")
    return resolved, normalized


def audit_authority_manifest(
    project_root: Path,
    authority_root: Path,
    manifest: dict[str, Any],
) -> dict[str, Any]:
    """Check that authority is exactly the files declared in its manifest."""

    failures: list[str] = []
    authority = authority_root.resolve()
    if not authority.is_dir():
        return {
            "checked_files": 0,
            "actual_file_count": 0,
            "failures": [f"authority root is missing: {authority_root}"],
        }

    for link in symlinks_under(authority):
        failures.append(
            f"authority contains symlink: {link.relative_to(project_root.resolve()).as_posix()}"
        )

    actual_files = {
        path.relative_to(project_root.resolve()).as_posix(): path
        for path in material_files(authority)
        if path.name != "lesson-manifest.json"
    }
    declared: dict[str, dict[str, Any]] = {}
    checked = 0

    items = manifest.get("files")
    if not isinstance(items, list) or not items:
        failures.append("authority manifest files list is missing or empty")
        items = []

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            failures.append(f"authority manifest files[{index}] is not an object")
            continue
        value = item.get("path")
        try:
            path, normalized = resolve_relative_path(
                project_root, value, required_root=authority
            )
        except ValueError as error:
            failures.append(f"invalid authority manifest path {value!r}: {error}")
            continue
        if path.name == "lesson-manifest.json":
            failures.append("authority manifest must not hash itself")
            continue
        if normalized in declared:
            failures.append(f"duplicate authority manifest path: {normalized}")
            continue
        declared[normalized] = item
        checked += 1

        expected_hash = item.get("sha256")
        if not isinstance(expected_hash, str) or not SHA256_PATTERN.fullmatch(expected_hash):
            failures.append(f"invalid authority SHA-256: {normalized}")
        expected_bytes = item.get("bytes")
        if not isinstance(expected_bytes, int) or isinstance(expected_bytes, bool) or expected_bytes < 0:
            failures.append(f"invalid authority byte count: {normalized}")

        if not path.is_file() or path.is_symlink():
            failures.append(f"missing authority file: {normalized}")
            continue
        if isinstance(expected_hash, str) and SHA256_PATTERN.fullmatch(expected_hash):
            if sha256(path) != expected_hash:
                failures.append(f"authority hash mismatch: {normalized}")
        if isinstance(expected_bytes, int) and not isinstance(expected_bytes, bool):
            if path.stat().st_size != expected_bytes:
                failures.append(f"authority byte count mismatch: {normalized}")

    undeclared = sorted(set(actual_files) - set(declared))
    for path in undeclared:
        failures.append(f"unregistered authority file: {path}")

    declared_missing = sorted(set(declared) - set(actual_files))
    for path in declared_missing:
        message = f"missing authority file: {path}"
        if message not in failures:
            failures.append(message)

    activity_root = authority / "activities"
    activity_files = material_files(activity_root) if activity_root.is_dir() else []
    for path in activity_files:
        if path.suffix.lower() != ".docx":
            failures.append(
                "authority activity is not DOCX: "
                f"{path.relative_to(project_root.resolve()).as_posix()}"
            )
    expected_activity_count = (
        manifest.get("authority", {}).get("activities", {}).get("file_count")
    )
    if expected_activity_count != len(activity_files):
        failures.append(
            "authority activity file count mismatch: "
            f"manifest={expected_activity_count!r}, actual={len(activity_files)}"
        )

    return {
        "checked_files": checked,
        "actual_file_count": len(actual_files),
        "activity_file_count": len(activity_files),
        "failures": failures,
    }


def audit_frozen_source_package(
    project_root: Path,
    configured_source: str,
    manifest: dict[str, Any],
) -> dict[str, Any]:
    """Verify the source snapshot named by the authority manifest.

    ``frozen_input`` is retained for backwards compatibility with older
    manifests.  Once the snapshot has been moved out of the active workflow,
    ``historical_evidence`` records that it is traceable archive material and
    is no longer a production source.
    """

    failures: list[str] = []
    source = manifest.get("source_package")
    if not isinstance(source, dict):
        return {
            "file_count": 0,
            "tree_sha256": None,
            "failures": ["authority manifest source_package is missing"],
        }
    source_status = source.get("status")
    if source_status not in {"frozen_input", "historical_evidence"}:
        failures.append(
            "source package has unsupported status: "
            f"{source_status!r}"
        )

    try:
        configured_path, configured_normalized = resolve_relative_path(
            project_root, configured_source
        )
        source_path, source_normalized = resolve_relative_path(
            project_root, source.get("path")
        )
    except ValueError as error:
        return {
            "file_count": 0,
            "tree_sha256": None,
            "failures": [f"invalid frozen source path: {error}"],
        }

    if source_normalized != configured_normalized or source_path != configured_path:
        failures.append(
            "authority manifest source package differs from configured frozen input"
        )
    if not source_path.is_dir():
        failures.append(f"source snapshot is missing: {source_normalized}")
        return {"file_count": 0, "tree_sha256": None, "failures": failures}

    links = symlinks_under(source_path)
    for link in links:
        failures.append(
            f"frozen source package contains symlink: {link.relative_to(project_root.resolve())}"
        )
    files = material_files(source_path)
    actual_hash = None
    if not links:
        actual_hash = tree_hash(source_path)
        if source.get("tree_sha256") != actual_hash:
            failures.append("frozen source package tree hash mismatch")
    if source.get("file_count") != len(files):
        failures.append(
            "frozen source package file count mismatch: "
            f"manifest={source.get('file_count')!r}, actual={len(files)}"
        )

    return {
        "file_count": len(files),
        "tree_sha256": actual_hash,
        "failures": failures,
    }


def expected_release_entries(manifest: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    """Map approved manifest entries to the teacher-facing release layout."""

    failures: list[str] = []
    items = manifest.get("files") if isinstance(manifest.get("files"), list) else []
    by_path = {
        item.get("path"): item
        for item in items
        if isinstance(item, dict) and isinstance(item.get("path"), str)
    }
    authority = manifest.get("authority", {})
    pptx = authority.get("pptx", {}) if isinstance(authority.get("pptx"), dict) else {}
    requested = [
        (pptx.get("path"), "01-课堂PPT", "pptx"),
        (pptx.get("online_path"), "01-课堂PPT", "pptx"),
        (authority.get("teacher_manual", {}).get("path"), "02-简易教案", "teacher_manual"),
    ]
    # A PDF preview is a QA artifact unless the authority manifest explicitly
    # declares it as a release material. Do not make PPTX-only authority fail
    # merely because no preview PDF is registered.
    preview = authority.get("ppt_preview", {})
    if isinstance(preview, dict) and preview.get("path"):
        requested.append((preview.get("path"), "01-课堂PPT", "ppt_preview"))
    entries: list[dict[str, Any]] = []

    for source_path, release_parent, category in requested:
        # Optional authority fields (such as a second online deck path) are
        # intentionally absent in older manifests and should not become a
        # spurious mapping failure.
        if not source_path:
            continue
        item = by_path.get(source_path)
        if item is None:
            failures.append(f"release authority entry is not declared in files: {source_path!r}")
            continue
        entries.append(
            {
                "source_path": source_path,
                "release_path": f"{release_parent}/{Path(source_path).name}",
                "sha256": item.get("sha256"),
                "bytes": item.get("bytes"),
                "category": category,
            }
        )

    # Optional approved supplements (for example a worksheet, video, or a
    # Blooket import CSV) are explicitly mapped by the authority manifest.
    # Keep this opt-in so older manifests retain the original four-part pack.
    release_materials = manifest.get("release_materials", [])
    if release_materials is not None and not isinstance(release_materials, list):
        failures.append("release_materials must be a list when present")
        release_materials = []
    for index, material in enumerate(release_materials or []):
        if not isinstance(material, dict):
            failures.append(f"release_materials[{index}] is not an object")
            continue
        source_path = material.get("source_path")
        release_path = material.get("release_path")
        category = material.get("category", "supplement")
        item = by_path.get(source_path)
        if not isinstance(source_path, str) or item is None:
            failures.append(
                "release material source is not declared in files: "
                f"{source_path!r}"
            )
            continue
        if not isinstance(release_path, str) or not release_path.strip():
            failures.append(f"release_materials[{index}] has no release_path")
            continue
        raw_release_path = PurePosixPath(release_path)
        if (
            raw_release_path.is_absolute()
            or any(part in {"", ".", ".."} for part in raw_release_path.parts)
            or raw_release_path.as_posix() != release_path
        ):
            failures.append(
                f"release_materials[{index}] has an unsafe release_path: {release_path!r}"
            )
            continue
        if not isinstance(category, str) or not category.strip():
            failures.append(f"release_materials[{index}] has an invalid category")
            continue
        entries.append(
            {
                "source_path": source_path,
                "release_path": raw_release_path.as_posix(),
                "sha256": item.get("sha256"),
                "bytes": item.get("bytes"),
                "category": category,
            }
        )

    activity_path = authority.get("activities", {}).get("path")
    activity_prefix = f"{activity_path.rstrip('/')}/" if isinstance(activity_path, str) else None
    activity_items = []
    if activity_prefix:
        activity_items = sorted(
            (path, item)
            for path, item in by_path.items()
            if isinstance(path, str) and path.startswith(activity_prefix)
        )
    if not activity_items:
        failures.append("release has no declared authority activity files")
    for source_path, item in activity_items:
        relative = source_path[len(activity_prefix):]
        if Path(relative).suffix.lower() != ".docx":
            failures.append(f"release activity is not DOCX: {source_path}")
        entries.append(
            {
                "source_path": source_path,
                "release_path": f"03-活动卡/{relative}",
                "sha256": item.get("sha256"),
                "bytes": item.get("bytes"),
                "category": "activity",
            }
        )

    release_paths = [entry["release_path"] for entry in entries]
    if len(release_paths) != len(set(release_paths)):
        failures.append("release mapping contains duplicate destination paths")
    portable: dict[str, str] = {}
    for release_path in release_paths:
        key, error = portable_release_path_key(release_path)
        if error:
            failures.append(f"release mapping has unsafe portable path {release_path!r}: {error}")
            continue
        assert key is not None
        if key in portable and portable[key] != release_path:
            failures.append(
                f"release mapping has portable-name collision: {portable[key]!r} and {release_path!r}"
            )
        else:
            portable[key] = release_path
    return entries, failures
