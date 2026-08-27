#!/usr/bin/env python3
"""Create the Lesson 1 authority tree from the frozen final teaching package.

This migration is intentionally conservative:
- the user-confirmed package is read-only input;
- destination files are copied byte-for-byte;
- an existing destination is never silently overwritten;
- lesson-manifest.json records the hashes of every authority file.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = PROJECT_ROOT / "project.config.json"
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def project_path(relative_path: str) -> Path:
    return PROJECT_ROOT / relative_path


LESSON_ROOT = project_path(CONFIG["lesson_root"])
SOURCE_PACKAGE = project_path(CONFIG["historical_package_evidence"])
AUTHORITY_ROOT = project_path(CONFIG["authority_root"])
QA_ROOT = project_path(CONFIG["qa_root"])
RELEASE_ROOT = project_path(CONFIG["release_root"])
LEGACY_ROOT = project_path(CONFIG["archive_root"]) / "boya-intermediate/lesson-01"
COURSE_ROOT = PROJECT_ROOT / "course"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(sha256(path)))
        digest.update(b"\n")
    return digest.hexdigest()


def copy_immutable(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Missing migration source: {source}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if not destination.is_file() or sha256(source) != sha256(destination):
            raise RuntimeError(
                "Refusing to overwrite an existing authority file with different content: "
                f"{destination}"
            )
        return
    shutil.copy2(source, destination)


def copy_tree_immutable(
    source_root: Path,
    destination_root: Path,
    exclude_names: set[str] | None = None,
) -> list[Path]:
    if not source_root.is_dir():
        raise FileNotFoundError(f"Missing migration directory: {source_root}")
    copied: list[Path] = []
    excluded = exclude_names or set()
    for source in sorted(
        p for p in source_root.rglob("*") if p.is_file() and p.name not in excluded
    ):
        destination = destination_root / source.relative_to(source_root)
        copy_immutable(source, destination)
        copied.append(destination)
    return copied


def write_if_absent(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_text(encoding="utf-8") != content:
            raise RuntimeError(f"Refusing to overwrite existing project file: {path}")
        return
    path.write_text(content, encoding="utf-8")


def authority_files() -> list[Path]:
    return sorted(p for p in AUTHORITY_ROOT.rglob("*") if p.is_file())


def build_manifest() -> dict[str, Any]:
    files = [
        {
            "path": path.relative_to(PROJECT_ROOT).as_posix(),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
        for path in authority_files()
        if path.name != "lesson-manifest.json"
    ]
    activity_files = [
        item for item in files if "/activities/" in f"/{item['path']}"
    ]
    return {
        "schema_version": "1.0",
        "manifest_type": "lesson-authority",
        "course_id": CONFIG["course_id"],
        "lesson_id": "lesson-01",
        "lesson_number": 1,
        "lesson_title": "中国人的姓名",
        "language": "简体中文",
        "authority_status": "final_confirmed",
        "content_status": "final_confirmed_by_adam_2026-08-21",
        "authority_rule": "20-approved is the only editable authority; 40-release is copy-only.",
        "source_package": {
            "path": CONFIG["historical_package_evidence"],
            "status": "historical_evidence",
            "file_count": len(
                [p for p in SOURCE_PACKAGE.rglob("*") if p.is_file()]
            ),
            "tree_sha256": tree_hash(SOURCE_PACKAGE),
        },
        "scope": {
            "period_count": 6,
            "minutes_per_period": 50,
            "total_minutes": 300,
            "meeting_pattern": "第一次上课4节／200分钟；第二次上课2节／100分钟",
            "ppt_slide_count": 62,
            "activity_count": 5,
        },
        "authority": {
            "pptx": {
                "path": "lessons/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx",
                "status": "final_confirmed",
            },
            "teacher_manual": {
                "path": "lessons/lesson-01/20-approved/teacher-manual/第一课简易教案.docx",
                "status": "final_confirmed",
            },
            "activities": {
                "path": "lessons/lesson-01/20-approved/activities",
                "status": "final_confirmed",
                "file_count": len(activity_files),
                "folders": [
                    "活动01-姓名访谈",
                    "活动02-起名儿公司",
                    "活动03-电影演员中文名",
                    "活动04-姓氏信息站",
                    "活动05-调查与研究",
                ],
                "format": "DOCX only",
            },
            "ppt_preview": {
                "path": "lessons/lesson-01/20-approved/pptx/第一课-中国人的姓名-投影片预览.pdf",
                "status": "export_preview",
            },
        },
        "design_inputs": {
            "source_review": "lessons/lesson-01/00-source/source-manifest.json",
            "teaching_design": "lessons/lesson-01/10-design/teaching-design",
            "storyboard": "lessons/lesson-01/10-design/storyboard",
            "visual_storyboard": "lessons/lesson-01/10-design/visual-storyboard",
            "visual_prototype": "lessons/lesson-01/10-design/visual-prototype",
            "activity_package_manifest": "lessons/lesson-01/10-design/activity-package-manifest.json",
        },
        "qa": {
            "status": "recorded_current_pass",
            "current_path": "lessons/lesson-01/30-qa/current",
            "current_report": "lessons/lesson-01/30-qa/current/pptx-v15/qa-report.md",
            "legacy_versions": "lessons/lesson-01/30-qa/archive",
        },
        "release": {
            "latest_release_path": "lessons/lesson-01/40-release/2026-08-21-final-teaching-materials",
            "latest_zip_path": "lessons/lesson-01/40-release/2026-08-21-final-teaching-materials.zip",
            "status": "not_built",
        },
        "files": files,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "approved_at": date(2026, 8, 21).isoformat(),
    }


def migrate() -> dict[str, Any]:
    if not SOURCE_PACKAGE.is_dir():
        raise FileNotFoundError(f"Frozen final package not found: {SOURCE_PACKAGE}")

    # Create the requested shape without touching the frozen source package.
    for directory in (
        LESSON_ROOT / "00-source",
        LESSON_ROOT / "10-design",
        AUTHORITY_ROOT,
        QA_ROOT / "current",
        QA_ROOT / "archive",
        RELEASE_ROOT,
        COURSE_ROOT,
    ):
        directory.mkdir(parents=True, exist_ok=True)

    copy_immutable(
        LEGACY_ROOT / "source-review/manifest.json",
        LESSON_ROOT / "00-source/source-manifest.json",
    )

    design_sources = {
        "teaching-design": LEGACY_ROOT / "teaching-design",
        "storyboard": LEGACY_ROOT / "storyboard",
        "visual-storyboard": LEGACY_ROOT / "visual-storyboard",
        "visual-prototype": LEGACY_ROOT / "visual-prototype",
    }
    for name, source in design_sources.items():
        copy_tree_immutable(
            source,
            LESSON_ROOT / "10-design" / name,
            exclude_names={"index.html"},
        )

    copy_immutable(
        SOURCE_PACKAGE / "01-课堂PPT/第一课-中国人的姓名.pptx",
        AUTHORITY_ROOT / "pptx/第一课-中国人的姓名.pptx",
    )
    copy_immutable(
        SOURCE_PACKAGE / "01-课堂PPT/第一课-中国人的姓名-投影片预览.pdf",
        AUTHORITY_ROOT / "pptx/第一课-中国人的姓名-投影片预览.pdf",
    )
    copy_immutable(
        SOURCE_PACKAGE / "02-简易教案/第一课简易教案.docx",
        AUTHORITY_ROOT / "teacher-manual/第一课简易教案.docx",
    )
    copy_tree_immutable(
        SOURCE_PACKAGE / "03-活动卡",
        AUTHORITY_ROOT / "activities",
    )

    # Current QA is evidence only; it never becomes an alternative content source.
    copy_tree_immutable(
        LEGACY_ROOT / "qa/pptx-v15",
        QA_ROOT / "current/pptx-v15",
    )
    for legacy_version in ("pptx-v14",):
        source = LEGACY_ROOT / "qa" / legacy_version
        if source.is_dir():
            copy_tree_immutable(source, QA_ROOT / "archive" / legacy_version)

    # Preserve the current semester assembly as a source snapshot. The source package
    # above remains untouched; these are separate course-level files for future work.
    semester_manual = PROJECT_ROOT / "archive/legacy-materials-2026-08-27/teacher-manual/boya-intermediate-i-semester-teacher-manual.md"
    if semester_manual.is_file():
        full_manual = semester_manual.read_text(encoding="utf-8")
        marker = "# 第一课〈中国人的姓名〉教师手册"
        overview = full_manual.split(marker, 1)[0].rstrip() + "\n"
        write_if_absent(COURSE_ROOT / "semester-overview.md", overview)
        write_if_absent(COURSE_ROOT / "teacher-manual.md", full_manual)

    write_if_absent(
        AUTHORITY_ROOT / "README.md",
        """# 第一课权威教材\n\n此目录保存 2026-08-21 已确认的第一课完整教学资料。\n\n- PPTX、简易教案和活动卡以本目录文件为准。\n- 活动卡只保留 DOCX；活动卡不在此生成 PDF。\n- 交付包只从本目录复制，不在交付目录修改内容。\n- 任何 PowerPoint 手动修改都必须先另存为 draft，再由负责人明确批准后更新权威文件。\n""",
    )
    write_if_absent(
        LESSON_ROOT / "README.md",
        """# 第一课生产目录\n\n目录顺序：\n\n1. `00-source/`：教材来源与来源 manifest。\n2. `10-design/`：教学设计、Storyboard、Visual storyboard 与 prototype。\n3. `20-approved/`：唯一权威版本。\n4. `30-qa/`：只读 QA 证据；`current/` 是当前结果，`archive/` 保存旧版本。\n5. `40-release/`：从 `20-approved/` 复制出的不可变交付包。\n6. `90-archive/`：未来明确归档的旧内容。\n\n歷史輸出统一保存在项目根目录 `archive/`，不是未来的权威来源。\n""",
    )

    manifest = build_manifest()
    manifest_path = AUTHORITY_ROOT / "lesson-manifest.json"
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if manifest_path.exists():
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        existing_without_runtime = dict(existing)
        existing_without_runtime.pop("created_at", None)
        new_without_runtime = dict(manifest)
        new_without_runtime.pop("created_at", None)
        if existing_without_runtime != new_without_runtime:
            raise RuntimeError(
                f"Existing authority manifest differs; review before changing: {manifest_path}"
            )
    else:
        manifest_path.write_text(manifest_text, encoding="utf-8")
    return manifest


if __name__ == "__main__":
    result = migrate()
    print(json.dumps({
        "authority_root": str(AUTHORITY_ROOT),
        "authority_file_count": len(result["files"]),
        "source_package_tree_sha256": result["source_package"]["tree_sha256"],
        "manifest": str(AUTHORITY_ROOT / "lesson-manifest.json"),
    }, ensure_ascii=False, indent=2))
