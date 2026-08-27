#!/usr/bin/env python3
"""Set exact keyword paragraphs in a PPTX to the shared classroom size.

The transform only changes DrawingML run-size declarations in slide XML. It
preserves slide text, layout, media, notes, relationships, and all other ZIP
parts. A paragraph is changed only when its complete visible text exactly
matches one of the configured keywords, so ordinary sentences containing a
keyword are left untouched.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import zipfile
from pathlib import Path


KEYWORD_SIZE = 2000  # PowerPoint stores points in hundredths of a point.
DEFAULT_KEYWORDS = (
    "健康",
    "勇敢",
    "平安",
    "好写",
    "好记",
    "意思好",
    "意思",
    "来历",
    "读音",
    "发音",
    "头等大事",
    "别扭",
    "糟",
    "低调",
    "操心",
    "啼笑皆非",
    "少见",
    "尊称",
    "称呼",
    "交往",
)

SLIDE_XML_RE = re.compile(r"^ppt/slides/slide\d+\.xml$")
PARAGRAPH_RE = re.compile(rb"<a:p\b[^>]*>.*?</a:p>", re.DOTALL)
RUN_RE = re.compile(rb"<a:r\b[^>]*>.*?</a:r>", re.DOTALL)
TEXT_RE = re.compile(rb"<a:t\b[^>]*>(.*?)</a:t>", re.DOTALL)
RPR_RE = re.compile(rb"<a:rPr\b[^>]*(?:/>|>.*?</a:rPr>)", re.DOTALL)
SIZE_RE = re.compile(rb"(\bsz\s*=\s*)([\"'])(\d+)(\2)")


def visible_text(paragraph: bytes) -> str:
    return "".join(
        html.unescape(match.group(1).decode("utf-8"))
        for match in TEXT_RE.finditer(paragraph)
    )


def set_run_size(run: bytes) -> tuple[bytes, bool]:
    rpr_match = RPR_RE.search(run)
    if not rpr_match:
        return run, False
    rpr = rpr_match.group(0)
    sized_rpr, changed = SIZE_RE.subn(
        lambda match: match.group(1) + match.group(2) + str(KEYWORD_SIZE).encode("ascii") + match.group(4),
        rpr,
    )
    if changed == 0:
        insert_at = sized_rpr.find(b">")
        if insert_at < 0:
            return run, False
        sized_rpr = sized_rpr[:insert_at] + b' sz="2000"' + sized_rpr[insert_at:]
        changed = 1
    return run[: rpr_match.start()] + sized_rpr + run[rpr_match.end() :], bool(changed)


def patch_paragraph(paragraph: bytes, keywords: set[str]) -> tuple[bytes, int]:
    if visible_text(paragraph) not in keywords:
        return paragraph, 0
    changed_runs = 0

    def patch_run(match: re.Match[bytes]) -> bytes:
        nonlocal changed_runs
        next_run, changed = set_run_size(match.group(0))
        changed_runs += int(changed)
        return next_run

    return RUN_RE.sub(patch_run, paragraph), changed_runs


def patch_slide_xml(data: bytes, keywords: set[str]) -> tuple[bytes, int, list[str]]:
    changed_runs = 0
    matched_keywords: set[str] = set()

    def patch_match(match: re.Match[bytes]) -> bytes:
        nonlocal changed_runs
        paragraph = match.group(0)
        text = visible_text(paragraph)
        if text in keywords:
            matched_keywords.add(text)
        next_paragraph, changes = patch_paragraph(paragraph, keywords)
        changed_runs += changes
        return next_paragraph

    next_data = PARAGRAPH_RE.sub(patch_match, data)
    return next_data, changed_runs, sorted(matched_keywords)


def transform(input_path: Path, output_path: Path, keywords: set[str]) -> dict[str, object]:
    input_path = input_path.resolve()
    output_path = output_path.resolve()
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if input_path.suffix.lower() != ".pptx":
        raise ValueError(f"Input must be a PPTX: {input_path}")
    if input_path == output_path:
        raise ValueError("Output must be a different file")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    changed_parts = 0
    changed_runs = 0
    matched_keywords: set[str] = set()
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(
        output_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as target:
        for info in source.infolist():
            data = source.read(info.filename)
            next_data = data
            part_changes = 0
            part_keywords: list[str] = []
            if SLIDE_XML_RE.match(info.filename):
                next_data, part_changes, part_keywords = patch_slide_xml(data, keywords)
            if next_data != data:
                changed_parts += 1
                changed_runs += part_changes
                matched_keywords.update(part_keywords)
            target.writestr(info, next_data)

    return {
        "input": str(input_path),
        "output": str(output_path),
        "keyword_size_pt": KEYWORD_SIZE / 100,
        "changed_slide_parts": changed_parts,
        "changed_runs": changed_runs,
        "matched_keywords": sorted(matched_keywords),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--keyword",
        action="append",
        dest="keywords",
        help="Exact paragraph text to resize; repeat for custom keywords.",
    )
    args = parser.parse_args()
    keywords = set(args.keywords or DEFAULT_KEYWORDS)
    result = transform(args.input, args.output, keywords)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
