#!/usr/bin/env python3
"""Generate beginner Chinese homework/question bank from lesson database JSON.

Default output:
  output/book-1/lesson-01/homework-question-bank/

This implements the chinese-homework-question-bank skill:
- pinyin + vocabulary + hanzi + grammar + text + integrated output
- beginner Bloom balance
- draft_for_review status for teacher review
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


def load_lesson(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def vocab_items(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = []
    for item in data.get("content_items", []):
        if item.get("record_type") != "vocabulary":
            continue
        if item.get("standalone_vocab_slide") is False and item.get("chinese_simplified") == "你好":
            # Keep 你好 for dialogue/integrated use, not as a standalone vocab drill.
            continue
        items.append(item)
    return sorted(items, key=lambda x: (x.get("teaching_order") is None, x.get("teaching_order") or 999))


def text_items(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [x for x in data.get("content_items", []) if x.get("record_type") == "text"]


def source_range(items: List[Dict[str, Any]], fallback: str = "") -> str:
    pages = [str(x.get("source_page_range") or x.get("source_page") or "") for x in items if x.get("source_page_range") or x.get("source_page")]
    return pages[0] if pages else fallback


def opt(*values: str) -> List[str]:
    return list(values)


def item(qid: str, lesson_id: str, source: str, skill: str, bloom: str, mode: str,
         qtype: str, prompt_vi: str, input_type: str, answer: Any,
         *, prompt_zh: str = "", options: List[str] | None = None,
         points: int = 1, minutes: float = 1.5, actions: int = 1,
         rubric: str = "", tags: List[str] | None = None) -> Dict[str, Any]:
    return {
        "question_id": qid,
        "lesson_id": lesson_id,
        "source_page_range": source,
        "skill_area": skill,
        "bloom_level": bloom,
        "delivery_mode": mode,
        "question_type": qtype,
        "prompt_vi": prompt_vi,
        "prompt_zh": prompt_zh,
        "student_input_type": input_type,
        "options": options or [],
        "answer_key": answer,
        "rubric": rubric,
        "points": points,
        "estimated_minutes": minutes,
        "response_actions": actions,
        "teacher_review_status": "draft_for_review",
        "tags": tags or [],
    }


def build_bank(data: Dict[str, Any]) -> Dict[str, Any]:
    meta = data.get("metadata", {})
    lesson_id = meta.get("lesson_id") or data.get("lesson_list", [{}])[0].get("lesson_id", "lesson-unknown")
    lesson_title = data.get("lesson_list", [{}])[0].get("lesson_title", "")
    vocabs = vocab_items(data)
    texts = text_items(data)
    vocab_source = source_range(vocabs, "1-2")
    text_source = source_range(texts, "1")
    exercise_source = "10-12"
    hanzi_source = "12"

    hanzi = [v["chinese_simplified"] for v in vocabs]
    pinyin_map = {v["chinese_simplified"]: v.get("pinyin", "") for v in vocabs}
    vi_map = {v["chinese_simplified"]: v.get("vietnamese", "") for v in vocabs}

    items: List[Dict[str, Any]] = []

    items.append(item(
        "L01-HW-Q001", lesson_id, exercise_source, "pinyin", "Remember", "Google Forms",
        "tone_choice", "Chọn pinyin đúng cho chữ Hán: 你", "single_choice", "nǐ",
        options=opt("nī", "ní", "nǐ", "nì"), points=1, minutes=1, actions=1,
        tags=["tone", "full_pinyin"]
    ))
    items.append(item(
        "L01-HW-Q002", lesson_id, exercise_source, "pinyin", "Understand", "Google Forms",
        "tone_sandhi_choice", "Khi đọc 你好 tự nhiên, thanh điệu của 你 thường nghe gần với đáp án nào?", "single_choice", "ní hǎo",
        options=opt("nǐ hǎo", "ní hǎo", "nì hǎo", "nī hǎo"), points=1, minutes=1.5, actions=1,
        tags=["tone_sandhi", "full_pinyin"]
    ))
    items.append(item(
        "L01-HW-Q003", lesson_id, exercise_source, "pinyin", "Remember", "Google Forms",
        "initial_final_discrimination", "Chọn cặp có cùng thanh mẫu với bā.", "single_choice", "bù / bái",
        options=opt("dà / bái", "bù / bái", "kǒu / hǎo", "nǚ / mǎ"), points=1, minutes=1, actions=1,
        tags=["initials", "full_pinyin"]
    ))

    items.append(item(
        "L01-HW-Q004", lesson_id, vocab_source, "vocabulary", "Remember", "Google Forms",
        "meaning_match", "Ghép chữ Hán với nghĩa tiếng Việt: 一, 五, 八", "matching", {"一": "một", "五": "năm", "八": "tám"},
        points=3, minutes=2, actions=3, tags=["numbers", "recognition"]
    ))
    items.append(item(
        "L01-HW-Q005", lesson_id, vocab_source, "vocabulary", "Understand", "Google Forms",
        "category_sort", "Xếp các từ vào nhóm đúng: số từ, tính từ, danh từ/lượng từ.", "categorize",
        {"số từ": ["一", "五", "八"], "tính từ": ["好", "大", "白"], "danh từ/lượng từ": ["口", "女", "马"]},
        points=3, minutes=2.5, actions=3, tags=["word_type", "partial_pinyin"]
    ))
    items.append(item(
        "L01-HW-Q006", lesson_id, vocab_source, "vocabulary", "Apply", "Google Forms",
        "sentence_cloze", "Điền chữ Hán phù hợp: ① 很__ = rất tốt. ② __马 = ngựa trắng. ③ __好 = không tốt.", "short_answer", {"①": "好", "②": "白", "③": "不"},
        points=3, minutes=2.5, actions=3, tags=["contextual_use", "partial_pinyin"]
    ))

    items.append(item(
        "L01-HW-Q007", lesson_id, hanzi_source, "hanzi", "Apply", "Printable PDF / Formative",
        "pinyin_meaning_to_hanzi", "Viết chữ Hán từ pinyin và nghĩa: ① yī - một ② bā - tám ③ dà - to/lớn ④ bù - không", "handwriting", {"①": "一", "②": "八", "③": "大", "④": "不"},
        points=4, minutes=3, actions=2,
        rubric="Đúng hình chữ, đúng hướng nét cơ bản, không nhìn mẫu khi viết lần cuối.",
        tags=["hanzi_retrieval", "no_pinyin_after_prompt"]
    ))
    items.append(item(
        "L01-HW-Q008", lesson_id, hanzi_source, "hanzi", "Apply", "Printable PDF / Formative",
        "copy_cover_write_check", "Chép 1 lần, che mẫu, rồi viết lại từ trí nhớ: 口, 白, 女, 马, 你, 好", "handwriting", {"characters": ["口", "白", "女", "马", "你", "好"]},
        points=6, minutes=5, actions=3,
        rubric="Mỗi chữ: chép 1 lần + viết lại 1 lần từ trí nhớ. Giáo viên kiểm tra hình chữ và tỉ lệ nét.",
        tags=["hanzi_retrieval", "copy_cover_write_check"]
    ))

    items.append(item(
        "L01-HW-Q009", lesson_id, vocab_source, "grammar", "Remember", "Google Forms",
        "pattern_choice", "Chọn câu phủ định đúng của 很好.", "single_choice", "不好",
        options=opt("不很好", "不好", "没好", "很不"), points=1, minutes=1, actions=1,
        tags=["bu_negation"]
    ))
    items.append(item(
        "L01-HW-Q010", lesson_id, vocab_source, "grammar", "Apply", "Google Forms / Printable PDF",
        "transformation", "Đổi sang dạng phủ định với 不: ① 好 ② 大 ③ 白", "short_answer", {"①": "不好", "②": "不大", "③": "不白"},
        points=3, minutes=2.5, actions=3, tags=["bu_negation", "controlled_production"]
    ))
    items.append(item(
        "L01-HW-Q011", lesson_id, vocab_source, "grammar", "Analyze", "Google Forms",
        "error_detection", "Câu nào sai hoặc không tự nhiên nhất trong bài này?", "single_choice", "这是谁的国人？",
        options=opt("你好。", "不好。", "一口。", "这是谁的国人？"), points=1, minutes=1.5, actions=1,
        rubric="Học viên chọn câu không thuộc phạm vi mẫu/cấu trúc bài 1 và không phù hợp ngữ cảnh.",
        tags=["error_detection", "beginner_analyze"]
    ))

    items.append(item(
        "L01-HW-Q012", lesson_id, text_source, "text_comprehension", "Understand", "Google Forms",
        "dialogue_true_false", "Đọc hội thoại A: 你好 / B: 你好. Chọn đúng/sai: Hai người đang chào nhau.", "true_false", True,
        points=1, minutes=1, actions=1, tags=["dialogue", "literal_comprehension"]
    ))
    items.append(item(
        "L01-HW-Q013", lesson_id, text_source, "text_comprehension", "Apply", "Formative / Google Forms",
        "dialogue_completion", "Hoàn thành hội thoại: A: 你好。B: ____。", "short_answer", "你好",
        points=1, minutes=1, actions=1, tags=["dialogue", "controlled_output"]
    ))

    items.append(item(
        "L01-HW-Q014", lesson_id, "1-2", "integrated", "Apply", "Formative audio / Printable PDF",
        "short_functional_output", "Viết hoặc ghi âm 2 câu ngắn bằng tiếng Trung: ① chào một người ② nói một vật/việc không tốt hoặc không lớn.", "text_or_audio", ["你好。", "不好。", "不大。"],
        points=4, minutes=4, actions=2,
        rubric="Đủ 2 câu; dùng đúng 你好 và một mẫu phủ định với 不; phát âm rõ nếu nộp audio.",
        tags=["meaningful_output", "no_full_pinyin"]
    ))
    items.append(item(
        "L01-HW-Q015", lesson_id, "1-2, 50-52", "integrated", "Understand", "Formative / Printable PDF",
        "culture_application", "Nhìn cử chỉ số Trung Quốc. Viết chữ Hán cho 3 số giáo viên chọn trong lớp: 1, 5, 8.", "handwriting_or_short_answer", {"1": "一", "5": "五", "8": "八"},
        points=3, minutes=1.5, actions=1,
        rubric="Nhận đúng cử chỉ số và viết đúng chữ Hán tương ứng.",
        tags=["number_gestures", "hanzi_retrieval", "culture"]
    ))

    summary = {
        "lesson_id": lesson_id,
        "lesson_title": lesson_title,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "draft_for_teacher_review",
        "source_database": "database/vp_lesson_01_database.json",
        "design_basis": "reference/chinese_language_exercise_report.md",
        "item_count": len(items),
        "response_action_count": sum(x["response_actions"] for x in items),
        "estimated_total_minutes": round(sum(float(x["estimated_minutes"]) for x in items), 1),
        "skill_distribution": dict(Counter(x["skill_area"] for x in items)),
        "bloom_distribution": dict(Counter(x["bloom_level"] for x in items)),
        "delivery_distribution": dict(Counter(x["delivery_mode"] for x in items)),
        "required_safeguards": {
            "has_hanzi_retrieval": any("hanzi_retrieval" in x.get("tags", []) for x in items),
            "has_short_output": any("meaningful_output" in x.get("tags", []) for x in items),
            "has_dialogue_use": any(x["skill_area"] == "text_comprehension" for x in items),
            "all_draft_for_review": all(x["teacher_review_status"] == "draft_for_review" for x in items),
        },
    }
    return {"metadata": summary, "items": items}


def write_outputs(bank: Dict[str, Any], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "homework_question_bank.json"
    csv_path = out_dir / "homework_question_bank.csv"
    md_path = out_dir / "homework_question_bank_review.md"

    json_path.write_text(json.dumps(bank, ensure_ascii=False, indent=2), encoding="utf-8")

    rows = bank["items"]
    fieldnames = [
        "question_id", "lesson_id", "source_page_range", "skill_area", "bloom_level", "delivery_mode",
        "question_type", "prompt_vi", "prompt_zh", "student_input_type", "options", "answer_key", "rubric",
        "points", "estimated_minutes", "response_actions", "teacher_review_status", "tags"
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: json.dumps(row.get(k, ""), ensure_ascii=False) if isinstance(row.get(k), (list, dict)) else row.get(k, "") for k in fieldnames})

    m = bank["metadata"]
    lines = [
        f"# Homework Question Bank Review · {m['lesson_id']}",
        "",
        f"Lesson: {m['lesson_title']}",
        f"Status: {m['status']}",
        f"Generated at: {m['generated_at']}",
        "",
        "## Summary",
        f"- Items: {m['item_count']}",
        f"- Response actions: {m['response_action_count']}",
        f"- Estimated time: {m['estimated_total_minutes']} minutes",
        f"- Design basis: `{m['design_basis']}`",
        "",
        "## Skill distribution",
    ]
    for k, v in m["skill_distribution"].items():
        lines.append(f"- {k}: {v}")
    lines += ["", "## Bloom distribution"]
    for k, v in m["bloom_distribution"].items():
        lines.append(f"- {k}: {v}")
    lines += ["", "## Safeguard check"]
    for k, v in m["required_safeguards"].items():
        lines.append(f"- {k}: {'PASS' if v else 'FAIL'}")
    lines += [
        "",
        "## Teacher review checklist",
        "- [ ] Source pages are correct.",
        "- [ ] Answers are correct and appropriate for Lesson 01.",
        "- [ ] Question difficulty is suitable for complete beginners.",
        "- [ ] Hanzi handwriting tasks are feasible in the assigned time.",
        "- [ ] Formative/Google Forms delivery mode is acceptable.",
        "- [ ] Mark approved questions before building the final student homework.",
        "",
        "## Item list",
    ]
    for row in rows:
        lines.append(f"- {row['question_id']} · {row['skill_area']} · {row['bloom_level']} · {row['question_type']} · {row['prompt_vi']}")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to lesson database JSON")
    parser.add_argument("--output-dir", required=True, help="Output directory for question bank")
    args = parser.parse_args()

    data = load_lesson(Path(args.input))
    bank = build_bank(data)
    write_outputs(bank, Path(args.output_dir))
    m = bank["metadata"]
    print(json.dumps({
        "output_dir": args.output_dir,
        "item_count": m["item_count"],
        "response_action_count": m["response_action_count"],
        "estimated_total_minutes": m["estimated_total_minutes"],
        "skill_distribution": m["skill_distribution"],
        "bloom_distribution": m["bloom_distribution"],
        "required_safeguards": m["required_safeguards"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
