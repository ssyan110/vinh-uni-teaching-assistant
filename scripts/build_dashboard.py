#!/usr/bin/env python3
"""Build the file://-safe dashboard cache from lesson authority manifests."""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from production_gate import check as check_production_gate


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_COUNT = int(CONFIG.get("lesson_count", 8))
LESSON_ROOT = PROJECT_ROOT / "lessons"
CATALOG_PATH = PROJECT_ROOT / CONFIG.get(
    "lesson_catalog", "Giáo trình/博雅汉语听说-中级冲刺篇/教材资料索引.md"
)
DASHBOARD_ROOT = PROJECT_ROOT / CONFIG["dashboard_root"]
OUTPUT_PATH = DASHBOARD_ROOT / "manifest.js"


GATE_DEFINITIONS = [
    ("source_review", "来源审核", "核对教材 PDF、区段、练习、音频与答案政策。"),
    ("teaching_design", "PBI 教学重组", "建立 6 节／300 分钟流程、Can-Do 与练习 coverage。"),
    ("teacher_guide", "教师手册内容母版", "完成并批准可直接执行的教师手册。"),
    ("support_materials", "预习卡与补充活动材料", "完成预习卡、活动卡、评量表与 Exit Ticket。"),
    ("storyboard", "PPT storyboard", "逐页对应教材内容、学生动作、音档与课堂产出。"),
    ("visual_storyboard", "Visual storyboard", "确认版式、视觉用途、素材来源与学生画面文字上限。"),
    ("prototype", "6 张视觉 prototype", "确认学生画面方向、字级、留白与图片比例。"),
    ("pptx", "完整原生 PPTX", "完成可编辑、静态、16:9 的课堂 PPTX。"),
    ("audio_notes", "音档与 speaker notes", "完成音频嵌入、编号对应与 PowerPoint 播放测试。"),
    ("qa_rehearsal", "内容 QA、技术 QA 与教师 rehearsal", "完成内容、版面、技术、列印与 300 分钟课堂流程验证。"),
    ("release", "不可变交付包", "从 authority 建立 release，并完成版本与 hash 登记。"),
]


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def project_relative(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def parse_lesson_catalog() -> dict[int, dict[str, Any]]:
    """Read lesson titles and page/audio counts from the canonical source index."""

    if not CATALOG_PATH.is_file():
        return {}

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


def first_matching(directory: Path, pattern: str) -> str | None:
    if not directory.is_dir():
        return None
    matches = sorted(directory.glob(pattern))
    return project_relative(matches[0]) if matches else None


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
    evidence_by_key = {
        "source_review": evidence_items(
            [
                (
                    project_relative(lesson_root / "00-source/source-manifest.json"),
                    "来源 manifest",
                ),
                (authority.get("source_package", {}).get("path"), "冻结来源资料"),
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
                ("course/teacher-manual.md", "整学期主手册"),
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
                    f"{design_inputs.get('storyboard', '').rstrip('/')}/{storyboard.get('current_revision')}"
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
                    f"{design_inputs.get('visual_storyboard', '').rstrip('/')}/{visual_storyboard.get('current_revision')}"
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
) -> tuple[dict[str, Any], dict[str, Any], bool]:
    lesson_id = f"lesson-{number:02d}"
    lesson_root = LESSON_ROOT / lesson_id
    authority_path = lesson_root / "20-approved/lesson-manifest.json"
    source_path = lesson_root / "00-source/source-manifest.json"
    authority = read_json(authority_path)
    source = read_json(source_path)
    catalog_entry = catalog.get(number, {})

    title = (authority or source or {}).get("lesson_title") or catalog_entry.get("title") or f"第 {number} 课"
    unlocked = previous_delivered
    gates = build_gates(number, lesson_root, authority, source, unlocked)
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
    else:
        status = "locked"
        status_label = "锁定"
        stage = "等待上一课完成"
        next_action = f"等待第 {number - 1} 课完成交付后解锁。"
        unlock_reason = f"逐课生产规则：第 {number - 1} 课尚未完成交付。"

    scope = (authority or {}).get("scope", {})
    authority_section = (authority or {}).get("authority", {})
    summary = {
        "id": lesson_id,
        "number": number,
        "title": title,
        "status": status,
        "status_label": status_label,
        "stage": stage,
        "next_action": next_action,
        "unlock_reason": unlock_reason,
        "progress": {
            "completed": completed_gates,
            "total": len(GATE_DEFINITIONS),
            "percent": round(completed_gates / len(GATE_DEFINITIONS) * 100),
        },
        "catalog": catalog_entry,
        "scope": {
            "period_count": scope.get("period_count", 6),
            "total_minutes": scope.get("total_minutes", 300),
            "ppt_slide_count": scope.get("ppt_slide_count"),
            "activity_count": scope.get("activity_count"),
        },
        "counts": {
            "source_sections": (source or {}).get("section_count"),
            "exercises": (source or {}).get("exercise_count"),
            "audio": (source or {}).get("audio_count") or catalog_entry.get("audio_count"),
            "authority_files": len((authority or {}).get("files", [])),
            "activity_files": authority_section.get("activities", {}).get("file_count"),
        },
        "manifest_path": project_relative(authority_path) if authority else None,
        "source_manifest_path": project_relative(source_path) if source else None,
    }
    detail = {
        "manifest": authority,
        "source_manifest": source,
        "gates": gates,
        "file_groups": build_file_groups(lesson_root, authority),
    }
    return summary, detail, delivered


def build() -> Path:
    catalog = parse_lesson_catalog()
    lesson_summaries: list[dict[str, Any]] = []
    lesson_details: dict[str, dict[str, Any]] = {}
    previous_delivered = True

    for number in range(1, LESSON_COUNT + 1):
        summary, detail, delivered = build_lesson(number, catalog, previous_delivered)
        lesson_summaries.append(summary)
        lesson_details[summary["id"]] = detail
        previous_delivered = delivered

    focus = next(
        (
            lesson
            for lesson in lesson_summaries
            if lesson["status"] in {"in_progress", "source_review", "available"}
        ),
        lesson_summaries[-1],
    )
    counts = {
        "delivered": sum(lesson["status"] == "delivered" for lesson in lesson_summaries),
        "in_progress": sum(lesson["status"] == "in_progress" for lesson in lesson_summaries),
        "available": sum(lesson["status"] in {"source_review", "available"} for lesson in lesson_summaries),
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
        ("整学期教师手册", "course/teacher-manual.md"),
        ("整学期课程总览", "course/semester-overview.md"),
        ("教材资料索引", project_relative(CATALOG_PATH) if CATALOG_PATH.exists() else None),
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
            "authority_manifests": "lessons/lesson-XX/20-approved/lesson-manifest.json",
            "lesson_catalog": project_relative(CATALOG_PATH) if CATALOG_PATH.exists() else None,
        },
        "course": {
            "id": CONFIG["course_id"],
            "title": CONFIG.get("course_title", "《博雅汉语听说：中级冲刺篇 I》"),
            "lesson_count": LESSON_COUNT,
            "documents": documents,
        },
        "summary": {
            **counts,
            "focus_lesson_id": focus["id"],
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
