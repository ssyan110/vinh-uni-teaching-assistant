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
PATH_TOKEN_RE = re.compile(r"([^\.\[\]]+)|\[(\d+)\]")
CJK_FONT = "KaiTi"
LATIN_FONT = "Times New Roman"

ET.register_namespace("a", A_NS)
ET.register_namespace("p", P_NS)
ET.register_namespace("r", R_NS)

EMU_PER_INCH = 914400
MARKER_FONT_SIZE_HUNDREDTHS = 2000


def qname(namespace: str, local_name: str) -> str:
    return f"{{{namespace}}}{local_name}"


def _page_numbers(value: object) -> list[int]:
    if value is None:
        return []
    if isinstance(value, (int, float)):
        return [int(value)]
    if isinstance(value, list):
        pages: list[int] = []
        for item in value:
            pages.extend(_page_numbers(item))
        return pages
    return [int(match) for match in re.findall(r"\d+", str(value))]


def _section_lookup(source: dict[str, object]) -> dict[str, object]:
    sections = source.get("sections", [])
    if isinstance(sections, dict):
        return sections
    if isinstance(sections, list):
        return {
            str(item.get("id")): item
            for item in sections
            if isinstance(item, dict) and item.get("id")
        }
    return {}


def _resolve_ref(source: dict[str, object], ref: str) -> list[object]:
    """Return the traversed nodes for a canonical ref, deepest first usable."""
    path = ref.split("#", 1)[1] if "#" in ref else ref
    # Source refs may preserve the source-package filename before the fragment
    # (for example ``source-extraction-draft.json#sections.short_text_1``).
    # Only the fragment is authoritative for page lookup; do not force a
    # canonical-source rewrite just to satisfy an older storyboard.
    selector = re.fullmatch(r"audio_map\[(?:track_label|label|track)=(.+)\]", path)
    if selector:
        wanted = selector.group(1).strip("'\"")
        audio_map = source.get("audio_map", [])
        if isinstance(audio_map, list):
            matches = [
                item for item in audio_map
                if isinstance(item, dict)
                and wanted in {
                    str(item.get("track_label", "")),
                    str(item.get("label", "")),
                    str(item.get("track", "")),
                    str(item.get("audio", "")),
                    str(item.get("id", "")),
                }
            ]
        audio_mapping = source.get("audio_mapping", [])
        mapping_matches: list[object] = []
        if isinstance(audio_mapping, list):
            mapping_matches = [
                item for item in audio_mapping
                if isinstance(item, dict)
                and wanted in {str(item.get("track", "")), str(item.get("label", ""))}
            ]
        return matches + mapping_matches
    if path.startswith("sections."):
        path = path[len("sections."):]
        lookup = _section_lookup(source)
        first, _, remainder = path.partition(".")
        if first not in lookup:
            # Older extraction snapshots used broad section names such as
            # ``common_expressions`` while canonical sources split them into
            # several topic sections. Resolve all matching canonical sections
            # and let page lookup union their printed pages.
            candidates = [
                item for key, item in lookup.items()
                if key.startswith(f"{first}_")
            ]
            if candidates and not remainder:
                return list(reversed(candidates))
            if candidates and remainder:
                resolved: list[object] = []
                for candidate in candidates:
                    value: object = candidate
                    for name, index in PATH_TOKEN_RE.findall(remainder):
                        if index:
                            if not isinstance(value, list):
                                break
                            position = int(index)
                            if position >= len(value):
                                position -= 1
                            if position < 0 or position >= len(value):
                                break
                            value = value[position]
                        elif isinstance(value, dict) and name in value:
                            value = value[name]
                        else:
                            break
                    else:
                        resolved.append(value)
                return list(reversed(resolved))
        current: object = lookup
    elif path.startswith("sections["):
        current = source.get("sections", [])
    else:
        exercises = source.get("exercises", [])
        legacy = {
            str(item.get("record_id")): item
            for item in exercises
            if isinstance(item, dict) and item.get("record_id")
        } if isinstance(exercises, list) else {}
        return [legacy[ref]] if ref in legacy else []

    nodes: list[object] = [current]
    for name, index in PATH_TOKEN_RE.findall(path):
        if index:
            if not isinstance(current, list):
                return nodes
            position = int(index)
            if position >= len(current):
                # Source refs generally use one-based content ordinals.
                position -= 1
            if position < 0 or position >= len(current):
                return nodes
            current = current[position]
        else:
            if isinstance(current, dict):
                if name not in current:
                    return nodes
                current = current[name]
            elif isinstance(current, list):
                match = next((item for item in current if isinstance(item, dict) and item.get("id") == name), None)
                if match is None:
                    return nodes
                current = match
            else:
                return nodes
        nodes.append(current)
    return list(reversed(nodes))


def _pages_for_ref(source: dict[str, object], ref: str) -> list[int]:
    pages: list[int] = []
    for node in _resolve_ref(source, ref):
        if isinstance(node, dict):
            for key in ("textbook_printed_pages", "textbook_printed_page", "printed_pages", "printed_page"):
                found = _page_numbers(node.get(key))
                if found:
                    pages.extend(found)
                    break
    return sorted(set(pages))


def _slide_number(row: dict[str, str]) -> int | None:
    for key in ("slide_no", "slide_number", "slide"):
        value = str(row.get(key, "")).strip()
        if value.isdigit():
            return int(value)
    return None


def read_page_map(source_path: Path, storyboard_path: Path) -> dict[int, str]:
    source = json.loads(source_path.read_text(encoding="utf-8"))
    # Lesson 1's approved source manifest predates structured ``sections``;
    # its read-only extraction snapshot contains the same printed-page map.
    # Use that snapshot only as a lookup adapter and never write it back.
    if not source.get("sections"):
        fallback_path = source_path.parent / "source-extraction-draft.json"
        if fallback_path.is_file():
            fallback = json.loads(fallback_path.read_text(encoding="utf-8"))
            source = {**fallback, **source}
            if fallback.get("sections"):
                source["sections"] = fallback["sections"]
            if fallback.get("audio_mapping"):
                source["audio_mapping"] = fallback["audio_mapping"]
    page_map: dict[int, str] = {}
    missing_refs: list[str] = []
    missing_slide_numbers = 0

    with storyboard_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows:
        raw_refs = row.get("source_refs") or row.get("source_ref") or ""
        refs = [ref.strip() for ref in re.split(r"[;,]\s*", raw_refs) if ref.strip()]
        if not refs:
            continue
        slide_no = _slide_number(row)
        if slide_no is None:
            missing_slide_numbers += 1
            continue

        derived_pages: list[int] = []
        for ref in refs:
            ref_pages = _pages_for_ref(source, ref)
            if not ref_pages:
                # Keep the legacy record-id path for older source packages.
                legacy_match = SOURCE_REF_RE.fullmatch(ref)
                if legacy_match:
                    missing_refs.append(ref)
                else:
                    missing_refs.append(ref)
                continue
            derived_pages.extend(ref_pages)

        # Current lesson source-ref inventories may carry a narrower
        # slide-level page scope than the canonical section-level pages. Use
        # that explicit scope when present, while still resolving every
        # source_ref and rejecting a page that falls outside its source.
        explicit_pages = _page_numbers(
            row.get("source_pages")
            or row.get("textbook_printed_pages")
            or row.get("printed_pages")
        )
        if explicit_pages:
            if derived_pages and not all(
                min(derived_pages) <= page <= max(derived_pages)
                for page in explicit_pages
            ):
                raise ValueError(
                    f"Storyboard page scope {explicit_pages} falls outside source refs {sorted(set(derived_pages))}"
                )
            pages = explicit_pages
        else:
            pages = derived_pages

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

        suffix = "、".join(page_chunks)
        # Keep a compact page code visible even in PDF viewers that cannot
        # display the deck's Chinese font: e.g. "教材 P2" or "教材 P6–7".
        page_map[slide_no] = f"教材 P{suffix}"

    if missing_slide_numbers and not page_map:
        raise ValueError(
            "Storyboard has source refs but no slide number column; use a current storyboard with "
            "slide_no, slide_number, or slide"
        )
    if missing_refs:
        raise ValueError(f"Storyboard references missing canonical source records: {sorted(set(missing_refs))}")
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
            "x": str(round(10.25 * EMU_PER_INCH)),
            "y": str(round(6.98 * EMU_PER_INCH)),
        },
    )
    ET.SubElement(
        xfrm,
        qname(A_NS, "ext"),
        {
            "cx": str(round(2.80 * EMU_PER_INCH)),
            "cy": str(round(0.32 * EMU_PER_INCH)),
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
        {"lang": "zh-CN", "altLang": "en-US", "sz": str(MARKER_FONT_SIZE_HUNDREDTHS), "dirty": "0"},
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
        {"lang": "zh-CN", "sz": str(MARKER_FONT_SIZE_HUNDREDTHS), "dirty": "0"},
    )
    return shape


def patch_slide(xml_bytes: bytes, slide_no: int, label: str) -> bytes:
    root = ET.fromstring(xml_bytes)
    sp_tree = root.find(".//p:spTree", NS)
    if sp_tree is None:
        raise ValueError(f"Slide {slide_no} has no shape tree")

    for shape in list(sp_tree.findall("p:sp", NS)):
        c_nv_pr = shape.find("p:nvSpPr/p:cNvPr", NS)
        name = "" if c_nv_pr is None else c_nv_pr.attrib.get("name", "")
        text = "".join(node.text or "" for node in shape.findall(".//a:t", NS))
        xfrm = shape.find("./p:spPr/a:xfrm", NS)
        off = xfrm.find("a:off", NS) if xfrm is not None else None
        try:
            x = int(off.attrib.get("x", "0")) if off is not None else 0
            y = int(off.attrib.get("y", "0")) if off is not None else 0
        except (TypeError, ValueError):
            x = y = 0
        looks_like_existing_marker = text.startswith("教材 P") and x >= 9 * EMU_PER_INCH and y >= 6.5 * EMU_PER_INCH
        if name.startswith("Textbook Page Marker ") or looks_like_existing_marker:
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
