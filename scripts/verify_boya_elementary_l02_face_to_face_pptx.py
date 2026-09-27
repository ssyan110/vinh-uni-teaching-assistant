#!/usr/bin/env python3
"""Read-only static QA for the elementary Lesson 2 classroom PPTX draft."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}
SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml")
NOTES_RE = re.compile(r"ppt/notesSlides/notesSlide(\d+)\.xml")
MIN_PT = 23


def slide_text(root: ET.Element) -> str:
    return " ".join(node.text or "" for node in root.findall(".//a:t", NS))


def text_sizes(root: ET.Element) -> list[float]:
    values: list[float] = []
    for node in (
        root.findall(".//a:rPr", NS)
        + root.findall(".//a:defRPr", NS)
        + root.findall(".//a:endParaRPr", NS)
    ):
        raw = node.attrib.get("sz")
        if raw and raw.isdigit():
            values.append(int(raw) / 100)
    return values


def bbox(element: ET.Element) -> tuple[int, int, int, int] | None:
    xfrm = element.find("./p:spPr/a:xfrm", NS)
    if xfrm is None:
        return None
    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    if off is None or ext is None:
        return None
    try:
        return tuple(
            int(node.attrib[key])
            for node, key in ((off, "x"), (off, "y"), (ext, "cx"), (ext, "cy"))
        )  # type: ignore[return-value]
    except (KeyError, TypeError, ValueError):
        return None


def run(pptx_path: Path) -> dict[str, object]:
    failures: list[str] = []
    slide_texts: dict[int, str] = {}
    all_sizes: list[float] = []
    font_scale_values: list[int] = []
    out_of_bounds: list[dict[str, object]] = []
    slide_preset_shapes: dict[int, list[str]] = {}
    unique_images: dict[str, dict[str, object]] = {}

    with zipfile.ZipFile(pptx_path, "r") as archive:
        names = archive.namelist()
        slide_names = sorted(
            (name for name in names if SLIDE_RE.fullmatch(name)),
            key=lambda name: int(SLIDE_RE.fullmatch(name).group(1)),  # type: ignore[union-attr]
        )
        slide_count = len(slide_names)
        note_count = sum(1 for name in names if NOTES_RE.fullmatch(name))
        presentation = ET.fromstring(archive.read("ppt/presentation.xml"))
        size = presentation.find("p:sldSz", NS)
        slide_w = int(size.attrib["cx"]) if size is not None else 0
        slide_h = int(size.attrib["cy"]) if size is not None else 0

        for name in slide_names:
            slide_no = int(SLIDE_RE.fullmatch(name).group(1))  # type: ignore[union-attr]
            root = ET.fromstring(archive.read(name))
            slide_texts[slide_no] = slide_text(root)
            slide_preset_shapes[slide_no] = [
                node.attrib.get("prst", "") for node in root.findall(".//a:prstGeom", NS)
            ]
            all_sizes.extend(text_sizes(root))
            for node in root.findall(".//a:normAutofit", NS):
                raw = node.attrib.get("fontScale")
                if raw and raw.isdigit():
                    font_scale_values.append(int(raw))
            for kind in ("p:sp", "p:pic", "p:graphicFrame", "p:cxnSp"):
                for element in root.findall(f".//{kind}", NS):
                    bounds = bbox(element)
                    if bounds is None:
                        continue
                    x, y, width, height = bounds
                    if x < 0 or y < 0 or x + width > slide_w or y + height > slide_h:
                        out_of_bounds.append({"slide": slide_no, "kind": kind, "bounds": bounds})

        for name in names:
            if not name.startswith("ppt/media/") or name.endswith("/"):
                continue
            data = archive.read(name)
            digest = hashlib.sha256(data).hexdigest()
            suffix = Path(name).suffix.lower()
            if suffix not in {".png", ".jpg", ".jpeg"}:
                failures.append(f"unexpected embedded media type: {name}")
                continue
            item = unique_images.setdefault(digest, {"file": name, "bytes": len(data)})
            if Image is not None:
                try:
                    with Image.open(io.BytesIO(data)) as image:
                        item["size"] = list(image.size)
                except Exception as error:  # pragma: no cover
                    item["decode_error"] = str(error)

    if slide_count != 53:
        failures.append(f"slide_count={slide_count}, expected 53")
    if note_count != 53:
        failures.append(f"notes_count={note_count}, expected 53")
    if (slide_w, slide_h) != (12192000, 6858000):
        failures.append(f"slide_size={(slide_w, slide_h)}, expected 16:9 wide")
    if out_of_bounds:
        failures.append(f"out_of_bounds_shapes={len(out_of_bounds)}")
    if not all_sizes or min(all_sizes) < MIN_PT:
        failures.append(
            f"minimum_explicit_text_size={min(all_sizes) if all_sizes else None}, expected >= {MIN_PT}"
        )
    if any(value < 100000 for value in font_scale_values):
        failures.append("fontScale contains an effective text scale below 100%")
    if len(unique_images) != 5:
        failures.append(f"unique_embedded_images={len(unique_images)}, expected 5")
    if any("decode_error" in item for item in unique_images.values()):
        failures.append("at least one embedded lesson image could not be decoded")

    visible = "\n".join(slide_texts.values())
    for phrase in ("音频", "播放", "play", "听一听 · 读一读 · 说一说"):
        if phrase in visible:
            failures.append(f"deck contains retired visible control or cover text: {phrase}")
    if any(phrase in visible for phrase in ("三人", "三个人", "两人一组")):
        failures.append("deck contains prohibited fixed group-size wording")

    compound_finals = ["ai", "ei", "ao", "ou", "ia", "ie", "ua", "uo", "üe", "iao", "iou（iu）", "uai", "uei（ui）"]
    nasal_finals = ["an", "ian", "uan", "üan", "ang", "iang", "uang", "en", "in", "uen（un）", "üen（ün）", "eng", "ing", "ueng", "ong", "iong"]
    compact_texts = {slide_no: re.sub(r"\s+", "", text) for slide_no, text in slide_texts.items()}
    for slide_no, value in zip(range(5, 18), compound_finals):
        if value not in compact_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} missing compound final {value}")
    for slide_no, value in zip(range(26, 42), nasal_finals):
        if value not in compact_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} missing nasal final {value}")
    for slide_no in [*range(5, 18), *range(26, 42)]:
        if "ellipse" in slide_preset_shapes.get(slide_no, []):
            failures.append(f"slide {slide_no} still has a circle background on a standalone final page")

    required = {
        19: "听写",
        21: "a、o、e、i、u、ü",
        22: "diū　　duì",
        23: "请看教材P6、P7的（三）。",
        24: "请教材P6、P7的（三）。",
        44: "请看教材P8的（三）。",
        45: "用教材P8的（三）。",
        52: "请看教材P9的（二）。",
    }
    for slide_no, phrase in required.items():
        if re.sub(r"\s+", "", phrase) not in compact_texts.get(slide_no, ""):
            # Slide 24 is intentionally checked separately below because its
            # visible prompt includes the verb "用" rather than "请".
            if slide_no == 24 and "用教材P6、P7的（三）。" in compact_texts.get(slide_no, ""):
                continue
            failures.append(f"slide {slide_no} missing required phrase: {phrase}")

    for slide_no in (47, 48, 49):
        text = slide_texts.get(slide_no, "")
        if re.search(r"[a-zA-Z]+[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", text):
            failures.append(f"slide {slide_no} contains pinyin in the daily-phrase section")
    for slide_no in (50, 51):
        if "Nhìn tình huống và nói bằng tiếng Trung." not in slide_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} is missing the Vietnamese scenario instruction")

    return {
        "command": "qa",
        "status": "passed" if not failures else "failed",
        "lesson_key": "boya-elementary-i:lesson-02",
        "pptx": str(pptx_path),
        "slide_count": slide_count,
        "notes_count": note_count,
        "slide_size_emu": [slide_w, slide_h],
        "minimum_explicit_text_size_pt": min(all_sizes) if all_sizes else None,
        "font_scale_values": font_scale_values,
        "out_of_bounds_shapes": out_of_bounds,
        "unique_audio_count": 0,
        "unique_image_count": len(unique_images),
        "images": list(unique_images.values()),
        "required_copy_checks": "passed" if not failures else "failed",
        "failures": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pptx", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = run(args.pptx)
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
