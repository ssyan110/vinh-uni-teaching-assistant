#!/usr/bin/env python3
"""Build the file://-safe dashboard cache from lesson authority manifests."""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from production_gate import check as check_production_gate
from validate_lesson_identity import validate as validate_lesson_identity


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_COUNT = int(CONFIG.get("lesson_count", 8))
LESSON_ROOT = PROJECT_ROOT / CONFIG.get("lesson_collection_root", "lessons")
TEXTBOOK_ID = str(CONFIG.get("active_context", {}).get("textbook_id", ""))
OFFERING_ID = str(CONFIG.get("active_context", {}).get("offering_id", ""))
LESSON_KEY_FORMAT = CONFIG.get("lesson_key_format", "<textbook_id>:<lesson_id>")
LESSON_REGISTRY_PATH = PROJECT_ROOT / CONFIG.get(
    "lesson_registry", "course/lesson-registry.json"
)
CATALOG_PATH = PROJECT_ROOT / CONFIG.get(
    "lesson_catalog", f"textbooks/{TEXTBOOK_ID}/source/source-inventory.json"
)
DASHBOARD_ROOT = PROJECT_ROOT / CONFIG["dashboard_root"]
OUTPUT_PATH = DASHBOARD_ROOT / "manifest.js"


GATE_DEFINITIONS = [
    ("source_review", "来源审核", "核对教材 PDF、区段、练习、音频与答案政策。"),
    ("teaching_design", "PBI 教学重组", "依该课核准实体课时建立流程、Can-Do 与练习 coverage。"),
    ("teacher_guide", "教师手册内容母版", "完成并批准可直接执行的教师手册。"),
    ("support_materials", "预习卡与补充活动材料", "完成预习卡、活动卡、评量表与 Exit Ticket。"),
    ("storyboard", "PPT storyboard", "逐页对应教材内容、学生动作、音档与课堂产出。"),
    ("visual_storyboard", "Visual storyboard", "确认版式、视觉用途、素材来源与学生画面文字上限。"),
    ("prototype", "6 张视觉 prototype", "确认学生画面方向、字级、留白与图片比例。"),
    ("pptx", "完整原生 PPTX", "完成可编辑、静态、16:9 的课堂 PPTX。"),
    ("audio_notes", "音档与 speaker notes", "完成音频嵌入、编号对应与 PowerPoint 播放测试。"),
    ("qa_rehearsal", "内容 QA、技术 QA 与教师 rehearsal", "依该课核准实体课时完成内容、版面、技术、列印与课堂流程验证。"),
    ("release", "不可变交付包", "从 authority 建立 release，并完成版本与 hash 登记。"),
]


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def project_relative(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def parse_lesson_catalog() -> dict[int, dict[str, Any]]:
    """Read lesson titles and page/audio counts from JSON or legacy Markdown."""

    if not CATALOG_PATH.is_file():
        return {}

    if CATALOG_PATH.suffix.lower() == ".json":
        payload = read_json(CATALOG_PATH) or {}
        catalog: dict[int, dict[str, Any]] = {}
        for lesson in payload.get("lessons", []):
            number = int(lesson["lesson_number"])
            printed_start = lesson.get("printed_page_start")
            printed_end = lesson.get("printed_page_end_estimate")
            catalog[number] = {
                "title": lesson.get("title") or f"第 {number} 课",
                "printed_pages": (
                    f"{printed_start}–{printed_end}"
                    if printed_start is not None and printed_end is not None
                    else None
                ),
                "pdf_pages": str(lesson.get("pdf_page")) if lesson.get("pdf_page") else None,
                "audio_count": len(lesson.get("audio", [])),
            }
        return catalog

    catalog: dict[int, dict[str, Any]] = {}
    row_pattern = re.compile(
        r"^\|\s*第(\d+)课\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*已下载，\s*(\d+)个\s*\|"
    )
    for line in CATALOG_PATH.read_text(encoding="utf-8").splitlines():
        match = row_pattern.match(line)
        if not match:
            continue
        number, title, printed_pages, pdf_pages, audio_count = match.groups()
        catalog[int(number)] = {
            "title": title.strip(),
            "printed_pages": printed_pages.strip(),
            "pdf_pages": pdf_pages.strip(),
            "audio_count": int(audio_count),
        }
    return catalog


def contains_approval(value: Any) -> bool:
    return isinstance(value, str) and "approved" in value.lower()


def path_if_exists(path: str | None) -> str | None:
    if not path:
        return None
    candidate = PROJECT_ROOT / path
    return path if candidate.exists() else None


def scoped_registry() -> tuple[dict[str, Any], dict[int, dict[str, Any]]]:
    """Return the registry and only the active textbook's lessons."""

    registry = read_json(LESSON_REGISTRY_PATH) or {}
    lessons: dict[int, dict[str, Any]] = {}
    for item in registry.get("lessons", []):
        if item.get("textbook_id") != TEXTBOOK_ID:
            continue
        lessons[int(item["lesson_number"])] = item
    return registry, lessons


def first_matching(directory: Path, pattern: str) -> str | None:
    if not directory.is_dir():
        return None
    matches = sorted(directory.glob(pattern))
    return project_relative(matches[0]) if matches else None


def draft_manifests(lesson_root: Path) -> list[dict[str, Any]]:
    manifests: list[dict[str, Any]] = []
    draft_root = lesson_root / "10-design/pptx-draft"
    if not draft_root.is_dir():
        return manifests
    for path in sorted(draft_root.glob("*/manifest.json")):
        payload = read_json(path)
        if payload is not None:
            payload = dict(payload)
            payload["manifest_path"] = project_relative(path)
            payload["compatibility_status"] = (
                "legacy_unverified"
                if payload.get("builder_scope") == "legacy_generator_unverified"
                else "current_or_explicit"
            )
            manifests.append(payload)
    return manifests


def evidence_items(items: list[tuple[str | None, str]]) -> list[dict[str, str]]:
    evidence: list[dict[str, str]] = []
    seen: set[str] = set()
    for path, label in items:
        existing = path_if_exists(path)
        if existing and existing not in seen:
            evidence.append({"label": label, "path": existing})
            seen.add(existing)
    return evidence


def gate_record(
    number: int,
    key: str,
    title: str,
    description: str,
    status: str,
    evidence: list[dict[str, str]],
) -> dict[str, Any]:
    labels = {
        "done": "已完成",
        "approved": "已批准",
        "review": "待处理",
        "available": "可开始",
        "todo": "尚未开始",
        "locked": "锁定",
    }
    return {
        "number": number,
        "id": key,
        "title": title,
        "description": description,
        "status": status,
        "status_label": labels[status],
        "evidence": evidence,
    }


def build_gates(
    lesson_number: int,
    lesson_root: Path,
    authority: dict[str, Any] | None,
    source: dict[str, Any] | None,
    unlocked: bool,
) -> list[dict[str, Any]]:
    """Build a normalized 11-gate view without duplicating lesson file links."""

    if authority is None:
        first_status = "locked"
        if unlocked:
            first_status = "review" if source else "available"
        gates = []
        for number, (key, title, description) in enumerate(GATE_DEFINITIONS, start=1):
            evidence: list[dict[str, str]] = []
            if key == "source_review":
                evidence = evidence_items(
                    [
                        (
                            project_relative(lesson_root / "00-source/source-manifest.json"),
                            "来源 manifest",
                        )
                    ]
                )
            status = first_status if number == 1 else "locked"
            gates.append(gate_record(number, key, title, description, status, evidence))
        return gates

    source_review = bool(
        source
        and source.get("source_qa_status") == "passed"
        and source.get("source_status") in {"verified", "approved"}
    )
    teaching_design = read_json(lesson_root / "10-design/teaching-design/manifest.json")
    storyboard = read_json(lesson_root / "10-design/storyboard/manifest.json")
    visual_storyboard = read_json(lesson_root / "10-design/visual-storyboard/manifest.json")
    prototype = read_json(lesson_root / "10-design/visual-prototype/manifest.json")

    teacher_manual = authority.get("authority", {}).get("teacher_manual", {})
    activities = authority.get("authority", {}).get("activities", {})
    pptx = authority.get("authority", {}).get("pptx", {})
    qa = authority.get("qa", {})
    rehearsal = qa.get("rehearsal", {})
    release = authority.get("release", {})

    checks = {
        "source_review": source_review,
        "teaching_design": bool(teaching_design and contains_approval(teaching_design.get("status"))),
        "teacher_guide": teacher_manual.get("status") == "final_confirmed",
        "support_materials": activities.get("status") == "final_confirmed",
        "storyboard": bool(
            storyboard
            and (
                contains_approval(storyboard.get("current_revision_status"))
                or contains_approval(storyboard.get("status"))
            )
        ),
        "visual_storyboard": bool(
            visual_storyboard
            and (
                visual_storyboard.get("current_pptx_alignment_status") == "approved"
                or contains_approval(visual_storyboard.get("current_revision_status"))
                or contains_approval(visual_storyboard.get("status"))
            )
        ),
        "prototype": bool(prototype and contains_approval(prototype.get("status"))),
        "pptx": pptx.get("status") == "final_confirmed",
        "audio_notes": rehearsal.get("audio_playback_status") == "passed",
        "qa_rehearsal": bool(
            qa.get("status") == "recorded_current_pass"
            and rehearsal.get("status") == "passed"
        ),
        "release": bool(
            release.get("status") == "immutable"
            and release.get("delivery_status") == "ready"
        ),
    }

    design_inputs = authority.get("design_inputs", {})
    coverage_path = first_matching(
        lesson_root / "10-design/teaching-design", "*activity-coverage*.csv"
    )
    prototype_path = first_matching(
        lesson_root / "10-design/visual-prototype", "*.pptx"
    )
    source_label = (
        "历史来源快照"
        if authority.get("source_package", {}).get("status") == "historical_evidence"
        else "冻结来源资料"
    )
    evidence_by_key = {
        "source_review": evidence_items(
            [
                (
                    project_relative(lesson_root / "00-source/source-manifest.json"),
                    "来源 manifest",
                ),
                (authority.get("source_package", {}).get("path"), source_label),
            ]
        ),
        "teaching_design": evidence_items(
            [
                (
                    project_relative(lesson_root / "10-design/teaching-design/manifest.json"),
                    "教学重组 manifest",
                ),
                (
                    coverage_path,
                    "练习 coverage",
                ),
            ]
        ),
        "teacher_guide": evidence_items(
            [
                (teacher_manual.get("path"), "教师手册"),
            ]
        ),
        "support_materials": evidence_items(
            [
                (activities.get("path"), "活动材料目录"),
                (
                    project_relative(lesson_root / "10-design/activity-package-manifest.json"),
                    "活动材料 manifest",
                ),
            ]
        ),
        "storyboard": evidence_items(
            [
                (
                    project_relative(lesson_root / "10-design/storyboard/manifest.json"),
                    "PPT storyboard manifest",
                ),
                (
                    f"{(design_inputs.get('storyboard') or '').rstrip('/')}/{storyboard.get('current_revision')}"
                    if storyboard
                    else None,
                    "当前 PPT 大纲",
                ),
            ]
        ),
        "visual_storyboard": evidence_items(
            [
                (
                    project_relative(lesson_root / "10-design/visual-storyboard/manifest.json"),
                    "Visual storyboard manifest",
                ),
                (
                    f"{(design_inputs.get('visual_storyboard') or '').rstrip('/')}/{visual_storyboard.get('current_revision')}"
                    if visual_storyboard
                    else None,
                    "当前 Visual storyboard",
                ),
            ]
        ),
        "prototype": evidence_items(
            [
                (
                    project_relative(lesson_root / "10-design/visual-prototype/manifest.json"),
                    "prototype manifest",
                ),
                (
                    prototype_path,
                    "6 张 prototype PPTX",
                ),
            ]
        ),
        "pptx": evidence_items(
            [
                (pptx.get("path"), "完整课堂 PPTX"),
                (
                    authority.get("authority", {}).get("ppt_preview", {}).get("path"),
                    "投影片预览",
                ),
            ]
        ),
        "audio_notes": evidence_items(
            [
                (qa.get("current_report"), "音档播放与 QA 记录"),
                (rehearsal.get("audio_playback_evidence"), "音档验证证据"),
            ]
        ),
        "qa_rehearsal": evidence_items(
            [
                (qa.get("current_report"), "QA 记录"),
                (rehearsal.get("evidence"), "教师 rehearsal 确认"),
            ]
        ),
        "release": evidence_items(
            [
                (release.get("latest_zip_path"), "完整交付 ZIP"),
                (
                    project_relative(lesson_root / "40-release/latest-release.json"),
                    "release 记录",
                ),
            ]
        ),
    }

    gates: list[dict[str, Any]] = []
    previous_complete = True
    for number, (key, title, description) in enumerate(GATE_DEFINITIONS, start=1):
        complete = checks[key]
        if complete:
            status = "done"
        elif previous_complete:
            status = "review" if evidence_by_key[key] else "todo"
        else:
            status = "locked"
        gates.append(gate_record(number, key, title, description, status, evidence_by_key[key]))
        previous_complete = previous_complete and complete
    return gates


def build_file_groups(
    lesson_root: Path,
    authority: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    if authority is None:
        return []

    groups: list[dict[str, Any]] = []
    authority_manifest_path = project_relative(lesson_root / "20-approved/lesson-manifest.json")
    authority_files = evidence_items(
        [(authority_manifest_path, "lesson authority manifest")]
    )
    authority_files.extend(
        {
            "label": Path(item["path"]).name,
            "path": item["path"],
        }
        for item in authority.get("files", [])
        if path_if_exists(item.get("path"))
    )
    if authority_files:
        groups.append(
            {"id": "authority", "title": "20-approved 权威文件", "files": authority_files}
        )

    design_inputs = authority.get("design_inputs", {})
    design_files = evidence_items(
        [
            (
                project_relative(lesson_root / "00-source/source-manifest.json"),
                "来源审核 manifest",
            ),
            (
                project_relative(lesson_root / "10-design/teaching-design/manifest.json"),
                "教学重组 manifest",
            ),
            (
                project_relative(lesson_root / "10-design/storyboard/manifest.json"),
                "PPT storyboard manifest",
            ),
            (
                project_relative(lesson_root / "10-design/visual-storyboard/manifest.json"),
                "Visual storyboard manifest",
            ),
            (
                project_relative(lesson_root / "10-design/visual-prototype/manifest.json"),
                "prototype manifest",
            ),
            (design_inputs.get("activity_package_manifest"), "活动材料 manifest"),
        ]
    )
    if design_files:
        groups.append({"id": "design", "title": "设计与来源证据", "files": design_files})

    qa = authority.get("qa", {})
    rehearsal = qa.get("rehearsal", {})
    qa_files = evidence_items(
        [
            (qa.get("current_report"), "当前 QA 记录"),
            (rehearsal.get("evidence"), "教师 rehearsal 确认"),
            (rehearsal.get("audio_playback_evidence"), "音档播放验证"),
            (authority.get("release", {}).get("latest_zip_path"), "最新交付 ZIP"),
            (
                project_relative(lesson_root / "40-release/latest-release.json"),
                "release 记录",
            ),
        ]
    )
    if qa_files:
        groups.append({"id": "qa", "title": "QA 与 release 证据", "files": qa_files})
    return groups


def build_lesson(
    number: int,
    catalog: dict[int, dict[str, Any]],
    previous_delivered: bool,
    registry_lessons: dict[int, dict[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any], bool]:
    lesson_id = f"lesson-{number:02d}"
    identity = registry_lessons.get(number, {})
    lesson_key = identity.get("lesson_key") or f"{TEXTBOOK_ID}:{lesson_id}"
    lesson_root = PROJECT_ROOT / identity.get("lesson_path", f"{LESSON_ROOT.relative_to(PROJECT_ROOT)}/{lesson_id}")
    authority_path = lesson_root / "20-approved/lesson-manifest.json"
    source_path = lesson_root / "00-source/source-manifest.json"
    authority = read_json(authority_path)
    source = read_json(source_path)
    catalog_entry = dict(catalog.get(number, {}))
    # The cross-textbook lesson registry is the current identity authority.
    # Keep a raw inventory title only as provenance when OCR differs from the
    # confirmed printed title, but never show that stale title as the lesson
    # name in the dashboard.
    if identity.get("title"):
        inventory_title = catalog_entry.get("title")
        if inventory_title and inventory_title != identity["title"]:
            catalog_entry["source_inventory_title"] = inventory_title
        catalog_entry["title"] = identity["title"]

    title = (
        (authority or source or {}).get("lesson_title")
        or catalog_entry.get("title")
        or identity.get("title")
        or f"第 {number} 课"
    )
    drafts = draft_manifests(lesson_root)
    draft_available = any(item.get("compatibility_status") != "legacy_unverified" for item in drafts)
    legacy_draft_available = bool(drafts) and not draft_available
    unlocked = previous_delivered
    # A lesson with an explicitly scoped draft is actionable even when the
    # previous lesson has not reached immutable release. Keep authority gates
    # locked, but expose the source-review gate instead of hiding all work.
    gates = build_gates(number, lesson_root, authority, source, unlocked or draft_available)
    completed_gates = sum(1 for gate in gates if gate["status"] in {"done", "approved"})
    delivered = bool(
        authority
        and authority.get("release", {}).get("status") == "immutable"
        and authority.get("release", {}).get("delivery_status") == "ready"
    )

    if delivered:
        status = "delivered"
        status_label = "已交付"
        stage = "交付完成"
        next_action = "已完成；交付包保持锁定。"
        unlock_reason = ""
    elif authority:
        status = "in_progress"
        status_label = "制作中"
        current_gate = next(
            (gate for gate in gates if gate["status"] in {"review", "todo"}),
            None,
        )
        stage = current_gate["title"] if current_gate else "等待 QA"
        next_action = (
            f"完成「{current_gate['title']}」并记录证据。"
            if current_gate
            else "检查下一个未完成 gate。"
        )
        unlock_reason = ""
    elif unlocked:
        status = "source_review" if source else "available"
        status_label = "来源审核" if source else "可开始"
        stage = "来源审核" if source else "等待开始"
        next_action = "继续来源审核并记录批准。" if source else "开始来源审核。"
        unlock_reason = "上一课已完成交付，当前课次已解锁。"
    elif draft_available:
        status = "draft_in_progress"
        status_label = "草稿製作中"
        stage = "10-design PPTX draft"
        next_action = "完成來源語義、教師手冊、配套、QA 與 rehearsal 後，才能升級 authority。"
        unlock_reason = "來源包與線上／實體邊界已允許 draft；authority／release 仍依序鎖定。"
    elif legacy_draft_available:
        status = "draft_legacy_unverified"
        status_label = "旧草稿待核"
        stage = "10-design 旧 draft"
        next_action = "不要沿用旧草稿；先以本课 lesson_key、来源包与边界确认重新建立当前 draft。"
        unlock_reason = "发现旧生成器草稿，但它没有当前生成器兼容声明，不能作为生产输入。"
    else:
        status = "locked"
        status_label = "锁定"
        stage = "等待上一课完成"
        next_action = f"等待第 {number - 1} 课完成交付后解锁。"
        unlock_reason = f"逐课生产规则：第 {number - 1} 课尚未完成交付。"

    scope = (authority or {}).get("scope", {})
    authority_section = (authority or {}).get("authority", {})
    canonical = read_json(lesson_root / "00-source/canonical-source.json") or {}
    source_counts = source.get("counts", {}) if source else {}
    canonical_sections = canonical.get("sections", [])
    source_section_count = (
        (source or {}).get("section_count")
        or source_counts.get("sections")
        or (len(canonical_sections) if isinstance(canonical_sections, (list, dict)) else None)
    )
    exercise_count = (
        (source or {}).get("exercise_count")
        or source_counts.get("exercises")
        or source_counts.get("listening_contract_records")
        or source_counts.get("comprehensive_exercises")
    )
    summary = {
        "id": lesson_key,
        "lesson_key": lesson_key,
        "textbook_id": TEXTBOOK_ID,
        "offering_id": OFFERING_ID,
        "lesson_id": lesson_id,
        "number": number,
        "title": title,
        "status": status,
        "status_label": status_label,
        "stage": stage,
        "next_action": next_action,
        "unlock_reason": unlock_reason,
        "draft_available": draft_available,
        "drafts": [
            {
                "mode": item.get("mode"),
                "status": item.get("status"),
                "output": item.get("output"),
                "manifest_path": item.get("manifest_path"),
                "compatibility_status": item.get("compatibility_status"),
            }
            for item in drafts
        ],
        "progress": {
            "completed": completed_gates,
            "total": len(GATE_DEFINITIONS),
            "percent": round(completed_gates / len(GATE_DEFINITIONS) * 100),
        },
        "catalog": catalog_entry,
        "scope": {
            "period_count": scope.get("period_count"),
            "total_minutes": scope.get("total_minutes"),
            "ppt_slide_count": scope.get("ppt_slide_count"),
            "activity_count": scope.get("activity_count"),
        },
        "counts": {
            "source_sections": source_section_count,
            "exercises": exercise_count,
            "audio": (source or {}).get("audio_count") or catalog_entry.get("audio_count"),
            "authority_files": len((authority or {}).get("files", [])),
            "activity_files": authority_section.get("activities", {}).get("file_count"),
        },
        "manifest_path": project_relative(authority_path) if authority else None,
        "source_manifest_path": project_relative(source_path) if source else None,
    }
    detail = {
        "identity": identity,
        "manifest": authority,
        "source_manifest": source,
        "gates": gates,
        "file_groups": build_file_groups(lesson_root, authority),
    }
    return summary, detail, delivered


def build() -> Path:
    identity_errors = validate_lesson_identity(LESSON_REGISTRY_PATH, PROJECT_ROOT / "project.config.json")
    if identity_errors:
        raise RuntimeError("lesson identity validation failed:\n" + "\n".join(identity_errors))
    registry, registry_lessons = scoped_registry()
    catalog = parse_lesson_catalog()
    lesson_summaries: list[dict[str, Any]] = []
    lesson_details: dict[str, dict[str, Any]] = {}
    previous_delivered = True

    for number in range(1, LESSON_COUNT + 1):
        summary, detail, delivered = build_lesson(
            number, catalog, previous_delivered, registry_lessons
        )
        lesson_summaries.append(summary)
        lesson_details[summary["id"]] = detail
        previous_delivered = delivered

    focus = next(
        (
            lesson
            for lesson in lesson_summaries
            if lesson["status"] in {"in_progress", "source_review", "available", "draft_in_progress"}
        ),
        lesson_summaries[-1],
    )
    counts = {
        "delivered": sum(lesson["status"] == "delivered" for lesson in lesson_summaries),
        "in_progress": sum(lesson["status"] == "in_progress" for lesson in lesson_summaries),
        "available": sum(lesson["status"] in {"source_review", "available", "draft_in_progress"} for lesson in lesson_summaries),
        "draft_available": sum(bool(lesson.get("draft_available")) for lesson in lesson_summaries),
        "locked": sum(lesson["status"] == "locked" for lesson in lesson_summaries),
        "completed_gates": sum(lesson["progress"]["completed"] for lesson in lesson_summaries),
        "total_gates": len(lesson_summaries) * len(GATE_DEFINITIONS),
    }
    production_gates = {
        purpose: {
            "status": result["status"],
            "blockers": result["blockers"],
        }
        for purpose in ("teacher-guide", "support", "prototype", "pptx", "release")
        for result in [check_production_gate(purpose)]
    }

    course_documents = [
        ("课程清单", CONFIG.get("course_manifest")),
        (
            "当前开课实例",
            f"course/offerings/{CONFIG.get('active_context', {}).get('offering_id')}/offering.json",
        ),
        ("教材清单", CONFIG.get("textbook_registry")),
        ("课次身份索引", CONFIG.get("lesson_registry")),
        ("当前教材", CONFIG.get("textbook", {}).get("manifest")),
        ("教材来源索引", project_relative(CATALOG_PATH) if CATALOG_PATH.exists() else None),
    ]
    documents = [
        {"label": label, "path": path}
        for label, path in course_documents
        if path_if_exists(path)
    ]
    dashboard = {
        "schema_version": "2.0",
        "manifest_type": "course-dashboard",
        "generated_at": date.today().isoformat(),
        "generated_from": {
            "authority_manifests": f"{project_relative(LESSON_ROOT)}/lesson-XX/20-approved/lesson-manifest.json",
            "lesson_catalog": project_relative(CATALOG_PATH) if CATALOG_PATH.exists() else None,
            "lesson_registry": project_relative(LESSON_REGISTRY_PATH),
        },
        "course": {
            "id": CONFIG["course_id"],
            "title": CONFIG.get("course_title", "榮市大學華語聽說課程"),
            "offering_id": CONFIG.get("active_context", {}).get("offering_id"),
            "textbook_id": CONFIG.get("active_context", {}).get("textbook_id"),
            "textbook_title": CONFIG.get("active_textbook_title"),
            "lesson_count": LESSON_COUNT,
            "lesson_key_format": LESSON_KEY_FORMAT,
            "active_lesson_key": CONFIG.get("active_context", {}).get("lesson_key"),
            "lesson_registry": project_relative(LESSON_REGISTRY_PATH),
            "textbooks": registry.get("textbooks", []),
            "documents": documents,
        },
        "summary": {
            **counts,
            "focus_lesson_id": focus["id"],
            "focus_lesson_key": focus["lesson_key"],
            "focus_lesson_title": focus["title"],
            "next_action": focus["next_action"],
        },
        "lessons": lesson_summaries,
        "lesson_details": lesson_details,
        "production_gates": production_gates,
    }

    DASHBOARD_ROOT.mkdir(parents=True, exist_ok=True)
    output = "window.DASHBOARD_MANIFEST = " + json.dumps(
        dashboard, ensure_ascii=False, indent=2
    ) + ";\n"
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    return OUTPUT_PATH


if __name__ == "__main__":
    print(build())
