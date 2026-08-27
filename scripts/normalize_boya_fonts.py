#!/usr/bin/env python3
"""Normalize DOCX/PPTX font declarations for cross-device delivery.

Chinese characters use KaiTi. Vietnamese and other Latin-script text use
Times New Roman. The tool changes only font declarations inside Office XML;
content, layout, media, notes, and relationships remain untouched.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path


CJK_FONT = "KaiTi"
LATIN_FONT = "Times New Roman"

DOCX_R_FONTS_RE = re.compile(rb"<w:rFonts\b[^>]*?/?>")
DOCX_FONT_TABLE_RE = re.compile(rb"<w:font\b[^>]*>")
PPTX_FONT_TAG_RE = re.compile(rb"<a:(latin|ea|cs|buFont|font)\b[^>]*?/?>")
PPTX_APP_FONT_NAME_REPLACEMENTS = {
    b"Heiti SC": CJK_FONT.encode("utf-8"),
    b"Hiragino Sans GB": CJK_FONT.encode("utf-8"),
    b"Microsoft YaHei": CJK_FONT.encode("utf-8"),
    b"MicrosoftYaHei": CJK_FONT.encode("utf-8"),
    b"SimSun": CJK_FONT.encode("utf-8"),
    b"SimHei": CJK_FONT.encode("utf-8"),
    b"Arial": LATIN_FONT.encode("utf-8"),
}
ATTR_RE_TEMPLATE = rb"(\b%s\s*=\s*)([\"'])(.*?)(\2)"


def replace_attr(tag: bytes, attr: str, value: str) -> tuple[bytes, bool]:
    """Set an XML attribute on one tag, preserving its existing quote style."""

    attr_bytes = attr.encode("ascii")
    pattern = re.compile(ATTR_RE_TEMPLATE % re.escape(attr_bytes))
    value_bytes = value.encode("utf-8")
    match = pattern.search(tag)
    if match:
        replacement = match.group(1) + match.group(2) + value_bytes + match.group(4)
        next_tag = tag[:match.start()] + replacement + tag[match.end():]
        return next_tag, next_tag != tag

    insert_at = tag.rfind(b"/>")
    if insert_at < 0:
        insert_at = tag.rfind(b">")
    if insert_at < 0:
        raise ValueError(f"Malformed XML tag: {tag!r}")
    next_tag = tag[:insert_at] + b" " + attr_bytes + b'="' + value_bytes + b'"' + tag[insert_at:]
    return next_tag, True


def normalize_docx_xml(data: bytes) -> tuple[bytes, int]:
    """Normalize every Word run-font declaration in one XML part."""

    changed = 0

    def patch(match: re.Match[bytes]) -> bytes:
        nonlocal changed
        tag = match.group(0)
        for attr, value in (
            ("w:ascii", LATIN_FONT),
            ("w:hAnsi", LATIN_FONT),
            ("w:eastAsia", CJK_FONT),
            ("w:cs", LATIN_FONT),
        ):
            tag, did_change = replace_attr(tag, attr, value)
            changed += int(did_change)
        return tag

    return DOCX_R_FONTS_RE.sub(patch, data), changed


def normalize_docx_font_table(data: bytes) -> tuple[bytes, int]:
    """Keep Word's font table metadata within the two approved font families."""

    cjk_markers = (
        "kaiti", "simsun", "simhei", "heiti", "hiragino", "ms gothic", "ms mincho",
        "ｍｓ ゴシック", "ｍｓ 明朝", "microsoft yahei", "microsoftyahei",
    )
    changed = 0

    def patch(match: re.Match[bytes]) -> bytes:
        nonlocal changed
        tag = match.group(0)
        name_match = re.search(rb'\bw:name\s*=\s*(["\'])(.*?)\1', tag)
        if not name_match:
            return tag
        old_name = name_match.group(2).decode("utf-8", errors="ignore")
        target = CJK_FONT if any(marker in old_name.lower() for marker in cjk_markers) else LATIN_FONT
        next_tag, did_change = replace_attr(tag, "w:name", target)
        changed += int(did_change)
        return next_tag

    return DOCX_FONT_TABLE_RE.sub(patch, data), changed


def normalize_pptx_xml(data: bytes) -> tuple[bytes, int]:
    """Normalize DrawingML font declarations in one PowerPoint XML part."""

    changed = 0

    def patch(match: re.Match[bytes]) -> bytes:
        nonlocal changed
        tag = match.group(0)
        local_name = match.group(1).decode("ascii")
        if local_name == "ea":
            value = CJK_FONT
        elif local_name == "font":
            script_match = re.search(rb'\bscript\s*=\s*["\']([^"\']+)["\']', tag)
            script = script_match.group(1).decode("ascii", errors="ignore") if script_match else ""
            value = CJK_FONT if script in {"Hans", "Hant", "Bopo"} else LATIN_FONT
        else:
            value = LATIN_FONT
        tag, did_change = replace_attr(tag, "typeface", value)
        changed += int(did_change)
        return tag

    return PPTX_FONT_TAG_RE.sub(patch, data), changed


def normalize_pptx_app_metadata(data: bytes) -> tuple[bytes, int]:
    """Remove legacy font names retained in PowerPoint's application metadata."""

    changed = 0
    next_data = data
    for old_name, new_name in PPTX_APP_FONT_NAME_REPLACEMENTS.items():
        occurrences = next_data.count(old_name)
        if occurrences:
            next_data = next_data.replace(old_name, new_name)
            changed += occurrences
    return next_data, changed


def normalize_archive(input_path: Path, output_path: Path) -> dict[str, object]:
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Output must be a different path; normalize to a temporary file first")
    if input_path.suffix.lower() not in {".docx", ".pptx"}:
        raise ValueError(f"Unsupported Office file: {input_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    changed_parts = 0
    changed_declarations = 0
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(
        output_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as target:
        for info in source.infolist():
            data = source.read(info.filename)
            next_data = data
            part_changes = 0
            if info.filename.endswith(".xml"):
                if input_path.suffix.lower() == ".docx" and info.filename.startswith("word/"):
                    next_data, part_changes = normalize_docx_xml(data)
                    if info.filename == "word/fontTable.xml":
                        next_data, table_changes = normalize_docx_font_table(next_data)
                        part_changes += table_changes
                    elif info.filename.startswith("word/theme/"):
                        # Keep Word's theme defaults aligned with direct run
                        # declarations so new runs do not fall back to legacy
                        # office fonts on another computer.
                        next_data, theme_changes = normalize_pptx_xml(next_data)
                        part_changes += theme_changes
                elif input_path.suffix.lower() == ".pptx" and info.filename.startswith("ppt/"):
                    next_data, part_changes = normalize_pptx_xml(data)
                elif input_path.suffix.lower() == ".pptx" and info.filename == "docProps/app.xml":
                    next_data, part_changes = normalize_pptx_app_metadata(data)
            if next_data != data:
                changed_parts += 1
                changed_declarations += part_changes
            target.writestr(info, next_data)

    return {
        "input": str(input_path),
        "output": str(output_path),
        "changed_xml_parts": changed_parts,
        "changed_declarations": changed_declarations,
        "cjk_font": CJK_FONT,
        "latin_font": LATIN_FONT,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(normalize_archive(args.input.resolve(), args.output.resolve()), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
