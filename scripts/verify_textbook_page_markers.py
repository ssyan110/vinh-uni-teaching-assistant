#!/usr/bin/env python3
"""Verify textbook printed-page markers in a Boya lesson PPTX.

The expected slide-to-page mapping comes from the current lesson canonical
source and storyboard. The validator is lesson-neutral and deliberately
checks the student-facing marker layer without rewriting the PPTX.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from add_textbook_page_markers import NS, read_page_map


SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml")
MARKER_PREFIX = "Textbook Page Marker "


def _int_attr(element: ET.Element, name: str) -> int | None:
    try:
        return int(element.attrib[name])
    except (KeyError, TypeError, ValueError):
        return None


def _bbox(element: ET.Element) -> tuple[int, int, int, int] | None:
    xfrm = element.find("./p:spPr/a:xfrm", NS)
    if xfrm is None:
        return None
    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    if off is None or ext is None:
        return None
    values = tuple(_int_attr(node, key) for node, key in ((off, "x"), (off, "y"), (ext, "cx"), (ext, "cy")))
    if any(value is None for value in values):
        return None
    return values  # type: ignore[return-value]


def _overlaps(first: tuple[int, int, int, int], second: tuple[int, int, int, int]) -> bool:
    first_x, first_y, first_w, first_h = first
    second_x, second_y, second_w, second_h = second
    return (
        first_x < second_x + second_w
        and first_x + first_w > second_x
        and first_y < second_y + second_h
        and first_y + first_h > second_y
    )


def _shape_name(shape: ET.Element) -> str:
    c_nv_pr = shape.find("p:nvSpPr/p:cNvPr", NS)
    return "" if c_nv_pr is None else c_nv_pr.attrib.get("name", "")


def _marker_label(shape: ET.Element) -> str:
    return "".join(text.text or "" for text in shape.findall(".//a:t", NS))


def _slide_text_shapes(root: ET.Element) -> list[tuple[str, tuple[int, int, int, int]]]:
    shapes: list[tuple[str, tuple[int, int, int, int]]] = []
    for shape in root.findall(".//p:sp", NS):
        if _shape_name(shape).startswith(MARKER_PREFIX):
            continue
        if shape.find("p:txBody", NS) is None:
            continue
        bounds = _bbox(shape)
        if bounds is not None:
            shapes.append((_shape_name(shape), bounds))
    return shapes


def _read_pptx(pptx_path: Path) -> tuple[int, int, dict[int, dict[str, object]]]:
    with zipfile.ZipFile(pptx_path, "r") as archive:
        presentation = ET.fromstring(archive.read("ppt/presentation.xml"))
        slide_size = presentation.find("p:sldSz", NS)
        if slide_size is None:
            raise ValueError("PPTX presentation has no slide size")
        width = _int_attr(slide_size, "cx")
        height = _int_attr(slide_size, "cy")
        if width is None or height is None:
            raise ValueError("PPTX slide size is missing cx/cy")

        slides: dict[int, dict[str, object]] = {}
        for filename in archive.namelist():
            match = SLIDE_RE.fullmatch(filename)
            if not match:
                continue
            slide_no = int(match.group(1))
            root = ET.fromstring(archive.read(filename))
            marker_shapes = [
                shape
                for shape in root.findall(".//p:sp", NS)
                if _shape_name(shape).startswith(MARKER_PREFIX)
            ]
            slides[slide_no] = {
                "markers": [
                    {"label": _marker_label(shape), "bounds": _bbox(shape)}
                    for shape in marker_shapes
                ],
                "text_shapes": _slide_text_shapes(root),
            }
    return width, height, slides


def _verify_pdf(pdf_path: Path, expected: dict[int, str]) -> dict[str, object]:
    try:
        result = subprocess.run(
            ["pdftotext", str(pdf_path), "-"],
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return {"status": "not_checked", "reason": "pdftotext is unavailable"}
    if result.returncode != 0:
        return {"status": "failed", "reason": result.stderr.strip() or "pdftotext failed"}

    text = result.stdout
    missing = sorted({label for label in expected.values() if label not in text})
    return {
        "status": "passed" if not missing else "failed",
        "expected_label_count": len(expected),
        "missing_labels": missing,
    }


def verify(pptx_path: Path, source_path: Path, storyboard_path: Path, pdf_path: Path | None) -> dict[str, object]:
    expected = read_page_map(source_path, storyboard_path)
    width, height, slides = _read_pptx(pptx_path)
    failures: list[str] = []
    expected_slides = set(expected)
    actual_slides = set(slides)

    if not expected_slides.issubset(actual_slides):
        failures.append(f"Expected marker slide(s) are absent from the PPTX: {sorted(expected_slides - actual_slides)}")
    if width <= 0 or height <= 0 or abs((width / height) - (16 / 9)) > 0.01:
        failures.append(f"PPTX slide size is not 16:9: {width}x{height} EMU")

    actual_marker_count = 0
    for slide_no, slide in sorted(slides.items()):
        markers = slide["markers"]  # type: ignore[assignment]
        if not isinstance(markers, list):
            failures.append(f"Slide {slide_no}: marker data is malformed")
            continue
        actual_marker_count += len(markers)
        if slide_no in expected:
            if len(markers) != 1:
                failures.append(f"Slide {slide_no}: expected exactly one textbook marker, found {len(markers)}")
                continue
            marker = markers[0]
            if marker["label"] != expected[slide_no]:
                failures.append(
                    f"Slide {slide_no}: expected {expected[slide_no]!r}, found {marker['label']!r}"
                )
            bounds = marker["bounds"]
            if bounds is None:
                failures.append(f"Slide {slide_no}: marker has no readable bounds")
                continue
            x, y, marker_width, marker_height = bounds
            if x < 0 or y < 0 or x + marker_width > width or y + marker_height > height:
                failures.append(f"Slide {slide_no}: marker is outside the slide canvas: {bounds}")
            for shape_name, shape_bounds in slide["text_shapes"]:  # type: ignore[index]
                if _overlaps(bounds, shape_bounds):
                    failures.append(f"Slide {slide_no}: marker overlaps text shape {shape_name!r}")
        elif markers:
            failures.append(f"Slide {slide_no}: textbook marker exists but storyboard has no textbook source_refs")

    pdf_report = {"status": "not_requested"}
    if pdf_path is not None:
        pdf_report = _verify_pdf(pdf_path, expected)
        if pdf_report.get("status") == "failed":
            failures.append("PDF preview does not contain every expected textbook marker label")

    return {
        "status": "passed" if not failures else "failed",
        "pptx": str(pptx_path),
        "slide_count": len(slides),
        "expected_marker_count": len(expected),
        "actual_marker_count": actual_marker_count,
        "expected_slides": expected,
        "pdf": pdf_report,
        "failures": failures,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify textbook printed-page markers in a Boya lesson PPTX.")
    parser.add_argument("--pptx", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--storyboard", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, help="Optional PowerPoint PDF preview for marker visibility QA")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = verify(args.pptx, args.source, args.storyboard, args.pdf)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
