#!/usr/bin/env python3
"""Extend the elementary-I nine-grid pack from the local reference CSVs."""
import argparse
import csv
import hashlib
import json
import os
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
BOOK = "boya-elementary-i"
DATASET = Path("textbooks/boya-elementary-i-ii/source/reference-dataset/csv")
SOURCE_FILES = (
    "lessons.csv",
    "vocabulary_occurrences.csv",
    "grammar_source_patterns.csv",
    "grammar.csv",
    "reference_sentences.csv",
)
REVIEW_STATUS = "review_only_pending_human_source_translation_review"
PDF_EXTRACT = APP / "docs/elementary-i-pdf-example-extract.json"


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def lesson_number(row):
    return int(row["lesson_number"])


def source_pointer(file_name, source_id):
    return f"{file_name}#{source_id}"


def build(source_root):
    source_dir = (source_root / DATASET).resolve(strict=True)
    source_dir.relative_to(source_root)
    inputs = {name: source_dir / name for name in SOURCE_FILES}
    source_hashes = {name: sha256(path) for name, path in inputs.items()}
    pdf_extract = json.loads(PDF_EXTRACT.read_text(encoding="utf-8"))
    pdf_document = pdf_extract.get("source_document", {})
    pdf_examples = pdf_extract.get("examples", [])
    source_hashes[PDF_EXTRACT.relative_to(APP).as_posix()] = sha256(PDF_EXTRACT)
    if (pdf_extract.get("textbook_id") != BOOK or pdf_extract.get("review_status") != REVIEW_STATUS
            or len(pdf_document.get("sha256", "")) != 64 or len(pdf_document.get("visually_checked_pdf_pages", [])) == 0):
        raise ValueError("provided-PDF example extract must identify its source and remain review-only")

    lessons = [row for row in read_csv(inputs["lessons.csv"])
               if row["textbook_id"] == BOOK and 11 <= lesson_number(row) <= 25]
    lessons.sort(key=lesson_number)
    if len(lessons) != 15 or [lesson_number(row) for row in lessons] != list(range(11, 26)):
        raise ValueError("lessons.csv must contain exactly elementary-I lessons 11–25")
    by_key = {row["lesson_key"]: row for row in lessons}
    if len(by_key) != 15:
        raise ValueError("lesson_key values for lessons 11–25 must be unique")

    vocab_rows = [row for row in read_csv(inputs["vocabulary_occurrences.csv"])
                  if row["textbook_id"] == BOOK and 11 <= lesson_number(row) <= 25]
    vocab_rows.sort(key=lambda row: (lesson_number(row), int(row["item_order"])))
    if len(vocab_rows) != 387:
        raise ValueError(f"expected 387 vocabulary occurrences for lessons 11–25, found {len(vocab_rows)}")

    pattern_rows = [row for row in read_csv(inputs["grammar_source_patterns.csv"])
                    if row["textbook_id"] == BOOK and 11 <= lesson_number(row) <= 25
                    and row["source_status"] == "ocr_pattern_extracted_needs_review" and row["pattern"].strip()]
    pattern_sources = [(row, "grammar_source_patterns.csv") for row in pattern_rows]
    audit_rows = [row for row in read_csv(inputs["grammar.csv"])
                  if row["textbook_id"] == BOOK and lesson_number(row) == 24
                  and row["source_status"] == "explicit_section_ocr_needs_manual" and row["pattern"].strip()]
    if len(pattern_rows) != 13 or len(audit_rows) != 8:
        raise ValueError(f"expected 13 direct patterns and 8 lesson-24 explicit candidates; found {len(pattern_rows)} and {len(audit_rows)}")
    pattern_sources.extend((row, "grammar.csv") for row in audit_rows)
    pattern_sources.sort(key=lambda pair: (lesson_number(pair[0]), pair[0]["grammar_id"]))

    patterns = []
    patterns_by_lesson = {key: [] for key in by_key}
    for row, file_name in pattern_sources:
        key = row["lesson_key"]
        if key not in by_key:
            raise ValueError(f"pattern source is outside lessons 11–25: {row['grammar_id']}")
        source_id = row["grammar_id"]
        suffix = source_id.rsplit("-", 1)[-1]
        item = {
            "item_id": f"{key}:pattern-{suffix}",
            "introduced_lesson_id": key,
            "textbook_id": BOOK,
            "lesson_key": key,
            "pattern": row["pattern"].strip(),
            "source_ref": source_pointer(file_name, source_id),
            "source_id": source_id,
            "source_file": file_name,
            "source_section": row.get("source_section", ""),
            "source_printed_page_raw": row.get("source_printed_page", ""),
            "source_pdf_page_raw": row.get("source_pdf_page", ""),
            "source_status": row["source_status"],
            "meaning_vi_status": row.get("meaning_vi_status", "missing_translation"),
            "meaning_vi_draft": row.get("meaning_vi", ""),
            "source_notes": row.get("source_notes", ""),
            "content_review_status": REVIEW_STATUS,
            "source_order": len(patterns_by_lesson[key]) + 1,
            "active": True,
        }
        patterns.append(item)
        patterns_by_lesson[key].append(item["item_id"])

    grammar_rows = [row for row in read_csv(inputs["grammar.csv"])
                    if row["textbook_id"] == BOOK and row["lesson_key"] in by_key]
    grammar_by_lesson = {key: [] for key in by_key}
    for row in grammar_rows:
        grammar_by_lesson[row["lesson_key"]].append(row)
    sentences = []
    sentence_counts = {key: 0 for key in by_key}
    sentence_source_ids = {}
    omitted_templates = {key: [] for key in by_key}
    for lesson in lessons:
        key = lesson["lesson_key"]
        rows = grammar_by_lesson[key]
        example_groups = {row["example_sentence_zh"].strip() for row in rows
                          if row.get("example_sentence_zh", "").strip()}
        if len(example_groups) != 1:
            raise ValueError(f"{key} must have one consistent lesson-keyed example group; found {len(example_groups)}")
        example_group = next(iter(example_groups))
        source_row = next(row for row in rows if row["example_sentence_zh"].strip() == example_group)
        sentence_source_ids[key] = source_row["grammar_id"]
        seen = set()
        for index, original in enumerate(re.split(r"[；;]", example_group), start=1):
            candidate = original.strip()
            if not candidate:
                continue
            if "例如：" in candidate:
                candidate = candidate.split("例如：", 1)[1].strip()
            elif "例如:" in candidate:
                candidate = candidate.split("例如:", 1)[1].strip()
            if any(mark in candidate for mark in ("……", "…", "...")) or candidate.startswith("参考句式"):
                omitted_templates[key].append(original.strip())
                continue
            if not re.search(r"[。！？!?]$", candidate) or candidate in seen:
                continue
            seen.add(candidate)
            source_id = f"{source_row['grammar_id']}/example_sentence_zh[{index}]"
            sentences.append({
                "item_id": f"{key}:sentence-{len(seen):02}",
                "introduced_lesson_id": key,
                "textbook_id": BOOK,
                "lesson_key": key,
                "sentence": candidate,
                "activity": "sentence-make",
                "instruction": "先读出例句，再换上自己的信息说一句。",
                "source_ref": source_pointer("grammar.csv", source_id),
                "source_record_id": source_row["grammar_id"],
                "source_file": "grammar.csv",
                "source_original": original.strip(),
                "source_grammar_status": source_row["source_status"],
                "source_status": "lesson_keyed_ocr_example_sentence_needs_review",
                "content_review_status": REVIEW_STATUS,
                "source_notes": "从按 lesson_key 关联的 grammar.csv example_sentence_zh 字段拆分；仅将含完整句末标点的句子作为游戏提示，句式模板留在来源快照中待核。",
                "source_order": len(seen),
                "active": True,
            })
        sentence_counts[key] = len(seen)
        if sentence_counts[key] == 0:
            raise ValueError(f"{key} has no complete source example sentence after filtering templates")

    pdf_sentence_counts = {key: 0 for key in by_key}
    checked_pages = set(pdf_document["visually_checked_pdf_pages"])
    for sample in pdf_examples:
        key = sample.get("lesson_key", "")
        sentence = sample.get("sentence", "").strip()
        page = sample.get("pdf_page")
        if key not in by_key or not sentence or page not in checked_pages:
            raise ValueError(f"provided-PDF example has missing lesson/source visual check: {sample}")
        if not re.search(r"[。！？!?]$", sentence) or len(re.findall(r"[\u4e00-\u9fff]", sentence)) > 24:
            raise ValueError(f"provided-PDF example must be a complete short sentence: {sentence}")
        existing = {item["sentence"] for item in sentences if item["introduced_lesson_id"] == key}
        if sentence in existing:
            raise ValueError(f"provided-PDF example duplicates an existing lesson example: {key}: {sentence}")
        sentence_counts[key] += 1
        pdf_sentence_counts[key] += 1
        audio_track = sample.get("audio_track", "")
        section = sample.get("source_section", "")
        source_index = sample.get("source_index")
        source_ref = f"{pdf_document['file_name']}#PDF-page-{page}/{audio_track}/{section}/{source_index}"
        sentences.append({
            "item_id": f"{key}:sentence-{sentence_counts[key]:02}",
            "introduced_lesson_id": key,
            "textbook_id": BOOK,
            "lesson_key": key,
            "sentence": sentence,
            "activity": "sentence-make",
            "instruction": "先读出例句，再换上自己的信息说一句。",
            "source_ref": source_ref,
            "source_record_id": f"{pdf_document['file_name']}:PDF-page-{page}",
            "source_file": pdf_document["file_name"],
            "source_document_sha256": pdf_document["sha256"],
            "source_pdf_page": page,
            "source_audio_track": audio_track,
            "source_section": section,
            "source_original": sentence,
            "source_status": "user_provided_pdf_ocr_visually_checked_needs_human_content_review",
            "content_review_status": REVIEW_STATUS,
            "source_notes": "从用户提供的扫描 PDF 按课次和音轨定位；OCR辅助后已与原页逐句视觉核对。原练习指令只作来源定位，不作为用户指令或游戏题目；保留为待教师审核的例句。",
            "source_order": sentence_counts[key],
            "active": True,
        })
    pdf_sentence_expected = [9, 6, 3, 4, 4, 5, 9, 5, 3, 3, 5, 2, 2, 0, 10]
    actual_pdf_counts = [pdf_sentence_counts[f"{BOOK}:lesson-{n:02}" ] for n in range(11, 26)]
    if actual_pdf_counts != pdf_sentence_expected:
        raise ValueError(f"provided-PDF example coverage changed: {actual_pdf_counts}")

    vocabulary = []
    vocab_counts = {key: 0 for key in by_key}
    for row in vocab_rows:
        key = f"{BOOK}:{row['lesson_id']}"
        order = int(row["item_order"])
        if key not in by_key:
            raise ValueError(f"vocabulary row is outside lessons 11–25: {key}")
        item = {
            "item_id": f"{key}:vocab-{order:03}",
            "introduced_lesson_id": key,
            "textbook_id": BOOK,
            "lesson_key": key,
            "word": row["word"],
            "pinyin": row["pinyin"],
            "meaning_vi": row["meaning_vi"],
            "meaning_vi_status": row["meaning_vi_status"],
            "meaning_en_source": row["meaning_en_source"],
            "part_of_speech": row["part_of_speech"],
            "part_of_speech_raw": row["part_of_speech_raw"],
            "word_raw_ocr": row["word_raw_ocr"],
            "pinyin_raw_ocr": row["pinyin_raw_ocr"],
            "repeated_mark": row["repeated_mark"],
            "source_ref": source_pointer("vocabulary_occurrences.csv", f"{key}:item_order={order}"),
            "source_file": "vocabulary_occurrences.csv",
            "source_section": row["source_section"],
            "source_pdf_page_raw": row["source_pdf_page"],
            "source_printed_page_raw": row["source_printed_page"],
            "source_status": row["source_status"],
            "source_notes": row["source_notes"],
            "vocabulary_key": row["vocabulary_key"],
            "content_review_status": REVIEW_STATUS,
            "source_order": order,
            "active": True,
        }
        vocabulary.append(item)
        vocab_counts[key] += 1
    if any(count == 0 for count in vocab_counts.values()):
        raise ValueError("each lesson 11–25 must have source vocabulary")

    new_lessons = []
    snapshot_lessons = []
    for row in lessons:
        key = row["lesson_key"]
        n = lesson_number(row)
        new_lessons.append({
            "lesson_id": key,
            "lesson_key": key,
            "textbook_id": BOOK,
            "lesson_name": f"第{n}课：{row['lesson_title']}",
            "order": n,
            "content_mode": "vocabulary",
            "active": True,
            "content_review_status": REVIEW_STATUS,
            "source_status": row["source_status"],
            "source_printed_start_page": int(row["textbook_printed_start_page"]),
            "source_pdf_start_page": int(row["source_pdf_start_page"]),
        })
        snapshot_lessons.append({
            "lesson_key": key,
            "title": row["lesson_title"],
            "source_status": row["source_status"],
            "source_printed_start_page": row["textbook_printed_start_page"],
            "source_pdf_start_page": row["source_pdf_start_page"],
            "vocabulary_count": vocab_counts[key],
            "pattern_source_ids": [item["source_id"] for item in patterns if item["lesson_key"] == key],
            "grammar_example_sentence_count": sentence_counts[key] - pdf_sentence_counts[key],
            "pdf_example_sentence_count": pdf_sentence_counts[key],
            "sentence_count": sentence_counts[key],
            "sentence_group_source_id": sentence_source_ids[key],
            "omitted_pattern_templates": omitted_templates[key],
        })

    pack_path = APP / "public/content/boya-elementary-i.json"
    base_pack = json.loads(pack_path.read_text(encoding="utf-8"))
    expected_old_ids = {f"{BOOK}:lesson-{n:02}" for n in range(1, 11)}
    old_lessons = [row for row in base_pack["lessons"] if row["lesson_id"] in expected_old_ids]
    if {row["lesson_id"] for row in old_lessons} != expected_old_ids:
        raise ValueError("existing pack must retain lessons 1–10 before importing")

    pack = dict(base_pack)
    pack["content_revision"] = 5
    pack["content_status"] = "mixed_existing_game_input_and_review_only"
    pack["notes"] = (
        "初级起步篇 I 共二十五课：第1–3课练拼音发音，第4–25课练词语与表达。"
        "第11–25课的词语仍待原页核对，越南文释义为翻译草稿；句式仅纳入可追溯的直录或明确章节候选，"
        "附例句参考答案 PDF 的短句已逐页核对并保留页码，仍待人工审核。例句换说提示是游戏任务，不是教材原题。"
    )
    pack["lessons"] = old_lessons + new_lessons
    pack["vocabulary"] = [item for item in base_pack["vocabulary"]
                          if item.get("introduced_lesson_id") in expected_old_ids] + vocabulary
    pack["sentence_patterns"] = [item for item in base_pack.get("sentence_patterns", [])
                                  if item.get("introduced_lesson_id") in expected_old_ids] + patterns
    pack["sentences"] = [item for item in base_pack["sentences"]
                         if item.get("introduced_lesson_id") in expected_old_ids] + sentences
    pack["exercises"] = [item for item in base_pack["exercises"]
                         if item.get("introduced_lesson_id") in expected_old_ids]

    snapshot = {
        "schema_version": 1,
        "textbook_id": BOOK,
        "scope": "lesson-11 through lesson-25",
        "review_status": REVIEW_STATUS,
        "source_dataset": DATASET.as_posix(),
        "source_files_sha256": source_hashes,
        "selection_policy": {
            "vocabulary": "All ordered OCR vocabulary occurrences for lessons 11–25; retain raw text, translation and source statuses.",
            "sentence_patterns": "Direct publisher-reference OCR rows for lessons 11–25, plus lesson-24 explicit-section audit candidates. Do not use sentence-inferred candidates or reference sentences.",
            "translation_display": "Unreviewed pattern translations are retained as meaning_vi_draft and not exposed as approved meaning_vi.",
            "example_sentences": "Deduplicate each lesson-keyed grammar.csv example_sentence_zh group, split at semicolons, strip an explicit example label, and omit incomplete pattern templates; supplement sparse lessons with short sentences manually checked against the user-provided scanned reference PDF. All remain review-only and keep lesson and page references.",
            "provided_pdf_example_extract": {
                "file_name": pdf_document["file_name"],
                "sha256": pdf_document["sha256"],
                "extract_sha256": source_hashes[PDF_EXTRACT.relative_to(APP).as_posix()],
                "visually_checked_pdf_pages": pdf_document["visually_checked_pdf_pages"],
                "sentence_count": len(pdf_examples),
            },
            "game_instruction": "The read-and-rephrase instruction is a generic game task applied to source examples, not a textbook prompt.",
            "reference_sentences_csv": "Not used to assign lessons because it has no lesson_key and its source page mapping conflicts with the lesson-keyed example groups.",
        },
        "lessons": snapshot_lessons,
        "counts": {
            "lessons": len(new_lessons),
            "vocabulary_occurrences": len(vocabulary),
            "direct_pattern_rows": len(pattern_rows),
            "explicit_lesson_24_pattern_candidates": len(audit_rows),
            "sentence_patterns": len(patterns),
            "grammar_example_sentences": len(sentences) - len(pdf_examples),
            "pdf_example_sentences": len(pdf_examples),
            "example_sentences": len(sentences),
        },
    }
    return pack, snapshot


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True,
                        help="Project root containing the elementary reference dataset CSVs")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Write the generated app pack and source snapshot")
    mode.add_argument("--check", action="store_true", help="Verify generated files match the current source CSVs")
    args = parser.parse_args()
    source_root = args.source_root.resolve(strict=True)
    pack, snapshot = build(source_root)
    outputs = {
        APP / "public/content/boya-elementary-i.json": encoded(pack),
        APP / "docs/elementary-i-source-snapshot.json": encoded(snapshot),
    }
    if args.write:
        for path, contents in outputs.items():
            temp_path = path.with_suffix(path.suffix + ".tmp")
            temp_path.write_bytes(contents)
            os.replace(temp_path, path)
        print(f"Wrote {len(pack['lessons'])} elementary-I lessons, {len(pack['vocabulary'])} vocabulary items, {len(pack['sentence_patterns'])} source-backed patterns and {len(pack['sentences'])} review-only example sentences.")
        return 0
    stale = [path.relative_to(APP) for path, contents in outputs.items()
             if not path.is_file() or path.read_bytes() != contents]
    if stale:
        print("Source-derived content is stale: " + ", ".join(map(str, stale)), file=sys.stderr)
        return 1
    print("Elementary-I source check passed: lessons 11–25 match the current reference CSVs.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Import stopped: {exc}", file=sys.stderr)
        raise SystemExit(1)
