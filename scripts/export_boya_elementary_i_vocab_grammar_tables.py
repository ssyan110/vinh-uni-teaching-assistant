import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "textbooks/boya-elementary-i/source/derived/teaching-materials-database.sqlite"
OUT = ROOT / "textbooks/boya-elementary-i/source/derived/tables"

def write_csv(path, headers, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

with sqlite3.connect(DB) as db:
    db.row_factory = sqlite3.Row
    lessons = db.execute("""
        SELECT lesson_key, lesson_number, lesson_title, textbook_printed_start_page,
               source_status
        FROM lesson_index
        WHERE textbook_id = 'boya-elementary-i'
        ORDER BY CAST(lesson_number AS INTEGER)
    """).fetchall()
    vocab = db.execute("""
        SELECT lesson_number, item_order, word, pinyin, part_of_speech,
               meaning_vi, meaning_vi_status, source_printed_page, source_status
        FROM vocabulary_occurrences
        WHERE textbook_id = 'boya-elementary-i'
        ORDER BY CAST(lesson_number AS INTEGER), item_order
    """).fetchall()
    grammar = db.execute("""
        SELECT lesson_number, grammar_id, pattern, function_zh, meaning_vi,
               meaning_vi_status, example_sentence_zh, source_section,
               source_printed_page, source_status, needs_manual
        FROM grammar
        WHERE textbook_id = 'boya-elementary-i'
        ORDER BY CAST(lesson_number AS INTEGER), grammar_id
    """).fetchall()

write_csv(OUT / "lesson-vocabulary.csv", [
    "lesson_key", "lesson_number", "lesson_title", "item_order", "word",
    "pinyin", "part_of_speech", "meaning_vi", "meaning_vi_status",
    "source_printed_page", "source_status"
], [
    {**dict(r), "lesson_key": f"boya-elementary-i:lesson-{int(r['lesson_number']):02d}",
            "lesson_title": next(x["lesson_title"] for x in lessons if int(x["lesson_number"]) == int(r["lesson_number"]))}
    for r in vocab
])

write_csv(OUT / "lesson-grammar.csv", [
    "lesson_key", "lesson_number", "lesson_title", "grammar_id", "pattern",
    "function_zh", "meaning_vi", "meaning_vi_status", "example_sentence_zh",
    "source_section", "source_printed_page", "source_status", "needs_manual"
], [
    {**dict(r), "lesson_key": f"boya-elementary-i:lesson-{int(r['lesson_number']):02d}",
            "lesson_title": next(x["lesson_title"] for x in lessons if int(x["lesson_number"]) == int(r["lesson_number"]))}
    for r in grammar
])

summary = [
    "# 《博雅汉语·初级起步篇 I》词汇与语法课次表",
    "",
    "教材身份：`boya-elementary-i`；范围：第 1–25 课。",
    "",
    "> 状态说明：下表来自项目教学数据库的来源整理层。越南文释义标为 `translated_subagent_draft`，语法记录均需人工复核；不等同于教师批准或正式交付内容。",
    "",
    "详细逐条表：",
    "- [按课词汇 CSV](lesson-vocabulary.csv)",
    "- [按课语法 CSV](lesson-grammar.csv)",
    "",
    "| 课次 | 课文／主题 | 词汇条数 | 语法条数 | 来源状态 |",
    "|---:|---|---:|---:|---|",
]
for lesson in lessons:
    n = int(lesson["lesson_number"])
    v = sum(int(r["lesson_number"]) == n for r in vocab)
    g = sum(int(r["lesson_number"]) == n for r in grammar)
    summary.append(f"| {n} | {lesson['lesson_title']} | {v} | {g} | {lesson['source_status']} |")
(OUT / "README.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
print(f"wrote {len(vocab)} vocabulary rows and {len(grammar)} grammar rows to {OUT}")
