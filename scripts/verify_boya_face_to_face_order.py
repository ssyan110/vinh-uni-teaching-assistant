#!/usr/bin/env python3
"""Verify the student-facing order of Boya face-to-face PPTX drafts.

This is a read-only checker. It validates existing 10-design drafts and
reports missing lesson decks as blockers; it never creates a replacement deck
or promotes anything to 20-approved/40-release.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
TEXTBOOK = "boya-quasi-intermediate-i"
LESSON_ROOT = ROOT / "lessons" / TEXTBOOK
CONTRACT_PATH = ROOT / "course" / "boya-face-to-face-order-contract.json"
NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
LABELS = ("一", "二", "三")


def source_for(lesson_number: int) -> Path:
    filename = "source-extraction-draft.json" if lesson_number == 1 else "canonical-source.json"
    return LESSON_ROOT / f"lesson-{lesson_number:02d}" / "00-source" / filename


def deck_for(lesson_number: int) -> Path:
    return (
        LESSON_ROOT
        / f"lesson-{lesson_number:02d}"
        / "10-design"
        / "pptx-draft"
        / "face-to-face"
        / f"lesson-{lesson_number:02d}-实体课.pptx"
    )


def slide_texts(deck: Path) -> list[str]:
    with zipfile.ZipFile(deck) as archive:
        names = [name for name in archive.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)]
        names.sort(key=lambda name: int(re.search(r"slide(\d+)\.xml", name).group(1)))
        result: list[str] = []
        for name in names:
            root = ElementTree.fromstring(archive.read(name))
            result.append(" | ".join(node.text or "" for node in root.findall(".//a:t", NS)))
        return result


def items(section: dict, key: str) -> list[str]:
    value = (section.get("exercises") or {}).get(key)
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, dict) and isinstance(value.get("items"), list):
        return [str(item) for item in value["items"]]
    return []


def find(texts: list[str], start: int, end: int, predicate) -> int:
    for index in range(start, end):
        if predicate(texts[index]):
            return index
    return -1


def short_sections(lesson_number: int, source: dict) -> list[dict]:
    if lesson_number == 1:
        sections = source.get("sections", [])
        if isinstance(sections, dict):
            return [sections[f"short_text_{index}"] for index in range(1, 4)]
        return [section for section in sections if section.get("id", "").startswith("short_text_")]
    return [section for section in source.get("sections", []) if section.get("text")]


def expression_policy(source: dict) -> tuple[list[dict], bool]:
    sections = [
        section
        for section in source.get("sections", [])
        if str(section.get("id", "")).startswith("common_expressions")
    ]
    grouped = any(section.get("groups") for section in sections)
    return sections, grouped


def verify_lesson(lesson_number: int) -> dict:
    deck = deck_for(lesson_number)
    result = {
        "lesson_key": f"{TEXTBOOK}:lesson-{lesson_number:02d}",
        "deck": str(deck.relative_to(ROOT)),
        "status": "passed",
        "slide_count": 0,
        "first_short_text_divider_slide": None,
        "errors": [],
    }
    if not deck.is_file():
        result["status"] = "blocked"
        result["errors"].append("实体课 PPTX 不存在；没有可验证的实际页序")
        return result
    source_path = source_for(lesson_number)
    if not source_path.is_file():
        result["status"] = "blocked"
        result["errors"].append(f"来源文件不存在：{source_path.relative_to(ROOT)}")
        return result
    source = json.loads(source_path.read_text(encoding="utf-8"))
    texts = slide_texts(deck)
    result["slide_count"] = len(texts)
    errors: list[str] = result["errors"]
    if len(texts) < 5:
        errors.append("投影片少于 5 张，无法满足前导页与短文（一）顺序")
        result["status"] = "failed"
        return result
    if "今天的学习路线" not in texts[1]:
        errors.append("第 2 张不是学习流程页")
    if "学完这课后，我能" not in texts[2]:
        errors.append("第 3 张不是 Can-Do 页")
    if "先想一想" not in texts[3]:
        errors.append("第 4 张不是暖身页")

    first_short = find(texts, 0, len(texts), lambda value: "短文（一）" in value and "你说的跟短文（一）" not in value)
    result["first_short_text_divider_slide"] = first_short + 1 if first_short >= 0 else None
    if lesson_number == 1 and first_short != 4:
        errors.append(f"第 1 课的短文（一）divider 应为第 5 张，实际为第 {first_short + 1 if first_short >= 0 else '—'} 张")
    elif lesson_number != 1 and first_short < 4:
        errors.append(f"短文（一）divider 必须在前置内容之后，实际为第 {first_short + 1 if first_short >= 0 else '—'} 张")

    sections = short_sections(lesson_number, source)
    expression_sections, grouped_expressions = expression_policy(source)
    cursor = max(first_short, 0)
    for section_index, section in enumerate(sections):
        label = LABELS[section_index] if section_index < len(LABELS) else str(section_index + 1)
        divider = find(texts, cursor, len(texts), lambda value, label=label: f"短文（{label}）" in value and "你说的跟" not in value)
        if divider < 0:
            errors.append(f"短文（{label}）divider 缺失")
            continue
        if section_index == 0 and divider != first_short:
            errors.append("短文（一）单元起点与已找到的 divider 不一致")
        if section_index < len(sections) - 1:
            next_label = LABELS[section_index + 1]
            end = find(texts, divider + 1, len(texts), lambda value, next_label=next_label: f"短文（{next_label}）" in value and "你说的跟" not in value)
        else:
            end = find(texts, divider + 1, len(texts), lambda value: "综合表达" in value)
        if end < 0:
            end = len(texts)

        strategy = find(texts, divider + 1, end, lambda value, label=label: "听力练习" in value and "先看题、抓关键词" in value and f"短文（{label}）" in value)
        if strategy < 0:
            errors.append(f"短文{label}缺少听力练习")
        second = items(section, "second_listen")
        first = items(section, "first_listen")
        listening_questions = find(texts, strategy + 1 if strategy >= 0 else divider + 1, end, lambda value: "听力题目" in value and (not second or second[0] in value))
        if listening_questions < 0:
            errors.append(f"短文{label}缺少听力题目")
        simple_questions = find(texts, listening_questions + 1 if listening_questions >= 0 else divider + 1, end, lambda value: "简单题目问答" in value and (not first or first[0] in value))
        if simple_questions < 0:
            errors.append(f"短文{label}缺少简单题目问答")
        oral = find(texts, simple_questions + 1 if simple_questions >= 0 else divider + 1, end, lambda value: "口语练习" in value)
        introduction = find(texts, oral + 1 if oral >= 0 else divider + 1, end, lambda value: "介绍" in value)
        compare = find(texts, introduction + 1 if introduction >= 0 else divider + 1, end, lambda value, label=label: f"你说的跟短文（{label}）哪里不一样？" in value)
        if oral < 0:
            errors.append(f"短文{label}缺少口语练习")
        if introduction < 0:
            errors.append(f"短文{label}缺少介绍任务")
        if compare < 0:
            errors.append(f"短文{label}缺少比较任务")
        # Lesson 1's source stores all sentence patterns in grouped topics,
        # but its approved lesson-specific builder places the three topics in
        # the matching short-text sections.  Later lessons keep grouped
        # patterns shared only when the source does not identify a text.
        expression_expected = lesson_number == 1 or (not grouped_expressions and section_index < len(expression_sections))
        after_compare = compare + 1 if compare >= 0 else divider + 1
        if expression_expected:
            expression = find(texts, after_compare, end, lambda value: "句式练习" in value)
            if expression < 0:
                errors.append(f"短文{label}缺少该短文句式练习")
            output_start = expression + 1 if expression >= 0 else after_compare
        else:
            output_start = after_compare
        output = find(texts, output_start, end, lambda value: "请你说说" in value)
        if output < 0:
            errors.append(f"短文{label}缺少口语输出")
        cursor = output + 1 if output >= 0 else end

    if grouped_expressions and lesson_number != 1:
        shared = find(texts, cursor, len(texts), lambda value: "句式练习" in value)
        if shared < 0:
            errors.append("共享句式练习没有放在三篇短文之后")
        elif find(texts, shared + 1, len(texts), lambda value: "综合表达" in value) < 0:
            errors.append("共享句式练习后缺少综合表达")
    elif find(texts, cursor, len(texts), lambda value: "综合表达" in value) < 0:
        errors.append("三篇短文之后缺少综合表达")

    if errors:
        result["status"] = "failed"
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson", type=int, action="append", choices=range(1, 13))
    args = parser.parse_args()
    lesson_numbers = args.lesson or list(range(1, 13))
    results = [verify_lesson(number) for number in lesson_numbers]
    failed = any(item["status"] == "failed" for item in results)
    blocked = any(item["status"] == "blocked" for item in results)
    summary = {
        "contract": str(CONTRACT_PATH.relative_to(ROOT)),
        "scope": [f"{TEXTBOOK}:lesson-{number:02d}" for number in lesson_numbers],
        "results": results,
        "status": "failed" if failed else "needs-human" if blocked else "passed",
        "blocked_lessons": [item["lesson_key"] for item in results if item["status"] == "blocked"],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if summary["status"] == "failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
