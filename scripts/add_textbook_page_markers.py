#!/usr/bin/env python3
"""Add small textbook-page markers to a Boya lesson PPTX.

This is a surgical OOXML patch: it reads the current PPTX, keeps every package
part unchanged except the selected slide XML files, and derives printed-page
labels from the current lesson's canonical source plus storyboard. The same
tool is used for Lesson 1 and future lessons; no lesson number or slide count
is built into the patcher.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": A_NS, "p": P_NS, "r": R_NS}
SOURCE_REF_RE = re.compile(r"\b[A-Z]+\d{1,3}-\d{3}\b")
CJK_FONT = "KaiTi"
LATIN_FONT = "Times New Roman"

ET.register_namespace("a", A_NS)
ET.register_namespace("p", P_NS)
ET.register_namespace("r", R_NS)

EMU_PER_INCH = 914400


def qname(namespace: str, local_name: str) -> str:
    return f"{{{namespace}}}{local_name}"


def read_page_map(source_path: Path, storyboard_path: Path) -> dict[int, str]:
    source = json.loads(source_path.read_text(encoding="utf-8"))
    exercises = {item["record_id"]: item for item in source["exercises"]}
    page_map: dict[int, str] = {}
    missing_refs: list[str] = []

    with storyboard_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows:
        refs = SOURCE_REF_RE.findall(row.get("source_refs", ""))
        if not refs:
            continue

        pages: list[int] = []
        for ref in refs:
            item = exercises.get(ref)
            if item is None:
                missing_refs.append(ref)
                continue
            raw_pages = item.get("textbook_printed_pages")
            if raw_pages is None:
                raw_pages = item.get("textbook_printed_page")
            if isinstance(raw_pages, list):
                pages.extend(int(page) for page in raw_pages)
            else:
                pages.append(int(raw_pages))

        if not pages:
            continue

        unique_pages = sorted(set(pages))
        page_chunks: list[str] = []
        chunk_start = unique_pages[0]
        chunk_end = unique_pages[0]
        for page in unique_pages[1:]:
            if page == chunk_end + 1:
                chunk_end = page
                continue
            page_chunks.append(
                str(chunk_start)
                if chunk_start == chunk_end
                else f"{chunk_start}–{chunk_end}"
            )
            chunk_start = chunk_end = page
        page_chunks.append(
            str(chunk_start)
            if chunk_start == chunk_end
            else f"{chunk_start}–{chunk_end}"
        )

        slide_no = int(row["slide_no"])
        suffix = "、".join(page_chunks)
        # Keep a compact page code visible even in PDF viewers that cannot
        # display the deck's Chinese font: e.g. "教材 P2" or "教材 P6–7".
        page_map[slide_no] = f"教材 P{suffix}"

    if missing_refs:
        raise ValueError(f"Storyboard references missing canonical exercises: {sorted(set(missing_refs))}")
    if not page_map:
        raise ValueError("No textbook-page markers were derived from the storyboard")
    return page_map


def next_shape_id(sp_tree: ET.Element) -> int:
    ids = []
    for c_nv_pr in sp_tree.findall(".//p:cNvPr", NS):
        try:
            ids.append(int(c_nv_pr.attrib["id"]))
        except (KeyError, ValueError):
            continue
    return max(ids, default=0) + 1


def make_marker_shape(shape_id: int, slide_no: int, label: str) -> ET.Element:
    shape = ET.Element(qname(P_NS, "sp"))

    nv_sp_pr = ET.SubElement(shape, qname(P_NS, "nvSpPr"))
    ET.SubElement(
        nv_sp_pr,
        qname(P_NS, "cNvPr"),
        {"id": str(shape_id), "name": f"Textbook Page Marker {slide_no:02d}"},
    )
    ET.SubElement(nv_sp_pr, qname(P_NS, "cNvSpPr"))
    ET.SubElement(nv_sp_pr, qname(P_NS, "nvPr"))

    sp_pr = ET.SubElement(shape, qname(P_NS, "spPr"))
    xfrm = ET.SubElement(sp_pr, qname(A_NS, "xfrm"))
    ET.SubElement(
        xfrm,
        qname(A_NS, "off"),
        {
            "x": str(round(10.95 * EMU_PER_INCH)),
            "y": str(round(7.12 * EMU_PER_INCH)),
        },
    )
    ET.SubElement(
        xfrm,
        qname(A_NS, "ext"),
        {
            "cx": str(round(2.10 * EMU_PER_INCH)),
            "cy": str(round(0.20 * EMU_PER_INCH)),
        },
    )
    prst_geom = ET.SubElement(sp_pr, qname(A_NS, "prstGeom"), {"prst": "rect"})
    ET.SubElement(prst_geom, qname(A_NS, "avLst"))
    ET.SubElement(sp_pr, qname(A_NS, "noFill"))
    ET.SubElement(sp_pr, qname(A_NS, "ln"))

    tx_body = ET.SubElement(shape, qname(P_NS, "txBody"))
    ET.SubElement(
        tx_body,
        qname(A_NS, "bodyPr"),
        {
            "wrap": "square",
            "lIns": "0",
            "tIns": "0",
            "rIns": "0",
            "bIns": "0",
            "rtlCol": "0",
            "anchor": "ctr",
        },
    )
    body_pr = tx_body.find(qname(A_NS, "bodyPr"))
    if body_pr is not None:
        ET.SubElement(body_pr, qname(A_NS, "normAutofit"))
    ET.SubElement(tx_body, qname(A_NS, "lstStyle"))

    paragraph = ET.SubElement(tx_body, qname(A_NS, "p"))
    ET.SubElement(
        paragraph,
        qname(A_NS, "pPr"),
        {"marL": "0", "indent": "0", "algn": "r"},
    )
    paragraph.find(qname(A_NS, "pPr"))
    p_pr = paragraph.find(qname(A_NS, "pPr"))
    if p_pr is not None:
        ET.SubElement(p_pr, qname(A_NS, "buNone"))

    run = ET.SubElement(paragraph, qname(A_NS, "r"))
    r_pr = ET.SubElement(
        run,
        qname(A_NS, "rPr"),
        {"lang": "zh-CN", "altLang": "en-US", "sz": "900", "dirty": "0"},
    )
    solid_fill = ET.SubElement(r_pr, qname(A_NS, "solidFill"))
    ET.SubElement(solid_fill, qname(A_NS, "srgbClr"), {"val": "61736F"})
    latin_attrs = {"typeface": LATIN_FONT, "pitchFamily": "34"}
    cjk_attrs = {"typeface": CJK_FONT, "pitchFamily": "34"}
    ET.SubElement(r_pr, qname(A_NS, "latin"), {**latin_attrs, "charset": "0"})
    ET.SubElement(r_pr, qname(A_NS, "ea"), {**cjk_attrs, "charset": "-122"})
    ET.SubElement(r_pr, qname(A_NS, "cs"), {**latin_attrs, "charset": "-120"})
    ET.SubElement(run, qname(A_NS, "t")).text = label
    ET.SubElement(
        paragraph,
        qname(A_NS, "endParaRPr"),
        {"lang": "zh-CN", "sz": "900", "dirty": "0"},
    )
    return shape


def patch_slide(xml_bytes: bytes, slide_no: int, label: str) -> bytes:
    root = ET.fromstring(xml_bytes)
    sp_tree = root.find(".//p:spTree", NS)
    if sp_tree is None:
        raise ValueError(f"Slide {slide_no} has no shape tree")

    for shape in list(sp_tree.findall("p:sp", NS)):
        c_nv_pr = shape.find("p:nvSpPr/p:cNvPr", NS)
        if c_nv_pr is not None and c_nv_pr.attrib.get("name", "").startswith("Textbook Page Marker "):
            sp_tree.remove(shape)

    shape = make_marker_shape(next_shape_id(sp_tree), slide_no, label)
    ext_lst = sp_tree.find("p:extLst", NS)
    if ext_lst is None:
        sp_tree.append(shape)
    else:
        sp_tree.insert(list(sp_tree).index(ext_lst), shape)
    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def patch_pptx(input_path: Path, output_path: Path, page_map: dict[int, str]) -> None:
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Input and output PPTX paths must be different")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(input_path, "r") as source_zip, zipfile.ZipFile(
        output_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as output_zip:
        for info in source_zip.infolist():
            data = source_zip.read(info.filename)
            match = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", info.filename)
            if match and int(match.group(1)) in page_map:
                data = patch_slide(data, int(match.group(1)), page_map[int(match.group(1))])
            output_zip.writestr(info, data)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Add textbook printed-page markers to a Boya lesson PPTX.")
    parser.add_argument("--input", type=Path, required=True, help="Current draft PPTX; never an approved file")
    parser.add_argument("--output", type=Path, required=True, help="Marked draft PPTX output path")
    parser.add_argument("--source", type=Path, required=True, help="Current lesson canonical source JSON")
    parser.add_argument("--storyboard", type=Path, required=True, help="Current lesson storyboard CSV")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    page_map = read_page_map(args.source, args.storyboard)
    patch_pptx(args.input, args.output, page_map)
    print(json.dumps({"marker_count": len(page_map), "slides": page_map}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
