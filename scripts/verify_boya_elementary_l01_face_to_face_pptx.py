#!/usr/bin/env python3
"""Read-only static QA for the elementary Lesson 1 classroom PPTX draft."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    from PIL import Image
except ImportError:  # pragma: no cover - the project QA environment has Pillow
    Image = None


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}
SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml")
NOTES_RE = re.compile(r"ppt/notesSlides/notesSlide(\d+)\.xml")
MIN_PT = 23
EMU_PER_INCH = 914400


def slide_text(root: ET.Element) -> str:
    return " ".join(node.text or "" for node in root.findall(".//a:t", NS))


def text_sizes(root: ET.Element) -> list[float]:
    values: list[float] = []
    for node in root.findall(".//a:rPr", NS) + root.findall(".//a:defRPr", NS) + root.findall(".//a:endParaRPr", NS):
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
        return tuple(int(node.attrib[key]) for node, key in ((off, "x"), (off, "y"), (ext, "cx"), (ext, "cy")))  # type: ignore[return-value]
    except (KeyError, TypeError, ValueError):
        return None


def audio_probe(data: bytes) -> tuple[bool, str]:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-f", "mp3", "-i", "pipe:0", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1"],
        input=data,
        capture_output=True,
        check=False,
    )
    value = result.stdout.decode("utf-8", errors="replace").strip()
    return result.returncode == 0 and bool(value), value or result.stderr.decode("utf-8", errors="replace").strip()


def run(pptx_path: Path) -> dict[str, object]:
    failures: list[str] = []
    slide_texts: dict[int, str] = {}
    all_sizes: list[float] = []
    font_scale_values: list[int] = []
    out_of_bounds: list[dict[str, object]] = []
    slide_count = 0
    note_count = 0
    unique_audio: dict[str, dict[str, object]] = {}
    unique_images: dict[str, dict[str, object]] = {}
    slide_preset_shapes: dict[int, list[str]] = {}

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
                node.attrib.get("prst", "")
                for node in root.findall(".//a:prstGeom", NS)
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
            if not name.startswith("ppt/media/"):
                continue
            data = archive.read(name)
            digest = hashlib.sha256(data).hexdigest()
            suffix = Path(name).suffix.lower()
            if suffix == ".mp3":
                unique_audio.setdefault(digest, {"file": name, "bytes": len(data)})
            elif suffix in {".png", ".jpg", ".jpeg"}:
                item = unique_images.setdefault(digest, {"file": name, "bytes": len(data)})
                if Image is not None:
                    try:
                        with Image.open(__import__("io").BytesIO(data)) as image:
                            item["size"] = list(image.size)
                    except Exception as error:  # pragma: no cover
                        item["decode_error"] = str(error)

    if slide_count != 55:
        failures.append(f"slide_count={slide_count}, expected 55")
    if note_count != 55:
        failures.append(f"notes_count={note_count}, expected 55")
    if (slide_w, slide_h) != (12192000, 6858000):
        failures.append(f"slide_size={(slide_w, slide_h)}, expected 16:9 wide")
    if out_of_bounds:
        failures.append(f"out_of_bounds_shapes={len(out_of_bounds)}")
    if not all_sizes or min(all_sizes) < MIN_PT:
        failures.append(f"minimum_explicit_text_size={min(all_sizes) if all_sizes else None}, expected >= {MIN_PT}")
    if any(value < 100000 for value in font_scale_values):
        failures.append("fontScale contains an effective text scale below 100%")
    if len(unique_audio) != 0:
        failures.append(f"unique_embedded_audio={len(unique_audio)}, expected 0 after playback removal")
    # Nine lesson assets are embedded: the learning-flow graphic, tone chart,
    # five regenerated divider illustrations, and two retained teaching images.
    if len(unique_images) != 9:
        failures.append(f"unique_embedded_images={len(unique_images)}, expected 9 lesson assets")
    if not any(item.get("size") == [1586, 992] for item in unique_images.values()):
        failures.append("embedded tone chart image with source dimensions 1586x992 was not found")
    if any("音频" in value for value in slide_texts.values()):
        failures.append("deck still contains a visible audio label after playback removal")
    if "听一听 · 读一读 · 说一说" in slide_texts.get(1, ""):
        failures.append("slide 1 still contains the retired generic cover phrase")

    initials = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "zh", "ch", "sh", "r"]
    finals = ["a", "o", "e", "i", "u", "ü"]
    for slide_no, value in zip(range(5, 26), initials):
        if value not in slide_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} missing initial {value}")
    for slide_no, value in zip(range(32, 38), finals):
        if value not in slide_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} missing final {value}")
    for slide_no in [*range(5, 26), *range(32, 38)]:
        if "ellipse" in slide_preset_shapes.get(slide_no, []):
            failures.append(f"slide {slide_no} still has a circle background on a standalone sound page")

    required = {
        38: "声调",
        29: "听写",
        49: "请看教材P3、P4的（三）。",
        55: "请看教材P4、P5的（二）。",
        46: "jü → ju",
        47: "qü → qu",
        48: "xü → xu",
    }
    for slide_no, phrase in required.items():
        if phrase not in slide_texts.get(slide_no, ""):
            failures.append(f"slide {slide_no} missing required phrase: {phrase}")
    if "汉语声调" in slide_texts.get(39, ""):
        failures.append("slide 39 still contains the removed title 汉语声调")
    if any(re.search(r"[a-zA-Z]+[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", slide_texts.get(n, "")) for n in (52, 53)):
        failures.append("slides 52-53 contain pinyin, but they should show phrases without pinyin")
    for phrase in ("三人", "三个人", "两人一组"):
        if any(phrase in value for value in slide_texts.values()):
            failures.append(f"deck contains prohibited group wording: {phrase}")
    for phrase in ("Vừa mới gặp nhau", "Bạn học vừa giúp bạn", "Bạn làm sai", "Bạn sắp rời đi"):
        if phrase not in slide_texts.get(54, ""):
            failures.append(f"slide 54 missing Vietnamese scenario label: {phrase}")

    audio_reports = []
    for digest, item in unique_audio.items():
        with zipfile.ZipFile(pptx_path, "r") as archive:
            ok, detail = audio_probe(archive.read(item["file"]))
        audio_reports.append({"sha256": digest, "file": item["file"], "decodable": ok, "duration": detail})
        if not ok:
            failures.append(f"embedded audio is not decodable: {item['file']}")

    return {
        "command": "qa",
        "status": "passed" if not failures else "failed",
        "lesson_key": "boya-elementary-i:lesson-01",
        "pptx": str(pptx_path),
        "slide_count": slide_count,
        "notes_count": note_count,
        "slide_size_emu": [slide_w, slide_h],
        "minimum_explicit_text_size_pt": min(all_sizes) if all_sizes else None,
        "font_scale_values": font_scale_values,
        "out_of_bounds_shapes": out_of_bounds,
        "unique_audio_count": len(unique_audio),
        "audio": audio_reports,
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
