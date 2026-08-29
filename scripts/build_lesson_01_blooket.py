#!/usr/bin/env python3
"""Build the Lesson 1 vocabulary Blooket draft.

The canonical lesson source supplies the 34 vocabulary terms and their pinyin,
but it does not contain a vocabulary-meaning column. This draft therefore
keeps the meaning items explicitly marked as external dictionary drafts for
teacher review instead of presenting them as textbook answer keys.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import sys
from datetime import date
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
HISTORICAL_LESSON_KEY = "boya-intermediate-i:lesson-01"
active_lesson_key = CONFIG.get("active_context", {}).get("lesson_key")
configured_lesson_root = (PROJECT_ROOT / CONFIG.get("lesson_root", "")).resolve()
expected_lesson_root = (PROJECT_ROOT / "lessons/boya-intermediate-i/lesson-01").resolve()
if active_lesson_key != HISTORICAL_LESSON_KEY or configured_lesson_root != expected_lesson_root:
    raise RuntimeError(
        "build_lesson_01_blooket.py is historical and scoped to "
        f"{HISTORICAL_LESSON_KEY}; active context is {active_lesson_key or 'missing'} "
        f"and lesson_root is {configured_lesson_root}. Use a lesson-key-scoped builder for the current offering."
    )
CANONICAL_SOURCE = PROJECT_ROOT / "textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-01.json"
DEFAULT_OUTPUT = (
    PROJECT_ROOT
    / "lessons/boya-intermediate-i/lesson-01/10-design/support-draft/blooket/lesson-01"
)
CSV_HEADER = [
    "Question #",
    "Question Text",
    "Answer 1",
    "Answer 2",
    "Answer 3 (Optional)",
    "Answer 4 (Optional)",
    "Time Limit (sec) ",
    "Correct Answer(s)",
]
TIME_LIMIT_SECONDS = 20
RANDOM_SEED = 20260825
LESSON_ID = "boya-intermediate-i-lesson-01"
MEANING_SOURCE = {
    "name": "CC-CEDICT",
    "url": "https://github.com/justinarmstrong/chinese-english-dictionary/blob/master/data/cedict_ts.u8",
    "checked_on": "2026-08-25",
    "status": "external_draft_for_review",
    "language": "vi",
    "note": "越南文释义是根据外部英汉词典释义整理的最短课堂用语，不是教材原文答案。",
}

# These are short Chinese paraphrases for the first review draft. They are
# deliberately kept separate from the canonical lesson source so that a
# teacher can approve, edit, or replace them before any authority update.
MEANING_MAP = {
    "起名儿": "đặt tên",
    "警告": "cảnh báo",
    "愣": "ngẩn người",
    "惊讶": "ngạc nhiên",
    "从小": "từ nhỏ",
    "吃苦": "chịu khổ",
    "怨": "trách móc",
    "琢磨": "suy nghĩ kỹ",
    "费尽心机": "vắt óc",
    "莫名其妙": "khó hiểu",
    "困惑不解": "hoang mang",
    "与众不同": "khác biệt",
    "不约而同": "cùng làm, không hẹn",
    "发音": "phát âm",
    "头等大事": "việc quan trọng nhất",
    "别扭": "gượng gạo",
    "糟": "tệ",
    "低调": "kín tiếng",
    "小子": "cậu nhóc",
    "同音": "đồng âm",
    "游戏": "trò chơi",
    "居然": "vậy mà",
    "好奇": "tò mò",
    "不由得": "không khỏi",
    "祖宗": "tổ tiên",
    "偏偏": "lại cứ",
    "操心": "lo lắng",
    "啼笑皆非": "dở khóc dở cười",
    "少见": "hiếm gặp",
    "尊称": "cách gọi kính trọng",
    "称呼": "xưng hô",
    "交往": "giao tiếp",
    "自古": "từ xưa",
    "亲热": "thân mật",
}

FAMILY_CONFIG = {
    "character_to_meaning": {
        "code": "CTM",
        "question": lambda vocab: f"“{vocab['chinese_simplified']}”是什么意思？",
        "target": lambda vocab: MEANING_MAP[vocab["chinese_simplified"]],
        "source_key": "source_meaning",
    },
    "character_to_pinyin": {
        "code": "CTP",
        "question": lambda vocab: f"“{vocab['chinese_simplified']}”的拼音是什么？",
        "target": lambda vocab: vocab["pinyin"],
        "source_key": "source_pinyin",
    },
    "pinyin_to_character": {
        "code": "PTC",
        "question": lambda vocab: f"拼音“{vocab['pinyin']}”对应哪个词语？",
        "target": lambda vocab: vocab["chinese_simplified"],
        "source_key": "source_character",
    },
}
FAMILY_ORDER = tuple(FAMILY_CONFIG)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_vocabularies() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    data = json.loads(CANONICAL_SOURCE.read_text(encoding="utf-8"))
    if data.get("lesson_id") != LESSON_ID:
        raise ValueError("canonical source is not Lesson 1")
    vocabularies = data.get("vocabulary")
    if not isinstance(vocabularies, list) or not vocabularies:
        raise ValueError("canonical source has no vocabulary list")

    required = {"record_id", "section_id", "chinese_simplified", "pinyin"}
    seen_ids: set[str] = set()
    seen_characters: set[str] = set()
    seen_pinyin: set[str] = set()
    for item in vocabularies:
        missing = required - item.keys()
        if missing:
            raise ValueError(f"vocabulary record missing fields: {sorted(missing)}")
        record_id = str(item["record_id"])
        character = str(item["chinese_simplified"])
        pinyin = str(item["pinyin"])
        if record_id in seen_ids or character in seen_characters or pinyin in seen_pinyin:
            raise ValueError(f"duplicate vocabulary value: {record_id}/{character}/{pinyin}")
        seen_ids.add(record_id)
        seen_characters.add(character)
        seen_pinyin.add(pinyin)

    missing_meanings = [
        item["chinese_simplified"]
        for item in vocabularies
        if item["chinese_simplified"] not in MEANING_MAP
    ]
    if missing_meanings:
        raise ValueError(f"meaning map is missing: {missing_meanings}")
    if len(set(MEANING_MAP.values())) != len(MEANING_MAP):
        raise ValueError("meaning map contains duplicate definitions")
    return data, vocabularies


def balanced_slots(count: int, seed: int) -> list[int]:
    base, remainder = divmod(count, 4)
    slots = []
    for position in range(1, 5):
        slots.extend([position] * (base + (1 if position <= remainder else 0)))
    rng = random.Random(seed)
    rng.shuffle(slots)
    return slots


def build_family_items(
    vocabularies: list[dict[str, Any]], family: str, family_index: int
) -> list[dict[str, Any]]:
    config = FAMILY_CONFIG[family]
    slots = balanced_slots(len(vocabularies), RANDOM_SEED + family_index * 1009)
    rng = random.Random(RANDOM_SEED + family_index * 2003)
    targets = [config["target"](vocab) for vocab in vocabularies]
    items: list[dict[str, Any]] = []

    for family_number, (vocab, correct_slot) in enumerate(zip(vocabularies, slots), start=1):
        target = config["target"](vocab)
        distractors = [value for value in targets if value != target]
        options = rng.sample(distractors, 3)
        options.insert(correct_slot - 1, target)
        source_ref = {
            "section_id": vocab["section_id"],
            "source_pdf_page": vocab.get("source_pdf_page"),
            "textbook_printed_page": vocab.get("textbook_printed_page"),
        }
        item = {
            "id": f"B01-{vocab['record_id']}-{config['code']}",
            "lesson_id": LESSON_ID,
            "source_vocab_id": vocab["record_id"],
            "source_ref": source_ref,
            "question_type": family,
            "question_text": config["question"](vocab),
            "answers": options,
            "correct_answer_positions": [correct_slot],
            "time_limit_sec": TIME_LIMIT_SECONDS,
            "source_character": vocab["chinese_simplified"],
            "source_pinyin": vocab["pinyin"],
            "source_review_status": vocab.get("review_status"),
            "status": "draft_for_review",
            "family_question_number": family_number,
        }
        if family == "character_to_meaning":
            item["source_meaning"] = target
            item["meaning_source"] = MEANING_SOURCE
            item["meaning_review_status"] = "external_draft_for_review"
        items.append(item)
    return items


def validate_family_items(
    items: list[dict[str, Any]], vocabularies: list[dict[str, Any]], family: str
) -> dict[str, int]:
    if len(items) != len(vocabularies):
        raise ValueError(f"{family} question count does not match vocabulary count")
    expected_ids = {vocab["record_id"] for vocab in vocabularies}
    actual_ids = {item["source_vocab_id"] for item in items}
    if actual_ids != expected_ids:
        raise ValueError(f"{family} does not cover exactly the vocabulary records")
    positions = [item["correct_answer_positions"][0] for item in items]
    distribution = {str(position): positions.count(position) for position in range(1, 5)}
    for item in items:
        if len(item["answers"]) != 4 or len(set(item["answers"])) != 4:
            raise ValueError(f"answer options are not four unique values: {item['id']}")
        position = item["correct_answer_positions"][0]
        if position not in {1, 2, 3, 4}:
            raise ValueError(f"correct answer position is outside 1–4: {item['id']}")
        target_key = FAMILY_CONFIG[family]["source_key"]
        if item["answers"][position - 1] != item[target_key]:
            raise ValueError(f"correct answer mismatch: {item['id']}")
        if family == "character_to_meaning" and item.get("meaning_review_status") != "external_draft_for_review":
            raise ValueError(f"meaning provenance missing: {item['id']}")
    return distribution


def write_csv(path: Path, items: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(CSV_HEADER)
        for question_number, item in enumerate(items, start=1):
            answers = item["answers"]
            writer.writerow(
                [
                    question_number,
                    item["question_text"],
                    answers[0],
                    answers[1],
                    answers[2],
                    answers[3],
                    item["time_limit_sec"],
                    item["correct_answer_positions"][0],
                ]
            )


def write_outputs(
    source: dict[str, Any],
    items_by_family: dict[str, list[dict[str, Any]]],
    distributions: dict[str, dict[str, int]],
    output: Path,
) -> None:
    output.mkdir(parents=True, exist_ok=True)
    source_hash = sha256(CANONICAL_SOURCE)
    generated_on = date.today().isoformat()
    item_count = len(items_by_family[FAMILY_ORDER[0]])
    all_items = [
        items_by_family[family][index]
        for index in range(item_count)
        for family in FAMILY_ORDER
    ]
    combined_csv = output / "lesson-01_vocab_blooket.csv"
    meaning_map_csv = output / "lesson-01_vocab_meaning_map_draft.csv"
    database_path = output / "lesson-01_vocab_blooket_database.json"
    manifest_path = output / "manifest.json"
    review_path = output / "review.md"

    write_csv(combined_csv, all_items)
    family_files: dict[str, str] = {}
    for family in FAMILY_ORDER:
        filename = f"lesson-01_vocab_{family}_blooket.csv"
        write_csv(output / filename, items_by_family[family])
        family_files[family] = filename

    with meaning_map_csv.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["record_id", "汉字", "拼音", "越南文释义", "释义来源", "状态"])
        for vocab in source["vocabulary"]:
            writer.writerow(
                [
                    vocab["record_id"],
                    vocab["chinese_simplified"],
                    vocab["pinyin"],
                    MEANING_MAP[vocab["chinese_simplified"]],
                    "CC-CEDICT 外部词典整理",
                    "external_draft_for_review",
                ]
            )

    database = {
        "schema_version": "blooket-database-0.2.0",
        "status": "draft_for_review",
        "lesson_id": source["lesson_id"],
        "lesson_title": source["lesson_title"],
        "source": {
            "path": "textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-01.json",
            "sha256": source_hash,
            "source_review_status": source.get("review_status"),
            "answer_policy": source.get("answer_policy"),
        },
        "meaning_source": MEANING_SOURCE,
        "vocabulary_count": len(source["vocabulary"]),
        "question_count": len(all_items),
        "question_families": {family: len(items_by_family[family]) for family in FAMILY_ORDER},
        "items": all_items,
    }
    database_path.write_text(json.dumps(database, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = {
        "artifact": "lesson-01_vocab_blooket",
        "status": "draft_for_review",
        "generated_on": generated_on,
        "generator": "scripts/build_lesson_01_blooket.py",
        "random_seed": RANDOM_SEED,
        "source_path": "textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-01.json",
        "source_sha256": source_hash,
        "vocabulary_count": len(source["vocabulary"]),
        "question_count": len(all_items),
        "question_families": {family: len(items_by_family[family]) for family in FAMILY_ORDER},
        "time_limit_sec": TIME_LIMIT_SECONDS,
        "correct_answer_position_distribution": distributions,
        "csv_headers": CSV_HEADER,
        "meaning_source": MEANING_SOURCE,
        "files": {
            "combined_csv": combined_csv.name,
            "family_csvs": family_files,
            "meaning_map": meaning_map_csv.name,
            "database": database_path.name,
            "review": review_path.name,
        },
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    distribution_lines = "\n".join(
        f"- {family}：A {dist['1']}、B {dist['2']}、C {dist['3']}、D {dist['4']}。"
        for family, dist in distributions.items()
    )
    review_text = f"""# 第一课词语 Blooket 题库 draft

## 范围

- 课次：第一课《中国人的姓名》
- 来源：`textbooks/boya-intermediate-i/source/derived/extractions/structured-lesson-01.json`
- 词语数：{len(source['vocabulary'])}
- 题目数：{len(all_items)}（每种题型 34 题）
- 题型：汉字选意思、汉字选拼音、拼音选汉字
- 合并 CSV：三种题型混合在同一个文件中，按每个词语依次排列。
- 每题时间：{TIME_LIMIT_SECONDS} 秒
- 状态：`draft_for_review`

## 内容政策

汉字和拼音来自第一课 canonical source。该来源没有 34 个词语的词义字段，因此汉字选意思题使用 CC-CEDICT 外部词典整理的最短越南文释义，全部标为 `external_draft_for_review`，不是教材标准答案。旧 VNFT 越南文题库没有作为本课答案来源。

## QA 结果

- CSV 字段：8 个，沿用 Blooket 模板的栏名和顺序。
- 题目覆盖：{len(all_items)} / {len(source['vocabulary'])} 个词语。
- 每种题型覆盖：34 / 34 个词语。
- 每题选项：4 个，且没有重复；正确答案位置经过固定种子随机化。
{distribution_lines}
- 来源 hash：`{source_hash}`

## 待审项目

1. 逐条确认 34 个最短越南文释义是否符合本课教学用法。
2. 确认汉字选意思题的越南文用词是否需要按班级程度调整。
3. 教师批准后，才可把 meaning map 和题库状态从 draft 更新为 approved。
"""
    review_path.write_text(review_text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
    from production_gate import assert_ready  # noqa: PLC0415

    output = args.output_dir.resolve()
    assert_ready("support", output)
    source, vocabularies = load_vocabularies()
    items_by_family: dict[str, list[dict[str, Any]]] = {}
    distributions: dict[str, dict[str, int]] = {}
    for family_index, family in enumerate(FAMILY_ORDER):
        family_items = build_family_items(vocabularies, family, family_index)
        items_by_family[family] = family_items
        distributions[family] = validate_family_items(family_items, vocabularies, family)
    write_outputs(source, items_by_family, distributions, output)
    print(
        json.dumps(
            {
                "status": "written",
                "output_dir": str(output),
                "question_count": sum(len(items) for items in items_by_family.values()),
                "question_families": {family: len(items) for family, items in items_by_family.items()},
                "distributions": distributions,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
