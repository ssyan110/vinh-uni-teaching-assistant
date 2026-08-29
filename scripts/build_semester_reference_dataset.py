#!/usr/bin/env python3
"""Build the legacy reference dataset for 《中级冲刺篇 I》.

This script is intentionally scoped to ``boya-intermediate-i`` (the planned
2027-fall/third-year offering).  It must not be used for the active
``boya-quasi-intermediate-i`` 2026-fall course.  The canonical inputs are the
eight structured lesson JSON files.  The output is a derived reference
artifact: it preserves source/review status and leaves teacher-enrichment
fields blank when the source does not provide them.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable
from zipfile import ZIP_DEFLATED, ZipFile

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


ROOT = Path(__file__).resolve().parents[1]
TEXTBOOK_ROOT = ROOT / "textbooks" / "boya-intermediate-i"
SOURCE_DIR = TEXTBOOK_ROOT / "source" / "derived" / "extractions"
OUT_DIR = TEXTBOOK_ROOT / "source" / "reference-dataset"
AUDIO_ROOT = TEXTBOOK_ROOT / "source" / "audio"
CSV_DIR = OUT_DIR / "csv"
BOOK_TITLE = "博雅汉语听说·中级冲刺篇 I"
DATASET_VERSION = "1.0.0"
TODAY = date.today().isoformat()


def load_lessons() -> list[dict[str, Any]]:
    lessons: list[dict[str, Any]] = []
    for number in range(1, 9):
        path = SOURCE_DIR / f"structured-lesson-{number:02}.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing canonical source: {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        data["_source_file"] = str(path.relative_to(ROOT))
        lessons.append(data)
    return lessons


def first_value(*values: Any) -> Any:
    for value in values:
        if value not in (None, "", [], {}):
            return value
    return ""


def json_text(value: Any) -> str:
    if value in (None, "", [], {}):
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return str(value)


def lines_text(value: Any) -> str:
    if value in (None, "", [], {}):
        return ""
    if isinstance(value, list):
        return "\n".join(json_text(item) for item in value)
    if isinstance(value, dict):
        return json_text(value)
    return str(value)


def number_list(value: Any) -> list[int]:
    if value in (None, "", [], {}):
        return []
    if isinstance(value, dict):
        start = value.get("start")
        end = value.get("end")
        if start is not None and end is not None:
            return [int(start), int(end)]
        return []
    if isinstance(value, (list, tuple)):
        return [int(item) for item in value if str(item).strip().isdigit()]
    if str(value).strip().isdigit():
        return [int(value)]
    return []


def range_text(*values: Any) -> str:
    for value in values:
        nums = number_list(value)
        if nums:
            if len(nums) == 1:
                return str(nums[0])
            return f"{nums[0]}–{nums[-1]}"
    return ""


def page_value(row: dict[str, Any], kind: str) -> Any:
    if kind == "textbook":
        return first_value(
            row.get("textbook_page"),
            row.get("textbook_printed_page"),
            row.get("textbook_page_range"),
            row.get("textbook_printed_pages"),
        )
    return first_value(
        row.get("source_pdf_page"),
        row.get("source_pdf_pages"),
        row.get("source_pdf_page_range"),
    )


def lesson_page_range(lesson: dict[str, Any], kind: str) -> str:
    source = lesson.get("source", {})
    if kind == "textbook":
        return range_text(
            source.get("textbook_printed_page_range"),
            source.get("printed_page_range"),
            source.get("textbook_page_range"),
        )
    return range_text(
        source.get("source_pdf_page_range"),
        source.get("pdf_page_range"),
    )


def value_as_cell(value: Any) -> Any:
    """Keep simple numbers/bools useful in Excel; serialize nested values."""
    if isinstance(value, (dict, list)):
        return json_text(value)
    if value is None:
        return ""
    return value


def section_maps(lesson: dict[str, Any]) -> tuple[dict[str, dict[str, Any]], dict[str, list[str]]]:
    sections = lesson.get("sections") or []
    by_id = {str(item.get("section_id")): item for item in sections if item.get("section_id")}
    audio_by_id = {
        key: [str(item) for item in value.get("audio_asset_ids", [])]
        for key, value in by_id.items()
    }
    return by_id, audio_by_id


def record_audio_ids(row: dict[str, Any], audio_by_id: dict[str, list[str]]) -> str:
    direct = row.get("audio_asset_ids")
    if direct:
        return json_text(direct)
    section_id = row.get("section_id")
    if section_id and audio_by_id.get(str(section_id)):
        return json_text(audio_by_id[str(section_id)])
    return ""


GLOSSARY_PATTERN = re.compile(
    r"^\s*(?P<hanzi>[^（(：: ]+?)\s*(?:[（(](?P<pos>[^）)]+)[）)])?\s*"
    r"(?P<pinyin>[A-Za-zĀ-žüÜāēīōūáéíóúǎěǐǒǔàèìòùǜǚǖǘǙǚ\s·\-]+)?\s*[：:]\s*(?P<definition>.+?)\s*$"
)


def flatten_glossary(lesson: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    def add_structured(entry: dict[str, Any], source_type: str, source_record_id: str = "") -> None:
        rows.append(
            {
                "glossary_record_id": entry.get("record_id") or f"GL{lesson['lesson_number']:02}-{len(rows)+1:03}",
                "lesson_id": lesson.get("lesson_id", ""),
                "lesson_number": lesson.get("lesson_number", ""),
                "lesson_title": lesson.get("lesson_title", ""),
                "source_type": source_type,
                "source_record_id": source_record_id,
                "section_id": entry.get("section_id", ""),
                "textbook_page": value_as_cell(entry.get("textbook_page", "")),
                "source_pdf_page": value_as_cell(entry.get("source_pdf_page", "")),
                "hanzi": entry.get("hanzi", ""),
                "pinyin": entry.get("pinyin", ""),
                "part_of_speech": entry.get("part_of_speech", ""),
                "definition_raw": entry.get("definition_raw", ""),
                "review_status": entry.get("review_status", lesson.get("review_status", "")),
                "source_file": lesson.get("_source_file", ""),
            }
        )

    top_glossary = lesson.get("glossary") or []
    for entry in top_glossary:
        if isinstance(entry, dict):
            add_structured(entry, "lesson_glossary")
        else:
            rows.append(parse_glossary_string(lesson, str(entry), "lesson_glossary", ""))

    for text in lesson.get("texts_dialogues") or []:
        for entry in text.get("glossary") or []:
            if isinstance(entry, dict):
                add_structured(entry, "text_glossary", str(text.get("record_id", "")))
            else:
                rows.append(
                    parse_glossary_string(
                        lesson, str(entry), "text_glossary", str(text.get("record_id", ""))
                    )
                )
    return rows


def parse_glossary_string(
    lesson: dict[str, Any], raw: str, source_type: str, source_record_id: str
) -> dict[str, Any]:
    match = GLOSSARY_PATTERN.match(raw)
    parsed = match.groupdict() if match else {}
    stable_id = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8]
    return {
        "glossary_record_id": f"GL{lesson['lesson_number']:02}-{stable_id}",
        "lesson_id": lesson.get("lesson_id", ""),
        "lesson_number": lesson.get("lesson_number", ""),
        "lesson_title": lesson.get("lesson_title", ""),
        "source_type": source_type,
        "source_record_id": source_record_id,
        "section_id": "",
        "textbook_page": "",
        "source_pdf_page": "",
        "hanzi": (parsed.get("hanzi") or "").strip(),
        "pinyin": (parsed.get("pinyin") or "").strip(),
        "part_of_speech": (parsed.get("pos") or "").strip(),
        "definition_raw": (parsed.get("definition") or raw).strip(),
        "review_status": lesson.get("review_status", ""),
        "source_file": lesson.get("_source_file", ""),
        "raw_glossary": raw,
    }


def glossary_lookup(glossary_rows: list[dict[str, Any]]) -> dict[tuple[int, str], list[dict[str, Any]]]:
    lookup: dict[tuple[int, str], list[dict[str, Any]]] = defaultdict(list)
    for row in glossary_rows:
        hanzi = str(row.get("hanzi", "")).strip()
        if hanzi:
            lookup[(int(row.get("lesson_number") or 0), hanzi)].append(row)
    return lookup


def build_lessons_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        source = lesson.get("source", {})
        qa = lesson.get("source_qa") or {}
        counts = lesson.get("counts") or {}
        rows.append(
            {
                "lesson_id": lesson.get("lesson_id", f"lesson-{lesson.get('lesson_number', ''):02}"),
                "lesson_number": lesson.get("lesson_number", ""),
                "lesson_title": lesson.get("lesson_title", ""),
                "language": lesson.get("language", "简体中文"),
                "textbook_page_range": lesson_page_range(lesson, "textbook"),
                "source_pdf_page_range": lesson_page_range(lesson, "source_pdf"),
                "extraction_status": lesson.get("extraction_status", ""),
                "review_status": lesson.get("review_status", ""),
                "translation_status": lesson.get("translation_status", ""),
                "source_qa_status": qa.get("status", "") if isinstance(qa, dict) else "",
                "source_pdf": first_value(source.get("pdf"), source.get("pdf_path")),
                "audio_root": first_value(source.get("audio_root"), source.get("audio_directory")),
                "vocabulary_count": len(lesson.get("vocabulary") or []),
                "grammar_count": len(lesson.get("grammar_patterns") or []),
                "text_dialogue_count": len(lesson.get("texts_dialogues") or []),
                "exercise_count": len(lesson.get("exercises") or []),
                "audio_count": len(lesson.get("audio_map") or []),
                "section_count": len(lesson.get("sections") or []),
                "glossary_count": len(flatten_glossary(lesson)),
                "counts_source_json": json_text(counts),
                "answer_policy": lines_text(lesson.get("answer_policy")),
                "uncertainty_count": len(lesson.get("uncertainties") or [])
                if isinstance(lesson.get("uncertainties"), list)
                else len(lesson.get("uncertainties") or {}),
                "source_file": lesson.get("_source_file", ""),
            }
        )
    return rows


def build_vocabulary_rows(
    lessons: list[dict[str, Any]], glossary_rows: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    lookup = glossary_lookup(glossary_rows)
    rows = []
    for lesson in lessons:
        section_by_id, audio_by_id = section_maps(lesson)
        for fallback_order, item in enumerate(lesson.get("vocabulary") or [], start=1):
            hanzi = first_value(item.get("chinese_simplified"), item.get("normalized_text"), item.get("hanzi"))
            matched = lookup.get((int(lesson.get("lesson_number") or 0), str(hanzi)), [])
            meaning = "\n".join(str(x.get("definition_raw", "")) for x in matched if x.get("definition_raw"))
            pos = "; ".join(dict.fromkeys(str(x.get("part_of_speech", "")) for x in matched if x.get("part_of_speech")))
            section = section_by_id.get(str(item.get("section_id", "")), {})
            textbook_page = page_value(item, "textbook")
            source_page = page_value(item, "source_pdf")
            rows.append(
                {
                    "record_id": item.get("record_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "order": first_value(item.get("order"), item.get("index"), fallback_order),
                    "chinese_simplified": hanzi,
                    "pinyin": item.get("pinyin", ""),
                    "pinyin_raw": item.get("pinyin_raw", ""),
                    "normalized_text": item.get("normalized_text", ""),
                    "marked": item.get("marked", ""),
                    "textbook_page": value_as_cell(textbook_page),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(source_page),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "section_id": item.get("section_id", ""),
                    "section_label": section.get("section_label_raw", ""),
                    "part_of_speech": pos,
                    "meaning_chinese_from_source": meaning,
                    "glossary_record_ids": "; ".join(str(x.get("glossary_record_id", "")) for x in matched),
                    "source_note": item.get("source_note", ""),
                    "uncertainty": item.get("uncertainty", ""),
                    "raw_source_text": item.get("raw_source_text", ""),
                    "extraction_method": item.get("extraction_method", ""),
                    "audio_asset_ids": record_audio_ids(item, audio_by_id),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "lesson_review_status": lesson.get("review_status", ""),
                    "translation_status": lesson.get("translation_status", ""),
                    # Reserved enrichment fields: intentionally blank until teacher review.
                    "meaning_english": "",
                    "meaning_vietnamese": "",
                    "usage_register": "",
                    "collocations": "",
                    "example_sentence_source": "",
                    "example_sentence_teacher": "",
                    "character_components": "",
                    "source_file": lesson.get("_source_file", ""),
                }
            )
    return rows


def build_grammar_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        section_by_id, _ = section_maps(lesson)
        for fallback_order, item in enumerate(lesson.get("grammar_patterns") or [], start=1):
            section = section_by_id.get(str(item.get("section_id", "")), {})
            examples = first_value(item.get("examples_raw"), item.get("examples"))
            rows.append(
                {
                    "record_id": item.get("record_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "order": first_value(item.get("order"), fallback_order),
                    "pattern": first_value(item.get("pattern"), item.get("pattern_raw"), item.get("normalized_text")),
                    "pattern_raw": item.get("pattern_raw", ""),
                    "normalized_text": item.get("normalized_text", ""),
                    "textbook_page": value_as_cell(page_value(item, "textbook")),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(page_value(item, "source_pdf")),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "section_id": item.get("section_id", ""),
                    "section_label": section.get("section_label_raw", ""),
                    "meaning_raw": item.get("meaning_raw", ""),
                    "explanation_raw": item.get("explanation_raw", ""),
                    "examples_text": lines_text(examples),
                    "examples_json": json_text(examples),
                    "example_count": len(examples) if isinstance(examples, list) else (1 if examples else 0),
                    "example_text_ids": json_text(item.get("example_text_ids")),
                    "raw_source_text": item.get("raw_source_text", ""),
                    "extraction_method": item.get("extraction_method", ""),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "lesson_review_status": lesson.get("review_status", ""),
                    "translation_status": lesson.get("translation_status", ""),
                    # Reserved enrichment fields: intentionally blank until teacher review.
                    "usage_function": "",
                    "form_slots": "",
                    "register_or_tone": "",
                    "common_errors": "",
                    "contrast_patterns": "",
                    "teacher_example": "",
                    "task_evidence": "",
                    "source_file": lesson.get("_source_file", ""),
                }
            )
    return rows


def build_text_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        section_by_id, _ = section_maps(lesson)
        for fallback_sequence, item in enumerate(lesson.get("texts_dialogues") or [], start=1):
            section = section_by_id.get(str(item.get("section_id", "")), {})
            rows.append(
                {
                    "record_id": item.get("record_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "sequence": first_value(item.get("sequence"), fallback_sequence),
                    "text_type": item.get("text_type", ""),
                    "title": item.get("title", ""),
                    "textbook_page": value_as_cell(page_value(item, "textbook")),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(page_value(item, "source_pdf")),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "section_id": item.get("section_id", ""),
                    "section_label": section.get("section_label_raw", ""),
                    "text": first_value(item.get("text_raw"), item.get("normalized_text"), item.get("raw_source_text")),
                    "audio_asset_ids": json_text(item.get("audio_asset_ids")),
                    "glossary_count": len(item.get("glossary") or []),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "text_fidelity_status": item.get("text_fidelity_status", ""),
                    "uncertainty": item.get("uncertainty", ""),
                    "extraction_method": item.get("extraction_method", ""),
                    "source_file": lesson.get("_source_file", ""),
                }
            )
    return rows


def build_exercise_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        section_by_id, _ = section_maps(lesson)
        for fallback_order, item in enumerate(lesson.get("exercises") or [], start=1):
            section = section_by_id.get(str(item.get("section_id", "")), {})
            rows.append(
                {
                    "record_id": item.get("record_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "exercise_order": first_value(item.get("exercise_order"), fallback_order),
                    "exercise_type": item.get("exercise_type", ""),
                    "textbook_page": value_as_cell(page_value(item, "textbook")),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(page_value(item, "source_pdf")),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "section_id": item.get("section_id", ""),
                    "section_label": section.get("section_label_raw", ""),
                    "prompt_raw": item.get("prompt_raw", ""),
                    "options_raw": json_text(item.get("options_raw")),
                    "audio_asset_ids": json_text(item.get("audio_asset_ids")),
                    "related_text_dialogue_ids": json_text(item.get("related_text_dialogue_ids")),
                    "answer_status": item.get("answer_status", ""),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "source_note": item.get("source_note", ""),
                    "uncertainty": item.get("uncertainty", ""),
                    "source_file": lesson.get("_source_file", ""),
                }
            )
    return rows


def build_audio_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        for fallback_order, item in enumerate(lesson.get("audio_map") or [], start=1):
            track = str(item.get("track_label", ""))
            source_file = item.get("file", "")
            canonical_audio_root = (
                f"textbooks/boya-intermediate-i/source/audio/"
                f"lesson-{int(lesson['lesson_number']):02}"
            )
            if track:
                source_file = f"{canonical_audio_root}/{track}.mp3"
            local_candidate = ROOT / source_file
            if not local_candidate.exists() and track:
                local_candidate = AUDIO_ROOT / f"lesson-{int(lesson['lesson_number']):02}" / f"{track}.mp3"
            rows.append(
                {
                    "audio_asset_id": item.get("audio_asset_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "track_label": track,
                    "file": source_file,
                    "file_exists_local": local_candidate.exists(),
                    "textbook_page": value_as_cell(page_value(item, "textbook")),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(page_value(item, "source_pdf")),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "related_section_id": item.get("related_section_id", ""),
                    "related_section": item.get("related_section", ""),
                    "mapping_method": item.get("mapping_method", ""),
                    "mapping_status": item.get("mapping_status", ""),
                    "printed_label_status": item.get("printed_label_status", ""),
                    "content_status": item.get("content_status", ""),
                    "decode_status": first_value(item.get("decode_status"), item.get("ffmpeg_decode_status")),
                    "duration_seconds": item.get("duration_seconds", ""),
                    "size_bytes": item.get("size_bytes", ""),
                    "sha256": item.get("sha256", ""),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "source_audio_root": canonical_audio_root,
                    "source_file": lesson.get("_source_file", ""),
                    "source_order": fallback_order,
                }
            )
    return rows


def build_section_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        for item in lesson.get("sections") or []:
            rows.append(
                {
                    "section_id": item.get("section_id", ""),
                    "lesson_id": lesson.get("lesson_id", ""),
                    "lesson_number": lesson.get("lesson_number", ""),
                    "lesson_title": lesson.get("lesson_title", ""),
                    "section_order": item.get("section_order", ""),
                    "section_level": item.get("section_level", ""),
                    "section_type": item.get("section_type", ""),
                    "section_label_raw": item.get("section_label_raw", ""),
                    "source_part_id": item.get("source_part_id", ""),
                    "source_part_label": item.get("source_part_label", ""),
                    "parent_section_id": item.get("parent_section_id", ""),
                    "textbook_page": value_as_cell(page_value(item, "textbook")),
                    "textbook_page_range": range_text(item.get("textbook_page_range"), item.get("textbook_printed_pages")),
                    "source_pdf_page": value_as_cell(page_value(item, "source_pdf")),
                    "source_pdf_page_range": range_text(item.get("source_pdf_page_range"), item.get("source_pdf_pages")),
                    "audio_asset_ids": json_text(item.get("audio_asset_ids")),
                    "review_status": item.get("review_status", lesson.get("review_status", "")),
                    "source_file": lesson.get("_source_file", ""),
                }
            )
    return rows


def build_qa_rows(lessons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for lesson in lessons:
        base = {
            "lesson_id": lesson.get("lesson_id", ""),
            "lesson_number": lesson.get("lesson_number", ""),
            "lesson_title": lesson.get("lesson_title", ""),
            "source_file": lesson.get("_source_file", ""),
        }
        qa = lesson.get("source_qa") or {}
        if isinstance(qa, dict):
            rows.append({**base, "item_type": "source_qa", "field": "status", "status": qa.get("status", ""), "value": "", "detail": qa.get("method", "")})
            for category in qa.get("verified_categories") or []:
                rows.append({**base, "item_type": "verified_category", "field": str(category), "status": "verified", "value": "", "detail": ""})
            for correction in qa.get("corrections_applied") or []:
                rows.append({**base, "item_type": "correction_applied", "field": "", "status": "applied", "value": "", "detail": str(correction)})
            for unresolved in qa.get("unresolved_items") or []:
                rows.append({**base, "item_type": "unresolved_item", "field": "", "status": "unresolved", "value": "", "detail": str(unresolved)})
            for key, value in (qa.get("file_checks") or {}).items():
                rows.append({**base, "item_type": "file_check", "field": str(key), "status": "recorded", "value": json_text(value), "detail": ""})
        answer_policy = lesson.get("answer_policy")
        if answer_policy:
            rows.append({**base, "item_type": "answer_policy", "field": "answer_policy", "status": "recorded", "value": "", "detail": lines_text(answer_policy)})
        uncertainties = lesson.get("uncertainties") or []
        if isinstance(uncertainties, dict):
            uncertainties = [{"field": key, "detail": value} for key, value in uncertainties.items()]
        for uncertainty in uncertainties:
            if isinstance(uncertainty, dict):
                rows.append({**base, "item_type": "uncertainty", "field": uncertainty.get("field", ""), "status": uncertainty.get("status", "pending_review"), "value": json_text(uncertainty.get("value")), "detail": uncertainty.get("detail", uncertainty.get("note", ""))})
            else:
                rows.append({**base, "item_type": "uncertainty", "field": "", "status": "pending_review", "value": "", "detail": str(uncertainty)})
    return rows


def build_vocabulary_master(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = str(row.get("chinese_simplified", "")).strip()
        if key:
            grouped[key].append(row)
    result = []
    for hanzi, entries in sorted(grouped.items(), key=lambda item: item[0]):
        result.append(
            {
                "chinese_simplified": hanzi,
                "pinyin_variants": "; ".join(dict.fromkeys(str(x.get("pinyin", "")) for x in entries if x.get("pinyin"))),
                "lesson_record_count": len(entries),
                "lessons": "; ".join(dict.fromkeys(f"第{x['lesson_number']}课 {x['lesson_title']}" for x in entries)),
                "record_ids": "; ".join(str(x.get("record_id", "")) for x in entries),
                "textbook_pages": "; ".join(dict.fromkeys(str(x.get("textbook_page", "")) for x in entries if x.get("textbook_page"))),
                "marked_in_any_lesson": any(x.get("marked") is True for x in entries),
                "part_of_speech": "; ".join(dict.fromkeys(str(x.get("part_of_speech", "")) for x in entries if x.get("part_of_speech"))),
                "meaning_chinese_from_source": "\n".join(dict.fromkeys(str(x.get("meaning_chinese_from_source", "")) for x in entries if x.get("meaning_chinese_from_source"))),
                "review_statuses": "; ".join(dict.fromkeys(str(x.get("review_status", "")) for x in entries if x.get("review_status"))),
                "source_file_count": len(dict.fromkeys(x.get("source_file", "") for x in entries)),
            }
        )
    return result


def build_grammar_master(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = str(row.get("pattern", "")).strip()
        if key:
            grouped[key].append(row)
    result = []
    for pattern, entries in sorted(grouped.items(), key=lambda item: item[0]):
        result.append(
            {
                "pattern": pattern,
                "lesson_record_count": len(entries),
                "lessons": "; ".join(dict.fromkeys(f"第{x['lesson_number']}课 {x['lesson_title']}" for x in entries)),
                "record_ids": "; ".join(str(x.get("record_id", "")) for x in entries),
                "textbook_pages": "; ".join(dict.fromkeys(str(x.get("textbook_page", "")) for x in entries if x.get("textbook_page"))),
                "meanings_raw": "\n".join(dict.fromkeys(str(x.get("meaning_raw", "")) for x in entries if x.get("meaning_raw"))),
                "example_count_total": sum(int(x.get("example_count") or 0) for x in entries),
                "review_statuses": "; ".join(dict.fromkeys(str(x.get("review_status", "")) for x in entries if x.get("review_status"))),
            }
        )
    return result


PROPOSED_FIELDS = [
    {"priority": "P0", "entity": "Vocabulary", "field_name": "part_of_speech", "why_add": "Needed for lesson planning and controlled practice.", "suggested_source": "Textbook or teacher-reviewed dictionary; never infer from OCR alone.", "status": "blank when not in source"},
    {"priority": "P0", "entity": "Vocabulary", "field_name": "meaning_chinese", "why_add": "Provides a concise learner-facing definition.", "suggested_source": "Textbook glossary first; teacher review for missing items.", "status": "partially populated only from source glossary"},
    {"priority": "P0", "entity": "Vocabulary", "field_name": "meaning_vietnamese", "why_add": "Useful for Vinh student support and quick teacher reference.", "suggested_source": "Teacher-reviewed translation after source approval.", "status": "not started"},
    {"priority": "P1", "entity": "Vocabulary", "field_name": "example_sentence_source", "why_add": "Shows the word in its textbook context.", "suggested_source": "Link to a sentence in the printed dialogue/reading, with record_id.", "status": "not yet linked"},
    {"priority": "P1", "entity": "Vocabulary", "field_name": "collocations", "why_add": "Supports natural speaking instead of isolated word memorization.", "suggested_source": "Textbook examples plus teacher-approved additions.", "status": "not started"},
    {"priority": "P1", "entity": "Vocabulary", "field_name": "usage_register", "why_add": "Important for formal, colloquial, idiomatic, respectful, or taboo language.", "suggested_source": "Textbook context and teacher review.", "status": "not started"},
    {"priority": "P1", "entity": "Grammar", "field_name": "usage_function", "why_add": "Connects a pattern to the communicative purpose students must accomplish.", "suggested_source": "Teacher handbook / PBI task design.", "status": "not started"},
    {"priority": "P1", "entity": "Grammar", "field_name": "form_slots", "why_add": "Makes the replaceable parts of a pattern explicit.", "suggested_source": "Source examples and teacher validation.", "status": "not started"},
    {"priority": "P1", "entity": "Grammar", "field_name": "common_errors", "why_add": "Captures likely learner problems for just-in-time repair.", "suggested_source": "Observed student performance, not assumptions.", "status": "not started"},
    {"priority": "P1", "entity": "Grammar", "field_name": "contrast_patterns", "why_add": "Helps distinguish easily confused forms.", "suggested_source": "Teacher-reviewed comparison, e.g. similar connectors or rhetorical questions.", "status": "not started"},
    {"priority": "P1", "entity": "Audio", "field_name": "transcript", "why_add": "Enables listening replay, search, and transcript-based review.", "suggested_source": "Manual audio transcription and teacher verification.", "status": "not started; do not infer from prompts"},
    {"priority": "P1", "entity": "Audio", "field_name": "transcript_status", "why_add": "Separates verified transcript from a draft or unavailable transcript.", "suggested_source": "Manual review log.", "status": "not started"},
    {"priority": "P2", "entity": "Vocabulary/Grammar", "field_name": "student_mastery", "why_add": "Tracks whether a learner can recognize, understand, use, and repair the item.", "suggested_source": "Separate student-performance table; do not put personal data in the source catalog.", "status": "not started"},
    {"priority": "P2", "entity": "Vocabulary/Grammar", "field_name": "review_history", "why_add": "Records teacher corrections and approval dates without changing source text.", "suggested_source": "Versioned review log.", "status": "not started"},
    {"priority": "P2", "entity": "Vocabulary/Grammar", "field_name": "assessment_alignment", "why_add": "Links each item to interpretive, interpersonal, or presentational evidence.", "suggested_source": "Approved teacher manual and rubric.", "status": "not started"},
    {"priority": "P2", "entity": "Vocabulary", "field_name": "audio_asset_ids", "why_add": "Already included where source mapping exists; helps students revisit pronunciation/listening context.", "suggested_source": "Canonical audio map.", "status": "partially populated"},
]


def build_field_guide(sheet_rows: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    descriptions = {
        "record_id": "Stable source record identifier.",
        "lesson_id": "Lesson identifier from the structured source.",
        "lesson_number": "Book lesson number.",
        "lesson_title": "Printed lesson title.",
        "chinese_simplified": "Simplified Chinese headword; source-faithful.",
        "pinyin": "Pinyin as recorded in the source package.",
        "textbook_page": "Single printed textbook page when available.",
        "textbook_page_range": "Printed textbook page range; not PDF page number.",
        "source_pdf_page": "PDF page number when available.",
        "source_pdf_page_range": "PDF page range when available.",
        "section_id": "Canonical section identifier.",
        "section_label": "Printed section label for quick navigation.",
        "review_status": "Row-level source review status.",
        "lesson_review_status": "Lesson-level review status.",
        "translation_status": "Translation status in the canonical source package.",
        "meaning_chinese_from_source": "Definition copied only from source glossary entries.",
        "meaning_english": "Reserved teacher-reviewed enrichment field; blank in this build.",
        "meaning_vietnamese": "Reserved teacher-reviewed enrichment field; blank in this build.",
        "source_file": "Relative path of the canonical structured input.",
        "audio_asset_ids": "Audio identifiers linked by the source or section mapping.",
        "examples_text": "Grammar examples in readable line-separated form.",
        "examples_json": "Grammar examples preserved as source JSON.",
        "prompt_raw": "Printed exercise prompt; no invented answer.",
        "answer_status": "Source answer availability status.",
        "source_qa_status": "Lesson source-QA status.",
    }
    rows = []
    for sheet_name, rows_for_sheet in sheet_rows.items():
        columns = list(rows_for_sheet[0].keys()) if rows_for_sheet else []
        for column in columns:
            rows.append(
                {
                    "sheet_name": sheet_name,
                    "column_name": column,
                    "description": descriptions.get(column, "Source field or reserved enrichment field; see README and proposal."),
                    "data_policy": "Source value preserved; blank means unavailable or not yet teacher-reviewed." if column not in {"meaning_chinese_from_source", "source_file"} else descriptions.get(column, ""),
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    columns = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: value_as_cell(value) for key, value in row.items()})


def style_workbook(path: Path, sheets: dict[str, list[dict[str, Any]]]) -> None:
    workbook = Workbook()
    default = workbook.active
    workbook.remove(default)
    header_fill = PatternFill("solid", fgColor="17324D")
    header_font = Font(color="FFFFFF", bold=True)
    thin_gray = Side(style="thin", color="D9E2F3")
    for sheet_name, rows in sheets.items():
        sheet = workbook.create_sheet(sheet_name[:31])
        columns = list(rows[0].keys()) if rows else []
        if columns:
            sheet.append(columns)
            for row in rows:
                sheet.append([value_as_cell(row.get(column, "")) for column in columns])
            for cell in sheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                cell.border = Border(bottom=thin_gray)
            sheet.freeze_panes = "A2"
            sheet.auto_filter.ref = sheet.dimensions
            sheet.row_dimensions[1].height = 30
            for row in sheet.iter_rows(min_row=2):
                for cell in row:
                    cell.alignment = Alignment(vertical="top", wrap_text=True)
            for index, column in enumerate(columns, start=1):
                max_length = len(str(column))
                for cell in sheet[get_column_letter(index)][1:]:
                    if cell.value is not None:
                        line_lengths = [len(line) for line in str(cell.value).splitlines()]
                        max_line_length = max(line_lengths, default=0)
                        max_length = min(max(max_length, max_line_length), 60)
                sheet.column_dimensions[get_column_letter(index)].width = min(max(max_length + 2, 12), 42)
        sheet.sheet_view.showGridLines = False
    workbook.save(path)


def write_readme(path: Path, sheets: dict[str, list[dict[str, Any]]], source_files: list[str]) -> None:
    counts = {name: len(rows) for name, rows in sheets.items()}
    content = f"""# {BOOK_TITLE} 本學期參考資料集

版本：{DATASET_VERSION}  
建立日期：{TODAY}

## 內容

本資料集以專案目前的八份結構化教材來源為輸入，涵蓋第 1–8 課的詞語、句式、課文／對話、練習、音檔、教材段落、來源審核紀錄與跨課索引。

`xlsx` 是多工作表主檔；CSV 不支援多工作表，所以 `csv/` 內每個檔案對應一個工作表。

## 來源與狀態

輸入檔：

{chr(10).join(f"- `{item}`" for item in source_files)}

資料集保留每筆資料的 `review_status`、課次審核狀態與來源檔案。第 1 課來源 QA 已通過；第 2–8 課仍有來源逐字核對、教師批准或答案／音檔內容待確認項目。資料集不把這些待確認內容改寫成已批准資料。

翻譯、詞性、搭配、常見錯誤與學生掌握度欄位只在來源已有或教師審核後填入；目前沒有自行補寫越南文翻譯、唯一答案或音檔逐字稿。

## 工作表／CSV

{chr(10).join(f"- `{name}`：{len(rows)} 筆" for name, rows in sheets.items())}

`Proposed_Fields` 列出下一階段最值得補充的欄位；`Field_Guide` 說明欄位用途與空白值政策。

## 最小下一步

先完成第 2–8 課來源批准，再依 `Proposed_Fields` 的 P0 順序補上詞性、中文釋義、教師審核的越南文釋義與課本例句連結。之後再建立音檔逐字稿與學生表現資料，不要把學生個資直接放進教材來源表。
"""
    path.write_text(content, encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    lessons = load_lessons()
    glossary_rows = [row for lesson in lessons for row in flatten_glossary(lesson)]
    base_sheets: dict[str, list[dict[str, Any]]] = {
        "Lessons": build_lessons_rows(lessons),
        "Vocabulary": build_vocabulary_rows(lessons, glossary_rows),
        "Grammar": build_grammar_rows(lessons),
        "Texts": build_text_rows(lessons),
        "Exercises": build_exercise_rows(lessons),
        "Audio": build_audio_rows(lessons),
        "Sections": build_section_rows(lessons),
        "Glossary": glossary_rows,
        "Source_QA": build_qa_rows(lessons),
    }
    base_sheets["Vocabulary_Master"] = build_vocabulary_master(base_sheets["Vocabulary"])
    base_sheets["Grammar_Master"] = build_grammar_master(base_sheets["Grammar"])
    base_sheets["Proposed_Fields"] = PROPOSED_FIELDS
    base_sheets["Field_Guide"] = build_field_guide(base_sheets)
    readme_rows = [
        {"item": "dataset_name", "value": f"{BOOK_TITLE} 本學期參考資料集"},
        {"item": "dataset_version", "value": DATASET_VERSION},
        {"item": "created_date", "value": TODAY},
        {"item": "scope", "value": "第1–8課；詞語、句式、課文／對話、練習、音檔、教材段落、來源 QA 與跨課索引"},
        {"item": "primary_format", "value": "XLSX multi-sheet workbook"},
        {"item": "csv_note", "value": "CSV 不支援多工作表；csv/ 內每個 CSV 對應一個 XLSX 工作表"},
        {"item": "source_policy", "value": "只使用 structured-lesson-01..08.json；保留 review/uncertainty 狀態"},
        {"item": "translation_policy", "value": "未自行生成越南文、英文翻譯或唯一答案；待來源批准與教師審核"},
        {"item": "lesson_1_status", "value": str(lessons[0].get("source_qa", {}).get("status", ""))},
        {"item": "lesson_2_to_8_status", "value": "source review materialized/pending review or Adam approval"},
        {"item": "vocabulary_rows", "value": len(base_sheets["Vocabulary"])},
        {"item": "grammar_rows", "value": len(base_sheets["Grammar"])},
        {"item": "proposed_next_step", "value": "完成 P0 欄位：詞性、中文釋義、教師審核越南文、課本例句連結"},
    ]
    sheets: dict[str, list[dict[str, Any]]] = {"README": readme_rows, **base_sheets}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if CSV_DIR.exists():
        for child in CSV_DIR.iterdir():
            if child.is_file():
                child.unlink()
    CSV_DIR.mkdir(parents=True, exist_ok=True)
    for sheet_name, rows in sheets.items():
        write_csv(CSV_DIR / f"{sheet_name.lower()}.csv", rows)
    workbook_path = OUT_DIR / f"博雅汉语听说-中级冲刺篇I-本学期参考资料集-v{DATASET_VERSION}.xlsx"
    style_workbook(workbook_path, sheets)
    readme_path = OUT_DIR / "README.md"
    write_readme(readme_path, sheets, [lesson["_source_file"] for lesson in lessons])

    manifest = {
        "dataset_name": f"{BOOK_TITLE} 本學期參考資料集",
        "dataset_version": DATASET_VERSION,
        "created_date": TODAY,
        "source_files": [lesson["_source_file"] for lesson in lessons],
        "sheet_row_counts": {name: len(rows) for name, rows in sheets.items()},
        "files": {},
    }
    for path in [workbook_path, readme_path, *sorted(CSV_DIR.glob("*.csv"))]:
        manifest["files"][str(path.relative_to(OUT_DIR))] = {
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    zip_path = OUT_DIR / f"博雅汉语听说-中级冲刺篇I-本学期参考资料集-v{DATASET_VERSION}.zip"
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as archive:
        for path in [workbook_path, readme_path, manifest_path, *sorted(CSV_DIR.glob("*.csv"))]:
            archive.write(path, path.relative_to(OUT_DIR))

    # Read-back validation: fail loudly if the workbook or CSV headers are malformed.
    loaded = load_workbook(workbook_path, read_only=True, data_only=False)
    expected_sheets = list(sheets.keys())
    if loaded.sheetnames != expected_sheets:
        raise RuntimeError(f"Workbook sheet mismatch: {loaded.sheetnames} != {expected_sheets}")
    for sheet_name, rows in sheets.items():
        sheet = loaded[sheet_name]
        expected_rows = len(rows) + 1
        if sheet.max_row != expected_rows:
            raise RuntimeError(f"Row count mismatch in {sheet_name}: {sheet.max_row} != {expected_rows}")
        csv_path = CSV_DIR / f"{sheet_name.lower()}.csv"
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            csv_rows = list(csv.reader(handle))
        if len(csv_rows) != expected_rows:
            raise RuntimeError(f"CSV row count mismatch in {sheet_name}: {len(csv_rows)} != {expected_rows}")
    print(json.dumps({"workbook": str(workbook_path), "zip": str(zip_path), "row_counts": manifest["sheet_row_counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
