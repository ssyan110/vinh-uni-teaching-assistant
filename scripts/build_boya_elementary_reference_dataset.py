#!/usr/bin/env python3
"""Build a reference vocabulary/grammar dataset from the two supplied Boya PDFs.

The supplied books are scanned PDFs, so the OCR text in ``.tmp/ocr-elementary-*``
is an intermediate extraction rather than an authority on its own.  This script
keeps both the raw OCR fields and a review status in the derived CSV/XLSX package.
It deliberately does not modify lesson ``20-approved`` material.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "textbooks" / "boya-elementary-i-ii" / "source" / "reference-dataset"
CSV_DIR = OUT_DIR / "csv"
GRAMMAR_AUDIT_PATH = ROOT / ".tmp" / "grammar-audit-draft.json"
TODAY = date.today().isoformat()


BOOKS: list[dict[str, Any]] = [
    {
        "textbook_id": "boya-elementary-i",
        "volume": "初级起步篇 I",
        "title": "博雅汉语听说·初级起步篇 I",
        "pdf": Path("/Users/ssyan110/Desktop/Work/Teaching/博雅漢語教材/博雅汉语听说-初级起步篇I.pdf"),
        "ocr_dir": ROOT / ".tmp" / "ocr-elementary-i",
        "appendix_json_dir": ROOT / ".tmp" / "ocr-appendix-i-json",
        "lesson_starts": [12, 18, 21, 27, 35, 44, 53, 61, 69, 80, 91, 100, 109, 120, 130, 140, 150, 161, 171, 181, 191, 200, 209, 220, 229],
        "printed_starts": [1, 6, 10, 16, 24, 33, 42, 50, 58, 69, 80, 89, 99, 109, 119, 129, 139, 150, 160, 170, 180, 189, 198, 209, 218],
        "lesson_titles": [
            "拼音和日常用语（一）", "拼音和日常用语（二）", "拼音和日常用语（三）", "你叫什么名字", "认识你很高兴",
            "这是什么", "欢迎去我家玩儿", "明天晚上你有时间吗", "我们怎么去", "西瓜怎么卖", "明天天气怎么样",
            "我正在等公共汽车呢", "你打算买什么样子", "祝你生日快乐", "我可以试试吗", "来一斤饺子",
            "喝茶还是喝咖啡", "今天我七点半就起床了", "你又熬夜了", "我想请一天假", "每个人要说多长时间",
            "明天你下了课去哪儿", "假期有什么打算", "学得怎么样", "准备好了吗",
        ],
        "appendix_pages": (238, 248),
        "appendix_printed_start": 227,
        "expressions": {
            1: [("你好", "Nǐ hǎo", "How are you?/How do you do?"), ("谢谢", "Xièxie", "Thanks"), ("不客气", "Bú kèqi", "You're welcome"), ("对不起", "Duìbuqǐ", "Sorry"), ("没关系", "Méi guānxi", "It's OK"), ("再见", "Zàijiàn", "Bye")],
            2: [("早上好", "Zǎoshang hǎo", "Good morning"), ("晚上好", "Wǎnshang hǎo", "Good evening"), ("明天见", "Míngtiān jiàn", "See you tomorrow"), ("请进", "Qǐng jìn", "Come in, please"), ("什么", "Shénme", "What?"), ("多少钱", "Duōshao qián", "How much?")],
            3: [("明白了", "Míngbai le", "I see"), ("我听不懂", "Wǒ tīng bù dǒng", "I don't understand"), ("请再说一遍", "Qǐng zài shuō yí biàn", "Please say it again"), ("太贵了", "Tài guì le", "It's too expensive"), ("便宜一点儿吧", "Piányi yìdiǎnr ba", "A little cheaper"), ("厕所在哪儿", "Cèsuǒ zài nǎr", "Where is the toilet?")],
        },
    },
    {
        "textbook_id": "boya-elementary-ii",
        "volume": "初级起步篇 II",
        "title": "博雅汉语听说·初级起步篇 II",
        "pdf": Path("/Users/ssyan110/Desktop/Work/Teaching/博雅漢語教材/博雅汉语听说-初级起步篇II.pdf"),
        "ocr_dir": ROOT / ".tmp" / "ocr-elementary-ii",
        "appendix_json_dir": ROOT / ".tmp" / "ocr-appendix-ii-json",
        "lesson_starts": [12, 23, 34, 44, 54, 64, 74, 83, 93, 102, 112, 123, 133, 143, 152, 161, 168, 178],
        "printed_starts": [1, 12, 23, 33, 43, 53, 63, 72, 82, 91, 101, 112, 122, 132, 141, 150, 159, 169],
        "lesson_titles": [
            "订一张机票", "您有房子出租，是吗", "我丢了一个钱包", "我在中国生活", "在饭馆儿点菜", "参加学校社团",
            "去动物园", "一场篮球比赛", "糟糕的一天", "你的旅行怎么样", "做一个家常菜", "搬进学校的宿舍",
            "我叫“不紧张”", "实现理想", "我喜欢的咖啡厅", "母校聚会", "我的假期", "去打工",
        ],
        "appendix_pages": (188, 196),
        "appendix_printed_start": 179,
        "expressions": {},
    },
]


POS_VALUES = {
    "名", "动", "形", "代", "量", "助", "连", "介", "副", "数", "叹", "助动",
    "动、名", "动、形", "名、动", "形、动", "动词", "名词", "形容词",
}

PATTERN_PAGE_LESSON: dict[str, dict[int, int]] = {
    "boya-elementary-i": {
        51: 6, 58: 7, 67: 8, 68: 8, 76: 9, 79: 9, 87: 10, 90: 10,
        97: 11, 107: 12, 119: 13, 128: 14, 154: 17, 157: 17, 169: 18, 227: 24,
    },
    "boya-elementary-ii": {
        21: 1, 53: 4, 62: 5, 72: 6, 82: 7, 92: 8, 111: 10, 121: 11,
        131: 12, 141: 13, 150: 14, 160: 15, 166: 16, 176: 17, 187: 18,
    },
}

# Printed page numbers are taken from the page footer in the OCR or inferred
# from adjacent numbered pages.  They are kept separately from the physical
# PDF page because the scanned books contain front matter and occasional scan
# order anomalies.
PATTERN_PAGE_PRINTED: dict[str, dict[int, int]] = {
    "boya-elementary-i": {
        51: 40, 58: 41, 67: 56, 68: 57, 76: 65, 79: 68, 87: 76, 90: 79,
        97: 86, 107: 96, 119: 108, 128: 117, 154: 143, 157: 146, 169: 158, 227: 216,
    },
    "boya-elementary-ii": {
        21: 10, 53: 42, 62: 51, 72: 61, 82: 71, 92: 81, 111: 100, 121: 110,
        131: 120, 141: 130, 150: 139, 160: 149, 166: 157, 176: 167, 187: 178,
    },
}

# Eight I-volume appendix entries are visible in the scan but were dropped or
# misread as punctuation/Latin text by Vision.  Their spelling, tone-marked
# pinyin, and printed lesson page were checked against the rendered appendix
# image; they remain flagged for a teacher's final POS/meaning review.
MANUAL_APPENDIX_ROWS: dict[str, list[dict[str, Any]]] = {
    # These entries are visible in the rendered I-volume appendix but were
    # dropped by Vision or read as punctuation.  Keep them as explicit image
    # corrections rather than silently pretending that OCR found them.
    "boya-elementary-i": [
        {"word": "才", "pinyin": "cái", "appendix_printed_page": 18, "source_pdf_page": 238},
        {"word": "从……到……", "pinyin": "cóng……dào……", "appendix_printed_page": 12, "source_pdf_page": 239},
        {"word": "的", "pinyin": "de", "appendix_printed_page": 5, "source_pdf_page": 239},
        {"word": "带", "pinyin": "dài", "appendix_printed_page": 25, "source_pdf_page": 239},
        {"word": "对……来说", "pinyin": "duì……lái shuō", "appendix_printed_page": 21, "source_pdf_page": 240},
        {"word": "量", "pinyin": "liàng", "appendix_printed_page": 20, "source_pdf_page": 242},
        {"word": "……死了", "pinyin": "……sǐ le", "appendix_printed_page": 22, "source_pdf_page": 244},
    ],
}

# A handful of appendix rows have a perfectly readable headword but a blank or
# visibly mangled page number in OCR.  The page number is a navigation aid; it
# is retained as an image-checked correction and the row remains reviewable.
APPENDIX_PAGE_CORRECTIONS: dict[str, dict[tuple[str, str], int]] = {
    "boya-elementary-i": {
        ("有", "you"): 8,
        ("有的", "youde"): 18,
        ("就", "jiu"): 7,
    },
    "boya-elementary-ii": {
        ("到达", "daoda"): 1,
        ("飞机", "feiji"): 1,
        ("惊喜", "jingxi"): 8,
        ("记得", "jide"): 13,
        ("记住", "jizhu"): 13,
        ("土豆", "tudou"): 11,
        ("图书馆", "tushuguan"): 15,
        ("痛快", "tongkuai"): 17,
        ("主要", "zhuyao"): 5,
        ("周围", "zhouwei"): 2,
        ("加拿大", "jianada"): 4,
    },
}

CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
PINYIN_RE = re.compile(r"[A-Za-zÀ-žĀ-ž]")
NUM_START_RE = re.compile(r"^\s*(\d{1,2})\s*[\.．、]?\s*(.*)$")


def read_page(ocr_dir: Path, page: int) -> list[str]:
    path = ocr_dir / f"page-{page:03d}.txt"
    if not path.exists():
        return []
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def has_cjk(value: str) -> bool:
    return bool(CJK_RE.search(value))


def is_probable_pinyin(value: str) -> bool:
    value = value.strip()
    if not value or has_cjk(value) or not PINYIN_RE.search(value):
        return False
    # OCR sometimes puts an English explanatory line immediately after a term.
    # Pinyin rows are short and contain no sentence punctuation.
    if len(value) > 50 or any(ch in value for ch in "!?;；：:"):
        return False
    return True


def normalize_term(value: str) -> tuple[str, bool]:
    value = value.strip()
    value = re.sub(r"^\s*\d+\s*[\.．、]?\s*", "", value)
    repeated = "*" in value
    value = value.replace("*", "")
    value = value.replace("（ for", "（for")
    value = value.replace("・・・・・", "……")
    value = value.replace("•••••", "……")
    value = value.replace("…•••", "……")
    value = value.replace("…・", "……")
    value = re.sub(r"\s+", " ", value).strip()
    corrections = {
        "北万": "北方", "地万": "地方", "阴大": "阴天", "平苦": "辛苦",
        "扣": "口", "旦": "蛋糕", "东！": "东门", "川": "穿", "厤烦": "麻烦",
        "柞": "找", "矽": "碗", "帯": "带", "東": "束", "江": "让", "千": "干",
        "贏": "赢", "羨慕": "羡慕", "甲指": "中指", "……⋯死了": "……死了",
        "非・・⋯不可": "非……不可", "•分之…": "……分之……",
        "越来越⋯": "越来越……", "越⋯⋯越⋯…": "越……越……",
        "語法": "语法", "專有名詞": "专有名詞",
        "第个课": "第11课", "弔25保": "第25课", "准备好」码": "准备好了吗",
    }
    return corrections.get(value, value), repeated


def normalize_pinyin(value: str) -> str:
    value = value.strip()
    value = value.replace("（", "(").replace("）", ")")
    value = value.replace("…", "……")
    value = re.sub(r"\s+", " ", value)
    return value


def repair_appendix_entry(book_id: str, term: str, pinyin: str) -> tuple[str, str, list[str]]:
    """Repair only high-confidence appendix OCR defects.

    The rendered appendix remains the authority.  These corrections cover
    omitted tone text, a few character confusions, and entries whose pinyin
    makes the intended compound unambiguous (for example ``有 + youde`` →
    ``有的``).  The raw OCR fields are retained by the caller and repaired rows
    remain marked as needing teacher review.
    """
    notes: list[str] = []
    key = clean_pinyin_key(pinyin)

    if term == "别" and key == "biede":
        term = "别的"
        notes.append("由拼音 bie de 将 OCR 单字误配修为“别的”")
    if term == "有" and key == "youde":
        term = "有的"
        notes.append("由拼音 youde 将 OCR 单字误配修为“有的”")

    # A single visibly wrong character in II p185 is ``理`` instead of the
    # glossary entry ``里``.  The earlier OCR pass also applied an incorrect
    # ``戴→待``/``巧→订`` substitution; do not repeat that lossy mapping.
    if book_id == "boya-elementary-ii" and term == "理":
        term = "里"
        notes.append("附录字形 OCR 理→里")

    defaults: dict[str, dict[str, str]] = {
        "boya-elementary-i": {
            "笔": "bǐ", "几": "jǐ", "久": "jiǔ", "多": "duō", "点": "diǎn",
            "贵": "guì", "快……了": "kuài……le", "束": "shù", "……死了": "……sǐ le",
            "有": "yǒu", "有的": "yǒude", "才": "cái", "从……到……": "cóng……dào……",
            "的": "de", "带": "dài", "对……来说": "duì……lái shuō", "就": "jiù", "量": "liàng",
            "国": "guó", "骑": "qí", "里（边）": "lǐ (bian)", "打（电话）": "dǎ (diànhuà)",
            "没（有）": "méi(yǒu)", "毛（角）": "máo (jiǎo)", "常（常）": "cháng (cháng)", "语法": "yǔfǎ",
        },
        "boya-elementary-ii": {
            "比": "bǐ", "醋": "cù", "挤": "jǐ", "离": "lí", "斤": "jīn", "里": "lǐ",
            "皮": "pí", "提": "tí", "非……不可": "fēi……bùkě", "……分之……": "……fēnzhī……",
            "越来越……": "yuèláiyuè……", "越……越……": "yuè……yuè……", "中指": "zhōngzhǐ",
            "巧": "qiǎo", "戴": "dài", "到达": "dàodá", "惊喜": "jīngxǐ", "记得": "jìde",
            "记住": "jìzhù", "土豆": "tǔdòu", "图书馆": "túshūguǎn", "痛快": "tòngkuài",
            "主要": "zhǔyào", "周围": "zhōuwéi", "加拿大": "Jiānádà", "着": "zháo",
            "锅": "guō",
        },
    }
    desired = defaults.get(book_id, {}).get(term)
    # ``着`` occurs twice in II with different readings; retain the two
    # publisher readings rather than collapsing them to one default.
    if book_id == "boya-elementary-ii" and term == "着":
        desired = "zhe" if key in {"zhe", "zhe5"} or pinyin.strip() == "Zhe" else "zháo"
    if desired and desired != pinyin:
        notes.append(f"拼音 OCR 修为 {desired}" if pinyin else f"补回附录缺失拼音 {desired}")
        pinyin = desired

    # Normalize a few recurring OCR ellipsis and tone-letter variants even
    # where the headword itself was read correctly.
    pinyin_repairs = {
        "非……不可": "fēi……bùkě",
        "……分之……": "……fēnzhī……",
        "越来越……": "yuèláiyuè……",
        "越……越……": "yuè……yuè……",
        "……死了": "……sǐ le",
    }
    if term in pinyin_repairs and pinyin != pinyin_repairs[term]:
        pinyin = pinyin_repairs[term]
        notes.append("省略号／拼音 OCR 修正")
    return term, pinyin, notes


def normalize_pattern(value: str) -> str:
    """Make common Vision substitutions readable without inventing content."""
    value = value.strip()
    value = value.replace("⋯", "…")
    value = re.sub(r"[·•・]+", "……", value)
    value = re.sub(r"…+", "……", value)
    value = re.sub(r"\s+", " ", value).strip()
    replacements = {
        "如果……话": "如果……的话",
        "……最后……": "……最后……",
        "好不容易（オ）": "好不容易（才）",
        "好不容易(オ)": "好不容易（才）",
        "又……又……": "又……又……",
        "一边……一边……": "一边……一边……",
        "越……越……": "越……越……",
        "不但……而且……": "不但……而且……",
        "如果……就": "如果……就……",
        "只要……就……": "只要……就……",
        "A没有B那么……": "A没有B那么……",
        "A比B +adj.": "A比B+adj.",
        "……就可以了": "……就可以了",
        "（往）……拐": "（往）……拐",
    }
    return replacements.get(value, value)


def locate_lesson_section(book: dict[str, Any], lesson_number: int) -> list[tuple[int, str]]:
    starts = book["lesson_starts"]
    start = starts[lesson_number - 1]
    end = starts[lesson_number] - 1 if lesson_number < len(starts) else start + 12
    lines: list[tuple[int, str]] = []
    started = False
    for page in range(start, end + 1):
        for line in read_page(book["ocr_dir"], page):
            if not started:
                if line == "词语":
                    started = True
                continue
            if line.startswith("听说词语") or line == "听说词语":
                return lines
            lines.append((page, line))
    return lines


def extract_vocab_rows(
    book: dict[str, Any],
    known_pinyin_keys: set[str] | None = None,
    known_words: set[str] | None = None,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for lesson_number in range(1, len(book["lesson_starts"]) + 1):
        section = locate_lesson_section(book, lesson_number)
        if not section:
            continue
        # Pair a CJK line with the following pinyin line. This captures entries
        # even when Vision OCR drops the printed item number.
        candidates: list[dict[str, Any]] = []
        for idx, (page, line) in enumerate(section):
            if not has_cjk(line):
                continue
            # Part-of-speech labels are CJK glyphs followed by English glosses
            # (e.g. ``名`` → ``name``), which otherwise look like a term/pinyin
            # pair to the lightweight OCR parser.
            if line in POS_VALUES or re.fullmatch(r"[名动形代量助连介副数叹]{1,3}", line):
                continue
            term, repeated = normalize_term(line)
            if not term or term in {"词语", "专有名词"}:
                continue
            if idx + 1 >= len(section) or not is_probable_pinyin(section[idx + 1][1]):
                continue
            pinyin = normalize_pinyin(section[idx + 1][1])
            if known_pinyin_keys and clean_pinyin_key(pinyin) not in known_pinyin_keys and term not in (known_words or set()):
                # A common OCR false positive is an example sentence followed
                # by an English gloss (``she is ...`` / ``used ...``). A real
                # glossary entry's pinyin almost always matches one of the
                # consolidated appendix keys, even when tone marks are lost.
                continue
            subsection = "proper_noun" if any(text == "专有名词" for _, text in section[max(0, idx - 4):idx + 1]) else "lesson_vocab"
            candidates.append({"idx": idx, "page": page, "raw_term": line, "term": term, "repeated": repeated, "pinyin": pinyin, "subsection": subsection})

        for cidx, candidate in enumerate(candidates):
            start_idx = candidate["idx"] + 2
            stop_idx = candidates[cidx + 1]["idx"] if cidx + 1 < len(candidates) else len(section)
            block = [text for _, text in section[start_idx:stop_idx]]
            pos = ""
            pos_idx = None
            for bi, text in enumerate(block):
                if text in POS_VALUES or re.fullmatch(r"[名动形代量助连介副数叹]{1,3}", text):
                    pos, pos_idx = text, bi
                    break
            english_start = (pos_idx + 1) if pos_idx is not None else 0
            english_lines = [text for text in block[english_start:] if not has_cjk(text) and PINYIN_RE.search(text)]
            definition = " ".join(english_lines[:4]).strip()
            rows.append({
                "textbook_id": book["textbook_id"],
                "volume": book["volume"],
                "lesson_id": f"lesson-{lesson_number:02d}",
                "lesson_number": lesson_number,
                "lesson_title": book["lesson_titles"][lesson_number - 1],
                "item_order": cidx + 1,
                "word_raw_ocr": candidate["raw_term"],
                "word": candidate["term"],
                "pinyin_raw_ocr": candidate["pinyin"],
                "pinyin": candidate["pinyin"],
                "part_of_speech_raw": pos,
                "part_of_speech": pos,
                "meaning_en_source": definition,
                "meaning_vi": "",
                "meaning_vi_status": "missing_translation",
                "repeated_mark": "*" if candidate["repeated"] else "",
                "source_section": candidate["subsection"],
                "source_pdf_page": candidate["page"],
                "source_printed_page": book["printed_starts"][lesson_number - 1],
                "source_status": "ocr_pair_extracted_needs_review",
                "source_notes": "词语页 OCR 配对；需用词语总表与原页人工核对。",
            })
    return rows


def extract_appendix_rows(book: dict[str, Any]) -> list[dict[str, Any]]:
    start, end = book["appendix_pages"]
    rows: list[dict[str, Any]] = []
    for page in range(start, end + 1):
        json_path = book.get("appendix_json_dir", Path("")) / f"page-{page:03d}.json"
        if json_path.exists():
            try:
                observations = json.loads(json_path.read_text(encoding="utf-8")).get("observations", [])
            except (OSError, json.JSONDecodeError):
                observations = []
            # The printed glossary has two fixed columns and one page (II p185)
            # is physically rotated 180 degrees. Rather than trust Vision's
            # reading order, match each Han-character headword to the nearest
            # baseline-aligned pinyin and page number. This also preserves rows
            # where OCR drops one of those two auxiliary fields for later review.
            usable = [obs for obs in observations if str(obs.get("text", "")).strip()]
            cjk_obs = [
                obs for obs in usable
                if has_cjk(str(obs.get("text", "")))
                and str(obs.get("text", "")).strip() not in {"词语总表", "专有名词"}
                and not str(obs.get("text", "")).startswith("博雅汉语听说")
            ]
            for term_obs in cjk_obs:
                raw = str(term_obs.get("text", "")).strip()
                term, repeated = normalize_term(raw)
                if not term or term in {"词语总表", "专有名词"}:
                    continue
                term_y = float(term_obs.get("y", 0))
                term_x = float(term_obs.get("x", 0))
                side_low, side_high = (0.02, 0.50) if term_x < 0.50 else (0.50, 0.98)
                pinyin_candidates = [
                    obs for obs in usable
                    if is_probable_pinyin(str(obs.get("text", "")))
                    and abs(float(obs.get("y", 0)) - term_y) <= 0.010
                    and side_low <= float(obs.get("x", 0)) < side_high
                ]
                pinyin_candidates.sort(key=lambda obs: abs(float(obs.get("y", 0)) - term_y))
                page_candidates = [
                    obs for obs in usable
                    if re.fullmatch(r"\d{1,3}", str(obs.get("text", "")).strip())
                    and abs(float(obs.get("y", 0)) - term_y) <= 0.012
                    and side_low <= float(obs.get("x", 0)) < side_high
                ]
                page_candidates.sort(key=lambda obs: abs(float(obs.get("y", 0)) - term_y))
                pinyin = normalize_pinyin(str(pinyin_candidates[0].get("text", ""))) if pinyin_candidates else ""
                raw_pinyin = pinyin
                term, pinyin, repair_notes = repair_appendix_entry(book["textbook_id"], term, pinyin)
                appendix_page = int(str(page_candidates[0].get("text", ""))) if page_candidates else ""
                if not appendix_page:
                    appendix_page = APPENDIX_PAGE_CORRECTIONS.get(book["textbook_id"], {}).get(
                        (term, clean_pinyin_key(pinyin)), ""
                    )
                if not pinyin and not appendix_page:
                    continue
                status = "ocr_appendix_spatial_pair_extracted_needs_review"
                source_notes = ""
                if repair_notes:
                    status = "ocr_appendix_spatial_pair_repaired_needs_review"
                    source_notes = "；".join(repair_notes)
                rows.append({
                    "textbook_id": book["textbook_id"], "volume": book["volume"],
                    "word_raw_ocr": raw, "word": term,
                    "pinyin_raw_ocr": raw_pinyin, "pinyin": pinyin,
                    "appendix_printed_page": appendix_page, "source_pdf_page": page,
                    "repeated_mark": "*" if repeated else "",
                    "source_status": status, "source_notes": source_notes,
                })
            if observations:
                continue
        lines = read_page(book["ocr_dir"], page)
        for idx in range(len(lines) - 2):
            line = lines[idx]
            if not has_cjk(line) or line in {"词语总表", "专有名词"}:
                continue
            term, repeated = normalize_term(line)
            if not term or term in {"词语总表", "专有名词"}:
                continue
            pinyin_line = lines[idx + 1]
            page_line = lines[idx + 2]
            if not is_probable_pinyin(pinyin_line) or not re.fullmatch(r"\d{1,3}", page_line):
                continue
            pinyin = normalize_pinyin(pinyin_line)
            raw_pinyin = pinyin
            term, pinyin, repair_notes = repair_appendix_entry(book["textbook_id"], term, pinyin)
            status = "ocr_appendix_pair_extracted_needs_review"
            source_notes = ""
            if repair_notes:
                status = "ocr_appendix_pair_repaired_needs_review"
                source_notes = "；".join(repair_notes)
            rows.append({
                "textbook_id": book["textbook_id"],
                "volume": book["volume"],
                "word_raw_ocr": line,
                "word": term,
                "pinyin_raw_ocr": raw_pinyin,
                "pinyin": pinyin,
                "appendix_printed_page": int(page_line) or APPENDIX_PAGE_CORRECTIONS.get(book["textbook_id"], {}).get((term, clean_pinyin_key(pinyin)), ""),
                "source_pdf_page": page,
                "repeated_mark": "*" if repeated else "",
                "source_status": status, "source_notes": source_notes,
            })
    for item in MANUAL_APPENDIX_ROWS.get(book["textbook_id"], []):
        rows.append({
            "textbook_id": book["textbook_id"], "volume": book["volume"],
            "word_raw_ocr": item["word"], "word": item["word"],
            "pinyin_raw_ocr": item["pinyin"], "pinyin": item["pinyin"],
            "appendix_printed_page": item["appendix_printed_page"],
            "source_pdf_page": item["source_pdf_page"], "repeated_mark": "",
            "source_status": "manual_image_verified_appendix_needs_pos_translation_review",
            "source_notes": "Vision OCR 漏识；由附录扫描影像回填并核对。",
        })
    return rows


def extract_reference_sentences(book: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract numbered 重点句子/常用句子 lines for grammar examples."""
    rows: list[dict[str, Any]] = []
    ocr_dir = book["ocr_dir"]
    for page_path in sorted(ocr_dir.glob("page-*.txt")):
        page = int(page_path.stem.split("-")[-1])
        lines = read_page(ocr_dir, page)
        section = ""
        for idx, line in enumerate(lines):
            if line in {"重点句子", "常用句子"}:
                section = line
                continue
            if section and (
                line.startswith("参考")
                or re.fullmatch(r"重点[句向][子于]", line)
                or re.fullmatch(r"常用[句向][子于]", line)
                or line in {"听说词语", "交际练习", "听说一段话", "词语总表"}
            ):
                section = ""
                continue
            if not section:
                continue
            m = re.match(r"^(\d{1,2})[\.、．]\s*(.+)$", line)
            if not m:
                continue
            sentence = m.group(2).strip()
            # Most source lines contain a Chinese sentence and an OCR'd pinyin
            # continuation. Keep the Chinese sentence as the stable example.
            if has_cjk(sentence):
                latin_start = re.search(r"[A-Za-zÀ-ž]", sentence)
                sentence_zh = sentence[:latin_start.start()].strip() if latin_start else sentence
            else:
                sentence_zh = sentence
            rows.append({
                "textbook_id": book["textbook_id"],
                "volume": book["volume"],
                "source_pdf_page": page,
                "source_section": section,
                "item_order": int(m.group(1)),
                "example_sentence_ocr": sentence,
                "example_sentence_zh": sentence_zh,
                "source_status": "ocr_sentence_extracted_needs_review",
            })
    return rows


def extract_reference_patterns(book: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    ocr_dir = book["ocr_dir"]
    for page_path in sorted(ocr_dir.glob("page-*.txt")):
        page = int(page_path.stem.split("-")[-1])
        lines = read_page(ocr_dir, page)
        active = False
        for line in lines:
            if line in {"参考句式", "参考句型", "参考向式", "参考式"}:
                active = True
                continue
            if not active:
                continue
            if (
                line.startswith(("根据", "注意", "参考词语", "提示问题", "交际练习", "课堂活动", "常用句子", "重点句子", "重点向子", "重点句于", "常用句于", "听说一段话", "小调查", "小演讲", "听说句子"))
                or re.fullmatch(r"\d*[\.、．]?参考词语", line)
                or line in {"四", "五", "六", "七"}
            ):
                active = False
                continue
            if len(line) > 34 and not re.search(r"[+……⋯]", line):
                active = False
                continue
            # Keep only short student-facing pattern rows. Long instructions,
            # numbered prompts and English explanations are not grammar entries.
            if re.match(r"^\d+[\.、．]", line) or line.startswith(("例", "A：", "B：", "According", "Work ")):
                continue
            if has_cjk(line) or re.search(r"[+……⋯]", line):
                pattern = line.strip("·•：: ")
                pattern = re.sub(r"^[AB]：\s*", "", pattern)
                pattern = normalize_pattern(pattern)
                # Parenthesized alternatives below a pattern are examples,
                # not separate grammar records.
                if re.fullmatch(r"[（(][^）)]{1,12}[／/][^）)]{1,12}[）)]", pattern):
                    continue
                if pattern.startswith(("，", "。", "；", ",", ".", ";")):
                    continue
                if not re.search(r"[\u4e00-\u9fffA-Za-zVv+……⋯]", pattern) or pattern in {"四", "五", "六", "七", "…", "……", "•••"}:
                    continue
                if pattern and len(pattern) <= 34 and pattern not in {"四", "五", "六", "七"}:
                    lesson_number = PATTERN_PAGE_LESSON.get(book["textbook_id"], {}).get(page)
                    if lesson_number is None:
                        continue
                    rows.append({
                        "textbook_id": book["textbook_id"],
                        "volume": book["volume"],
                        "source_pdf_page": page,
                        "lesson_number": lesson_number,
                        "pattern_raw_ocr": line,
                        "pattern": pattern,
                        "source_printed_page": PATTERN_PAGE_PRINTED.get(book["textbook_id"], {}).get(page, ""),
                        "source_status": "ocr_pattern_extracted_needs_review",
                    })
            else:
                # English explanation or next paragraph; keep scanning only for
                # short pattern rows.
                if len(line) > 60:
                    active = False
    return rows


def read_old_baseline() -> list[dict[str, str]]:
    path = ROOT / "classroom-tools" / "speaking-challenge" / "reference" / "prior-boya-i-ii-language-baseline.csv"
    if not path.exists():
        return []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def clean_pinyin_key(value: str) -> str:
    value = unicodedata.normalize("NFD", value.lower())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[1-5]", "", value)
    value = re.sub(r"[^a-züv]+", "", value.replace("u:", "v"))
    return value


def infer_lesson_from_printed_page(book: dict[str, Any], printed_page: int) -> int | None:
    starts = book["printed_starts"]
    lesson = None
    for idx, start in enumerate(starts, 1):
        if start <= printed_page:
            lesson = idx
    return lesson


def merge_and_normalize_vocab(book: dict[str, Any], occurrences: list[dict[str, Any]], appendix: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    # Prefer the appendix spelling/pinyin when it can be matched; it is the
    # publisher's consolidated vocabulary index.  The key is word + pinyin,
    # not word alone, so polyphonic entries such as 得 (de/dei) and 着
    # (zháo/zhe) remain usable for lesson preparation.
    by_exact: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    by_word: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_pinyin: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in appendix:
        key = (row["word"], clean_pinyin_key(row.get("pinyin", "")))
        by_exact[key].append(row)
        by_word[row["word"]].append(row)
        by_pinyin[clean_pinyin_key(row.get("pinyin", ""))].append(row)

    def choose_match(row: dict[str, Any]) -> dict[str, Any] | None:
        normalized_term, normalized_pinyin, repair_notes = repair_appendix_entry(
            book["textbook_id"], row["word"], normalize_pinyin(row.get("pinyin", ""))
        )
        row["word"] = normalized_term
        row["pinyin"] = normalized_pinyin
        if repair_notes:
            row["source_notes"] = "；".join(repair_notes)
        exact = by_exact.get((normalized_term, clean_pinyin_key(normalized_pinyin)), [])
        candidates = exact or by_word.get(normalized_term, []) or by_pinyin.get(clean_pinyin_key(normalized_pinyin), [])
        if not candidates:
            return None
        # Prefer the appendix occurrence belonging to this lesson when a
        # headword has several senses/pages.
        lesson_number = int(row.get("lesson_number") or 0)
        lesson_candidates = [
            candidate for candidate in candidates
            if str(candidate.get("appendix_printed_page", "")).isdigit()
            and infer_lesson_from_printed_page(book, int(candidate["appendix_printed_page"])) == lesson_number
        ]
        return (lesson_candidates or candidates)[0]

    for row in occurrences:
        best = choose_match(row)
        if best:
            row["word"] = best["word"]
            row["pinyin"] = best["pinyin"]
            row["vocabulary_key"] = f"{book['textbook_id']}:{row['word']}:{clean_pinyin_key(row.get('pinyin', '')) or 'no-pinyin'}"
            row["source_printed_page"] = best.get("appendix_printed_page", "")
            row["source_status"] = "appendix_matched_ocr_occurrence_needs_translation_review"
        else:
            row["vocabulary_key"] = f"{book['textbook_id']}:{row['word']}:{clean_pinyin_key(row.get('pinyin', '')) or 'no-pinyin'}"
            row["source_status"] = "not_matched_to_appendix_needs_manual_review"

    def append_unique(value: str, addition: Any) -> str:
        parts = [part for part in str(value or "").split(";") if part]
        text = str(addition or "")
        if text and text not in parts:
            parts.append(text)
        return ";".join(parts)

    def sort_pages(value: str) -> str:
        parts = [part for part in str(value or "").split(";") if part]
        return ";".join(sorted(set(parts), key=lambda x: int(x) if x.isdigit() else 9999))

    master_by_key: dict[tuple[str, str], dict[str, Any]] = {}
    for row in appendix:
        word = row["word"]
        pinyin = row.get("pinyin", "")
        key = (word, clean_pinyin_key(pinyin))
        appendix_printed_page = row.get("appendix_printed_page")
        appendix_lesson = infer_lesson_from_printed_page(book, int(appendix_printed_page)) if str(appendix_printed_page).isdigit() else None
        if key in master_by_key:
            existing = master_by_key[key]
            existing["source_printed_pages"] = sort_pages(append_unique(existing["source_printed_pages"], appendix_printed_page))
            existing["source_appendix_pdf_pages"] = append_unique(existing["source_appendix_pdf_pages"], row.get("source_pdf_page", ""))
            if row.get("repeated_mark"):
                existing["repeated_mark"] = "*"
            if row.get("source_status", "").endswith("repaired_needs_review"):
                existing["source_status"] = "appendix_canonical_repaired_needs_pos_translation_review"
            if row.get("source_notes"):
                existing["source_notes"] = append_unique(existing["source_notes"], row["source_notes"])
            continue
        master_by_key[key] = {
            "vocabulary_key": f"{book['textbook_id']}:{word}:{clean_pinyin_key(pinyin) or 'no-pinyin'}",
            "textbook_id": book["textbook_id"],
            "volume": book["volume"],
            "word": word,
            "pinyin": pinyin,
            "part_of_speech": "",
            "meaning_en_source": "",
            "meaning_vi": "",
            "meaning_vi_status": "missing_translation",
            "repeated_mark": row.get("repeated_mark", ""),
            "lesson_numbers": str(appendix_lesson or ""),
            "lesson_titles": book["lesson_titles"][appendix_lesson - 1] if appendix_lesson else "",
            "source_printed_pages": str(appendix_printed_page or ""),
            "source_appendix_pdf_pages": str(row.get("source_pdf_page", "") or ""),
            "source_section": "词语总表",
            "source_status": "appendix_canonical_repaired_needs_pos_translation_review" if row.get("source_status", "").endswith("repaired_needs_review") else "appendix_canonical_needs_pos_translation_review",
            "source_notes": "词语总表提供词语、拼音和教材印刷页码；词类与越南文释义待从对应词语页核对。" + ("；" + row["source_notes"] if row.get("source_notes") else ""),
        }

    for occurrence in occurrences:
        key = (occurrence["word"], clean_pinyin_key(occurrence.get("pinyin", "")))
        master = master_by_key.get(key)
        if master is None:
            lesson = infer_lesson_from_printed_page(book, int(occurrence["source_printed_page"])) if str(occurrence.get("source_printed_page", "")).isdigit() else None
            master = {
                "vocabulary_key": f"{book['textbook_id']}:{occurrence['word']}:{clean_pinyin_key(occurrence.get('pinyin', '')) or 'no-pinyin'}",
                "textbook_id": book["textbook_id"], "volume": book["volume"], "word": occurrence["word"],
                "pinyin": occurrence["pinyin"], "part_of_speech": occurrence["part_of_speech"],
                "meaning_en_source": occurrence["meaning_en_source"], "meaning_vi": "",
                "meaning_vi_status": "missing_translation", "repeated_mark": "",
                "lesson_numbers": str(lesson or ""),
                "lesson_titles": book["lesson_titles"][lesson - 1] if lesson else "",
                "source_printed_pages": str(occurrence.get("source_printed_page", "") or ""), "source_appendix_pdf_pages": "",
                "source_section": "词语页 OCR", "source_status": "occurrence_only_needs_manual_review",
                "source_notes": "未在词语总表 OCR 配对中找到，保留作人工复核。",
            }
            master_by_key[key] = master
        if occurrence.get("part_of_speech") and not master["part_of_speech"]:
            master["part_of_speech"] = occurrence["part_of_speech"]
        if occurrence.get("meaning_en_source") and not master["meaning_en_source"]:
            master["meaning_en_source"] = occurrence["meaning_en_source"]
        master["source_printed_pages"] = sort_pages(append_unique(master["source_printed_pages"], occurrence.get("source_printed_page", "")))
        master["lesson_numbers"] = append_unique(master["lesson_numbers"], occurrence.get("lesson_number", ""))
        master["lesson_titles"] = append_unique(master["lesson_titles"], occurrence.get("lesson_title", ""))

    return list(master_by_key.values()), occurrences


def build_grammar_rows(book: dict[str, Any], patterns: list[dict[str, Any]], sentences: list[dict[str, Any]], old_baseline: list[dict[str, str]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    # Keep the old per-lesson index only as a reviewable candidate layer; the
    # current PDF-derived sentence/pattern rows are the actual source layer.
    legacy = [r for r in old_baseline if r.get("册次", "").strip() == book["volume"]]
    sentence_by_page: dict[int, list[str]] = defaultdict(list)
    for s in sentences:
        sentence_by_page[int(s["source_pdf_page"])].append(s["example_sentence_zh"])
    seen: set[tuple[int, str]] = set()
    for item in patterns:
        page = int(item["source_pdf_page"])
        lesson_number = int(item.get("lesson_number") or PATTERN_PAGE_LESSON.get(book["textbook_id"], {}).get(page, 0))
        if not lesson_number:
            continue
        pattern = item.get("pattern") or item["pattern_raw_ocr"]
        key = (lesson_number, pattern)
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "grammar_id": f"{book['textbook_id']}:lesson-{lesson_number:02d}:grammar-{len(rows)+1:03d}",
            "lesson_key": f"{book['textbook_id']}:lesson-{lesson_number:02d}",
            "textbook_id": book["textbook_id"], "volume": book["volume"], "lesson_id": f"lesson-{lesson_number:02d}",
            "lesson_number": lesson_number, "lesson_title": book["lesson_titles"][lesson_number - 1],
            "pattern": pattern, "function_zh": "", "meaning_vi": "", "meaning_vi_status": "missing_translation",
            "example_sentence_zh": "；".join(sentence_by_page.get(page, [])), "source_section": "参考句式/参考句型",
            "source_pdf_page": page, "source_printed_page": item.get("source_printed_page", ""),
            "source_status": item["source_status"],
            "source_notes": "出版社活动页列出的参考句式；需人工核对 OCR 与补充越南文说明。",
        })
    # Add a reviewable legacy candidate for lessons where no reference-pattern
    # row was extracted. This ensures the database remains useful while making
    # provenance explicit instead of presenting inferred grammar as source fact.
    covered_lessons = {r["lesson_number"] for r in rows}
    for legacy_row in legacy:
        lesson_number = int(legacy_row["课次"])
        if lesson_number in covered_lessons:
            continue
        field = legacy_row.get("核心语法/句式", "").strip()
        if not field:
            continue
        for order, pattern in enumerate(re.split(r"[；;。]", field), 1):
            pattern = pattern.strip()
            if not pattern:
                continue
            rows.append({
                "grammar_id": f"{book['textbook_id']}:lesson-{lesson_number:02d}:legacy-grammar-{order:03d}",
                "lesson_key": f"{book['textbook_id']}:lesson-{lesson_number:02d}",
                "textbook_id": book["textbook_id"], "volume": book["volume"], "lesson_id": f"lesson-{lesson_number:02d}",
                "lesson_number": lesson_number, "lesson_title": book["lesson_titles"][lesson_number - 1],
                "pattern": pattern, "function_zh": "", "meaning_vi": "", "meaning_vi_status": "missing_translation",
                "example_sentence_zh": "", "source_section": "旧摘要候选（待最新版逐页核对）",
                "source_pdf_page": "", "source_status": "legacy_candidate_not_current_source",
                "source_notes": "来自旧课程摘要，仅作待核查候选，不代表最新版教材逐字语法索引。",
            })
    return rows


def build_grammar_audit_rows(path: Path) -> list[dict[str, Any]]:
    """Turn the independent PDF grammar audit into the primary review table.

    The audit deliberately distinguishes explicit reference-pattern sections
    from patterns inferred from key/common sentences.  Both are useful for
    lesson preparation, but neither is silently presented as a teacher-
    approved grammar inventory.
    """
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    rows: list[dict[str, Any]] = []
    for lesson in payload.get("lessons", []):
        lesson_key = str(lesson.get("lesson_key", ""))
        if ":lesson-" not in lesson_key:
            continue
        textbook_id, lesson_id = lesson_key.split(":", 1)
        lesson_number_match = re.search(r"lesson-(\d+)$", lesson_id)
        if not lesson_number_match:
            continue
        lesson_number = int(lesson_number_match.group(1))
        source_pages = lesson.get("source_pages", [])
        scan_pages = [str(item.get("scan_page", "")) for item in source_pages if str(item.get("scan_page", ""))]
        printed_pages = [str(item.get("printed_page", "")) for item in source_pages if str(item.get("printed_page", ""))]
        sections = []
        for item in source_pages:
            section = str(item.get("section", "")).strip()
            if section and section not in sections:
                sections.append(section)
        evidence = [str(item).strip() for item in lesson.get("evidence", []) if str(item).strip()]
        patterns = [str(item).strip() for item in lesson.get("patterns", []) if str(item).strip()]
        if not patterns:
            continue
        status = str(lesson.get("source_status", "audit_pattern_needs_manual"))
        for order, pattern in enumerate(patterns, 1):
            rows.append({
                "grammar_id": f"{lesson_key}:audit-grammar-{order:03d}",
                "lesson_key": lesson_key,
                "textbook_id": textbook_id,
                "volume": "初级起步篇 I" if textbook_id == "boya-elementary-i" else "初级起步篇 II",
                "lesson_id": lesson_id,
                "lesson_number": lesson_number,
                "lesson_title": lesson.get("title", ""),
                "pattern": pattern,
                "function_zh": "",
                "meaning_vi": "",
                "meaning_vi_status": "missing_translation",
                "example_sentence_zh": "；".join(evidence),
                "evidence_zh": "；".join(evidence),
                "source_section": "；".join(sections),
                "source_pdf_page": scan_pages[0] if scan_pages else "",
                "source_printed_page": printed_pages[0] if printed_pages else "",
                "source_pdf_pages": ";".join(scan_pages),
                "source_printed_pages": ";".join(printed_pages),
                "source_status": status,
                "needs_manual": "true" if lesson.get("needs_manual", True) else "false",
                "source_notes": "独立 PDF 语法审计草稿；" + (
                    "参考句式／句型明确出现，仍需逐页人工核对。"
                    if status == "explicit_section_ocr_needs_manual"
                    else "拼音与用法说明明确出现，仍需逐页人工核对。"
                    if status == "phonetics_explicit_ocr_needs_manual"
                    else "由重点／常用句子或活动提示归纳，需教师确认是否列为本课语法。"
                ),
            })
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields: list[str] = []
    for row in rows:
        for key in row:
            if key not in fields:
                fields.append(key)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def load_translation_overrides() -> dict[tuple[str, str], dict[str, str]]:
    """Load Vietnamese translations written by the bounded translation pass."""
    path = OUT_DIR / "translation-overrides.csv"
    if not path.exists():
        return {}
    try:
        with path.open(encoding="utf-8-sig", newline="") as handle:
            rows = csv.DictReader(handle)
            return {
                (str(row.get("record_type", "")).strip(), str(row.get("record_id", "")).strip()): row
                for row in rows
                if str(row.get("record_type", "")).strip() and str(row.get("record_id", "")).strip()
            }
    except (OSError, csv.Error):
        return {}


def apply_translation_overrides(rows: list[dict[str, Any]], record_type: str, id_field: str, overrides: dict[tuple[str, str], dict[str, str]]) -> None:
    for row in rows:
        record_id = str(row.get(id_field, ""))
        override = overrides.get((record_type, record_id))
        if not override:
            continue
        meaning = str(override.get("meaning_vi", "")).strip()
        if meaning:
            row["meaning_vi"] = meaning
            row["meaning_vi_status"] = str(override.get("meaning_vi_status", "translated_subagent_draft")).strip() or "translated_subagent_draft"
        if "function_vi" in override and override.get("function_vi", "").strip():
            row["function_vi"] = override["function_vi"].strip()


def make_xlsx(sheets: dict[str, list[dict[str, Any]]], path: Path) -> None:
    wb = Workbook()
    default = wb.active
    wb.remove(default)
    for sheet_name, rows in sheets.items():
        ws = wb.create_sheet(sheet_name[:31])
        if not rows:
            ws.append(["（无记录）"])
            continue
        fields: list[str] = []
        for row in rows:
            for key in row:
                if key not in fields:
                    fields.append(key)
        ws.append(fields)
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="17324D")
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        for row in rows:
            ws.append([row.get(key, "") for key in fields])
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for idx, field in enumerate(fields, 1):
            max_len = max([len(str(field))] + [len(str(row.get(field, ""))) for row in rows[:500]])
            ws.column_dimensions[get_column_letter(idx)].width = min(max(max_len + 2, 12), 42)
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    all_lessons: list[dict[str, Any]] = []
    all_vocab_master: list[dict[str, Any]] = []
    all_vocab_occurrences: list[dict[str, Any]] = []
    all_patterns: list[dict[str, Any]] = []
    all_sentences: list[dict[str, Any]] = []
    all_expressions: list[dict[str, Any]] = []
    old_baseline = read_old_baseline()
    source_stats: dict[str, dict[str, int]] = {}

    for book in BOOKS:
        appendix = extract_appendix_rows(book)
        source_stats[book["textbook_id"]] = {
            "appendix_entries": len(appendix),
            "appendix_unique_word_pinyin": len({(row["word"], clean_pinyin_key(row.get("pinyin", ""))) for row in appendix}),
        }
        appendix_pinyin_keys = {clean_pinyin_key(row["pinyin"]) for row in appendix}
        appendix_words = {row["word"] for row in appendix}
        occurrences = extract_vocab_rows(book, appendix_pinyin_keys, appendix_words)
        master, occurrences = merge_and_normalize_vocab(book, occurrences, appendix)
        patterns = extract_reference_patterns(book)
        sentences = extract_reference_sentences(book)
        for lesson_number, title in enumerate(book["lesson_titles"], 1):
            all_lessons.append({
                "lesson_key": f"{book['textbook_id']}:lesson-{lesson_number:02d}",
                "textbook_id": book["textbook_id"], "volume": book["volume"], "lesson_id": f"lesson-{lesson_number:02d}",
                "lesson_number": lesson_number, "lesson_title": title,
                "textbook_printed_start_page": book["printed_starts"][lesson_number - 1],
                "source_pdf_start_page": book["lesson_starts"][lesson_number - 1],
                "vocabulary_source": "词语页（第4课起） + 词语总表" if lesson_number >= 4 or book["textbook_id"] == "boya-elementary-ii" else "拼音与日常用语；无独立词语表",
                "grammar_source": "参考句式/参考句型、重点句子/常用句子；必要时保留旧候选待核对",
                "source_status": "pdf_ocr_extracted_needs_translation_and_manual_review",
            })
        for lesson_number, expressions in book.get("expressions", {}).items():
            for order, (word, pinyin, meaning_en) in enumerate(expressions, 1):
                all_expressions.append({
                    "expression_id": f"{book['textbook_id']}:lesson-{lesson_number:02d}:expression-{order:02d}",
                    "lesson_key": f"{book['textbook_id']}:lesson-{lesson_number:02d}",
                    "textbook_id": book["textbook_id"], "volume": book["volume"], "lesson_id": f"lesson-{lesson_number:02d}",
                    "lesson_number": lesson_number, "expression": word, "pinyin": pinyin,
                    "meaning_en_source": meaning_en, "meaning_vi": "", "meaning_vi_status": "missing_translation",
                    "source_section": "日常用语", "source_status": "source_text_manual_seed_needs_review",
                    "source_notes": "第1–3课无独立词语页，保留教材日常用语作为可备课查找项。",
                })
        all_vocab_master.extend(master)
        all_vocab_occurrences.extend(occurrences)
        all_patterns.extend(patterns)
        all_sentences.extend(sentences)

    # Keep the direct OCR pattern rows and legacy candidates as separate layers.
    # The independent audit is the primary grammar table when available.
    all_grammar_source_patterns: list[dict[str, Any]] = []
    all_grammar_legacy_candidates: list[dict[str, Any]] = []
    for book in BOOKS:
        combined = build_grammar_rows(book, extract_reference_patterns(book), extract_reference_sentences(book), old_baseline)
        all_grammar_source_patterns.extend([row for row in combined if row.get("source_status") != "legacy_candidate_not_current_source"])
        all_grammar_legacy_candidates.extend([row for row in combined if row.get("source_status") == "legacy_candidate_not_current_source"])
    all_grammar_audit = build_grammar_audit_rows(GRAMMAR_AUDIT_PATH)
    all_grammar = all_grammar_audit or (all_grammar_source_patterns + all_grammar_legacy_candidates)

    # Translation overrides are intentionally a separate, reviewable file so a
    # new OCR extraction never erases Vietnamese work already completed.
    overrides = load_translation_overrides()
    apply_translation_overrides(all_vocab_master, "vocabulary", "vocabulary_key", overrides)
    apply_translation_overrides(all_vocab_occurrences, "vocabulary", "vocabulary_key", overrides)
    apply_translation_overrides(all_grammar, "grammar", "grammar_id", overrides)
    apply_translation_overrides(all_grammar_source_patterns, "grammar", "grammar_id", overrides)
    apply_translation_overrides(all_grammar_legacy_candidates, "grammar", "grammar_id", overrides)
    apply_translation_overrides(all_expressions, "expression", "expression_id", overrides)

    # One translation sheet covers every row type and gives subagents stable IDs
    # to fill without touching source-derived columns.
    translation_template: list[dict[str, Any]] = []
    for row in all_vocab_master:
        translation_template.append({
            "record_type": "vocabulary", "record_id": row["vocabulary_key"],
            "textbook_id": row["textbook_id"], "lesson_key": "", "word": row["word"],
            "pinyin": row["pinyin"], "pattern": "", "expression": "",
            "meaning_en_source": row.get("meaning_en_source", ""),
            "meaning_vi": row.get("meaning_vi", ""), "meaning_vi_status": row.get("meaning_vi_status", "missing_translation"),
        })
    for row in all_grammar:
        translation_template.append({
            "record_type": "grammar", "record_id": row["grammar_id"],
            "textbook_id": row["textbook_id"], "lesson_key": row.get("lesson_key", ""), "word": "",
            "pinyin": "", "pattern": row.get("pattern", ""), "expression": "",
            "meaning_en_source": "", "meaning_vi": row.get("meaning_vi", ""), "meaning_vi_status": row.get("meaning_vi_status", "missing_translation"),
        })
    for row in all_expressions:
        translation_template.append({
            "record_type": "expression", "record_id": row["expression_id"],
            "textbook_id": row["textbook_id"], "lesson_key": row.get("lesson_key", ""), "word": "",
            "pinyin": row.get("pinyin", ""), "pattern": "", "expression": row.get("expression", ""),
            "meaning_en_source": row.get("meaning_en_source", ""), "meaning_vi": row.get("meaning_vi", ""),
            "meaning_vi_status": row.get("meaning_vi_status", "missing_translation"),
        })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CSV_DIR.mkdir(parents=True, exist_ok=True)
    sheets = {
        "lessons": all_lessons,
        "vocabulary_master": all_vocab_master,
        "vocabulary_occurrences": all_vocab_occurrences,
        "grammar": all_grammar,
        "grammar_source_patterns": all_grammar_source_patterns,
        "grammar_legacy_candidates": all_grammar_legacy_candidates,
        "expressions": all_expressions,
        "reference_sentences": all_sentences,
        "translations_vi": translation_template,
    }
    for name, rows in sheets.items():
        write_csv(CSV_DIR / f"{name}.csv", rows)
    xlsx_path = OUT_DIR / "博雅汉语听说-初级起步篇I-II-词汇语法参考数据库-v1.0.0.xlsx"
    make_xlsx(sheets, xlsx_path)

    manifest = {
        "dataset_id": "boya-elementary-i-ii-reference-dataset",
        "dataset_version": "1.0.0",
        "generated_date": TODAY,
        "source_books": [
            {
                "textbook_id": book["textbook_id"], "title": book["title"], "pdf_path": str(book["pdf"]),
                "pdf_exists": book["pdf"].exists(), "pdf_sha256": sha256(book["pdf"]) if book["pdf"].exists() else "",
                "ocr_dir": str(book["ocr_dir"].relative_to(ROOT)), "ocr_pages": len(list(book["ocr_dir"].glob("page-*.txt"))),
                "appendix_pdf_pages": list(range(book["appendix_pages"][0], book["appendix_pages"][1] + 1)),
                "appendix_entries_extracted": source_stats.get(book["textbook_id"], {}).get("appendix_entries", 0),
                "appendix_unique_word_pinyin": source_stats.get(book["textbook_id"], {}).get("appendix_unique_word_pinyin", 0),
            }
            for book in BOOKS
        ],
        "counts": {
            "lessons": len(all_lessons), "vocabulary_master": len(all_vocab_master),
            "vocabulary_occurrences": len(all_vocab_occurrences), "grammar": len(all_grammar),
            "grammar_audit": len(all_grammar_audit), "grammar_source_patterns": len(all_grammar_source_patterns),
            "grammar_legacy_candidates": len(all_grammar_legacy_candidates),
            "expressions": len(all_expressions), "reference_sentences": len(all_sentences),
            "vocabulary_master_unique_headwords": len({(row["textbook_id"], row["word"]) for row in all_vocab_master}),
            "translation_missing_vocabulary": sum(1 for row in all_vocab_master if not row.get("meaning_vi", "").strip()),
            "translation_missing_grammar": sum(1 for row in all_grammar if not row.get("meaning_vi", "").strip()),
            "translation_missing_expressions": sum(1 for row in all_expressions if not row.get("meaning_vi", "").strip()),
        },
        "translation_policy": "meaning_vi is a Vietnamese study aid. Subagent translations are marked translated_subagent_draft until a teacher reviews them; English source definitions are retained when OCR captured them.",
        "source_policy": "Supplied PDFs are current source. The appendix is the vocabulary index; OCR and image-checked corrections remain reviewable. The independent grammar audit is primary for search, while direct OCR patterns and old baseline candidates are retained as separate evidence layers.",
        "files": {},
    }
    audit_output = OUT_DIR / "grammar-audit-evidence.json"
    if GRAMMAR_AUDIT_PATH.exists():
        audit_output.write_text(GRAMMAR_AUDIT_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    output_paths = [xlsx_path, *sorted(CSV_DIR.glob("*.csv")), audit_output]
    translation_override_path = OUT_DIR / "translation-overrides.csv"
    if translation_override_path.exists():
        output_paths.append(translation_override_path)
    for path in output_paths:
        manifest["files"][str(path.relative_to(OUT_DIR))] = {"sha256": sha256(path), "bytes": path.stat().st_size}
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    readme = f"""# 博雅汉语听说·初级起步篇 I–II 词汇语法参考数据库

生成日期：{TODAY}  
版本：1.0.0  
来源：用户提供的两本扫描版最新版 PDF；OCR 仅作提取中间层。

## 用法

- `csv/vocabulary_master.csv`：按“词语＋拼音”去重的词语索引，保留多音词，含拼音、教材印刷页、对应课次、英文原释义（若 OCR 捕获）和 `meaning_vi` 越南文释义栏。
- `csv/vocabulary_occurrences.csv`：各课词语页的出现记录，适合按课备课和核对词类。
- `csv/grammar.csv`：独立 PDF 语法审计产生的备课检索表；明确的「参考句式／参考句型」与由重点／常用句子归纳的候选分开标记，所有行目前都需教师逐页复核。
- `csv/grammar_source_patterns.csv`：直接从「参考句式／参考句型」页 OCR 提取的来源层；它与旧候选层保留原始证据，主备课请使用已整理的 `grammar.csv`。
- `csv/grammar_legacy_candidates.csv`：旧摘要中、最新版 PDF 尚未直接抽到的候选，只作待核查提示，不视为最新版教材定稿。
- `grammar-audit-evidence.json`：逐课保留语法审计的来源页、证据句和状态。
- `csv/expressions.csv`：第 1–3 课的日常用语。该三课是拼音与日常用语单元，没有独立的“词语”页。
- `csv/translations_vi.csv`：词汇、语法和日常用语的越南文翻译总表；翻译草稿标为 `translated_subagent_draft`，待教师确认的行标为 `missing_translation`。
- `translation-overrides.csv`：翻译覆盖层；重建来源数据时不会抹掉已完成的越南文。
- `博雅汉语听说-初级起步篇I-II-词汇语法参考数据库-v1.0.0.xlsx`：以上表格的可筛选版本。

## 证据与限制

教材 PDF 是扫描图像，未提供可直接读取的文字层；当前数据由 macOS Vision OCR 提取，再以词语总表／各课词语页配对。OCR 误读、词类和越南文释义必须在交付教学前复核。`manifest.json` 记录 PDF SHA-256、OCR 页数与每个导出文件 SHA-256。

## 翻译状态

`meaning_vi` 是越南文备课栏。当前由子代理完成的翻译标为 `translated_subagent_draft`，正式上课前请教师抽查并可改为 `reviewed_teacher`；不要删除英文原释义和来源状态。
"""
    (OUT_DIR / "README.md").write_text(readme, encoding="utf-8")
    print(json.dumps(manifest["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
