#!/usr/bin/env python3
"""Build an immutable release package from Lesson 1 authority files only."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from production_gate import assert_ready


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
AUTHORITY_ROOT = PROJECT_ROOT / CONFIG["authority_root"]
RELEASE_ROOT = PROJECT_ROOT / CONFIG["release_root"]
MANIFEST_PATH = AUTHORITY_ROOT / "lesson-manifest.json"
RELEASE_ID = os.environ.get("BOYA_RELEASE_ID", "2026-08-21-final-teaching-materials")
RELEASE_DIR = RELEASE_ROOT / RELEASE_ID
PACKAGE_DIR = RELEASE_DIR / "第一课-教学资料"
ZIP_PATH = RELEASE_ROOT / f"{RELEASE_ID}.zip"
LATEST_PATH = RELEASE_ROOT / "latest-release.json"


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


def copy_immutable(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Missing authority file: {source}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if not destination.is_file() or sha256(source) != sha256(destination):
            raise RuntimeError(
                "Refusing to overwrite a release file with different content: "
                f"{destination}"
            )
        return
    shutil.copy2(source, destination)


def copy_tree_immutable(source_root: Path, destination_root: Path) -> int:
    files = sorted(
        p
        for p in source_root.rglob("*")
        if p.is_file() and p.name != ".DS_Store" and not p.name.startswith("~$")
    )
    if not files:
        raise FileNotFoundError(f"Authority directory is empty: {source_root}")
    for source in files:
        copy_immutable(source, destination_root / source.relative_to(source_root))
    return len(files)


def build_release() -> dict[str, object]:
    assert_ready("release")
    if not MANIFEST_PATH.is_file():
        raise FileNotFoundError(f"Authority manifest not found: {MANIFEST_PATH}")
    if ZIP_PATH.exists() or RELEASE_DIR.exists():
        raise RuntimeError(
            f"Release id already exists or is partially built; use a new release id: {RELEASE_DIR}"
        )
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    # This is a mapping of the authority tree to the teacher-facing package layout.
    # It copies bytes only; it does not regenerate or edit any teaching material.
    copy_immutable(
        AUTHORITY_ROOT / "pptx/第一课-中国人的姓名.pptx",
        PACKAGE_DIR / "01-课堂PPT/第一课-中国人的姓名.pptx",
    )
    copy_immutable(
        AUTHORITY_ROOT / "pptx/第一课-中国人的姓名-投影片预览.pdf",
        PACKAGE_DIR / "01-课堂PPT/第一课-中国人的姓名-投影片预览.pdf",
    )
    copy_immutable(
        AUTHORITY_ROOT / "teacher-manual/第一课简易教案.docx",
        PACKAGE_DIR / "02-简易教案/第一课简易教案.docx",
    )
    activity_count = copy_tree_immutable(
        AUTHORITY_ROOT / "activities",
        PACKAGE_DIR / "03-活动卡",
    )

    release_tree_sha256 = tree_hash(PACKAGE_DIR)
    release_files = [
        {
            "path": path.relative_to(RELEASE_DIR).as_posix(),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
        for path in sorted(
            p
            for p in RELEASE_DIR.rglob("*")
            if p.is_file() and p.name != ".DS_Store" and not p.name.startswith("~$")
        )
    ]

    RELEASE_ROOT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(p for p in PACKAGE_DIR.rglob("*") if p.is_file()):
            archive.write(path, path.relative_to(RELEASE_DIR).as_posix())

    release = {
        "schema_version": "1.0",
        "release_id": RELEASE_ID,
        "lesson_id": manifest["lesson_id"],
        "lesson_title": manifest["lesson_title"],
        "source_manifest": "lessons/lesson-01/20-approved/lesson-manifest.json",
        "source_authority_root": "lessons/lesson-01/20-approved",
        "release_root": f"lessons/lesson-01/40-release/{RELEASE_ID}",
        "zip_path": f"lessons/lesson-01/40-release/{ZIP_PATH.name}",
        "status": "immutable",
        "delivery_status": "ready",
        "copy_only": True,
        "activity_docx_count": activity_count,
        "file_count": len(release_files),
        "tree_sha256": release_tree_sha256,
        "zip_sha256": sha256(ZIP_PATH),
        "files": release_files,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    LATEST_PATH.write_text(json.dumps(release, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest["release"] = {
        "latest_release_path": f"lessons/lesson-01/40-release/{RELEASE_ID}",
        "latest_zip_path": f"lessons/lesson-01/40-release/{ZIP_PATH.name}",
        "status": "immutable",
        "delivery_status": "ready",
        "tree_sha256": release_tree_sha256,
        "zip_sha256": release["zip_sha256"],
        "created_at": release["created_at"],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return release


if __name__ == "__main__":
    print(json.dumps(build_release(), ensure_ascii=False, indent=2))
