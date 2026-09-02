#!/usr/bin/env python3
"""Apply the 2026-08-29 online-deck refinement to a current PPTX.

The desktop deck is treated as a manually edited working copy.  This patcher
changes only the requested OOXML parts and keeps the existing notes, media,
relationships, and editable slide content intact.  It never writes to
``20-approved`` or ``40-release``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import posixpath
import re
import subprocess
import zipfile
from copy import deepcopy
from pathlib import Path
from typing import Any

from lxml import etree


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LESSON_ROOT = PROJECT_ROOT / "lessons/boya-quasi-intermediate-i/lesson-01"
REFINEMENT_PATH = LESSON_ROOT / "10-design/teaching-design/online-refinement-2026-08-29.json"
SOURCE_PATH = LESSON_ROOT / "00-source/source-extraction-draft.json"
ROUTE_ASSET = LESSON_ROOT / "10-design/image-assets-draft/learning-route-user-supplied-transparent.png"
OUTPUT_DIR = LESSON_ROOT / "10-design/pptx-draft/online"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
GATE_SCRIPT = PROJECT_ROOT / "scripts/production_gate.py"
LESSON_KEY = "boya-quasi-intermediate-i:lesson-01"
EXPECTED_ROUTE_STEPS = ["学习词语", "读／听短文", "记录摘要", "回答问题", "学习句式", "整理信息", "准备介绍自己"]

P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"p": P_NS, "a": A_NS, "r": R_NS}

ET = etree
ET.register_namespace("a", A_NS)
ET.register_namespace("p", P_NS)
ET.register_namespace("r", R_NS)

EMU_PER_INCH = 914400
CJK_FONT = "KaiTi"
LATIN_FONT = "Times New Roman"
VOCAB_SLIDES = (
    list(range(5, 10))
    + list(range(11, 16))
    + list(range(17, 22))
    + list(range(23, 28))
    + list(range(29, 34))
    + list(range(35, 39))
    + [40, 41]
)
EXPECTED_ENDING = {
    70: ["我觉得很难的地方", "写下你不太懂的词语、句式、短文或听力内容。"],
    71: [
        "课前检查",
        "我已经学完本课所有词语，知道它们的意思和用法。",
        "我已经听完本课所有听力音频。",
        "我已经为三段短文写好 5–8 句简单摘要。",
        "我已经记下听不懂的词语、句式、短文或听力。",
        "我已经学完本课所有句式，并完成每个句式的练习。",
        "我已经完成课本第十页的表格。",
        "我已经写好个人介绍，并使用至少 10 个课本词语和 5 个句式。",
        "我已经准备好在课堂介绍自己。",
    ],
    72: ["谢谢大家，我们课堂见。"],
}


def qname(namespace: str, local_name: str) -> str:
    return f"{{{namespace}}}{local_name}"


def slide_name(slide_no: int) -> str:
    return f"ppt/slides/slide{slide_no}.xml"


def relationship_name(slide_no: int) -> str:
    return f"ppt/slides/_rels/slide{slide_no}.xml.rels"


def text_of(element: etree._Element) -> str:
    return "".join(element.xpath(".//a:t/text()", namespaces=NS))


def text_shapes(root: etree._Element) -> list[etree._Element]:
    return root.xpath(".//p:sp", namespaces=NS)


def set_text(shape: etree._Element, value: str) -> None:
    text_nodes = shape.xpath(".//a:t", namespaces=NS)
    if not text_nodes:
        raise ValueError(f"Shape has no text run: {etree.tostring(shape, encoding='unicode')[:200]}")
    text_nodes[0].text = value
    for extra in text_nodes[1:]:
        parent = extra.getparent()
        if parent is not None:
            parent.remove(extra)


def set_geometry(shape: etree._Element, *, x: int | None = None, y: int | None = None,
                 cx: int | None = None, cy: int | None = None) -> None:
    xfrm = shape.find("./p:spPr/a:xfrm", NS)
    if xfrm is None:
        return
    off = xfrm.find("./a:off", NS)
    ext = xfrm.find("./a:ext", NS)
    if off is not None:
        if x is not None:
            off.set("x", str(x))
        if y is not None:
            off.set("y", str(y))
    if ext is not None:
        if cx is not None:
            ext.set("cx", str(cx))
        if cy is not None:
            ext.set("cy", str(cy))


def find_shape(root: etree._Element, *, exact: str | None = None,
               contains: str | None = None, name: str | None = None) -> etree._Element | None:
    for shape in text_shapes(root):
        c_nv_pr = shape.find("./p:nvSpPr/p:cNvPr", NS)
        if name is not None and (c_nv_pr is None or c_nv_pr.get("name") != name):
            continue
        value = text_of(shape)
        if exact is not None and value != exact:
            continue
        if contains is not None and contains not in value:
            continue
        return shape
    return None


def first_shape(*shapes: etree._Element | None) -> etree._Element | None:
    for shape in shapes:
        if shape is not None:
            return shape
    return None


def next_shape_id(sp_tree: etree._Element) -> int:
    ids: list[int] = []
    for c_nv_pr in sp_tree.xpath(".//p:cNvPr", namespaces=NS):
        try:
            ids.append(int(c_nv_pr.get("id", "0")))
        except ValueError:
            pass
    return max(ids, default=0) + 1


def insert_shape(sp_tree: etree._Element, shape: etree._Element) -> None:
    ext_lst = sp_tree.find("./p:extLst", NS)
    if ext_lst is None:
        sp_tree.append(shape)
    else:
        sp_tree.insert(list(sp_tree).index(ext_lst), shape)


def marker_shape(shape_id: int, label: str, slide_no: int) -> etree._Element:
    shape = ET.Element(qname(P_NS, "sp"))
    nv_sp_pr = ET.SubElement(shape, qname(P_NS, "nvSpPr"))
    ET.SubElement(nv_sp_pr, qname(P_NS, "cNvPr"), {
        "id": str(shape_id), "name": f"Textbook Page Marker {slide_no:02d}"
    })
    ET.SubElement(nv_sp_pr, qname(P_NS, "cNvSpPr"))
    ET.SubElement(nv_sp_pr, qname(P_NS, "nvPr"))
    sp_pr = ET.SubElement(shape, qname(P_NS, "spPr"))
    xfrm = ET.SubElement(sp_pr, qname(A_NS, "xfrm"))
    ET.SubElement(xfrm, qname(A_NS, "off"), {
        "x": str(round(10.35 * EMU_PER_INCH)),
        "y": str(round(7.02 * EMU_PER_INCH)),
    })
    ET.SubElement(xfrm, qname(A_NS, "ext"), {
        "cx": str(round(2.30 * EMU_PER_INCH)),
        "cy": str(round(0.28 * EMU_PER_INCH)),
    })
    prst = ET.SubElement(sp_pr, qname(A_NS, "prstGeom"), {"prst": "rect"})
    ET.SubElement(prst, qname(A_NS, "avLst"))
    ET.SubElement(sp_pr, qname(A_NS, "noFill"))
    ET.SubElement(sp_pr, qname(A_NS, "ln"))
    tx_body = ET.SubElement(shape, qname(P_NS, "txBody"))
    body_pr = ET.SubElement(tx_body, qname(A_NS, "bodyPr"), {
        "wrap": "square", "lIns": "0", "tIns": "0", "rIns": "0", "bIns": "0",
        "rtlCol": "0", "anchor": "ctr",
    })
    ET.SubElement(body_pr, qname(A_NS, "normAutofit"))
    ET.SubElement(tx_body, qname(A_NS, "lstStyle"))
    paragraph = ET.SubElement(tx_body, qname(A_NS, "p"))
    p_pr = ET.SubElement(paragraph, qname(A_NS, "pPr"), {"marL": "0", "indent": "0", "algn": "r"})
    ET.SubElement(p_pr, qname(A_NS, "buNone"))
    run = ET.SubElement(paragraph, qname(A_NS, "r"))
    r_pr = ET.SubElement(run, qname(A_NS, "rPr"), {
        "lang": "zh-CN", "altLang": "en-US", "sz": "2000", "dirty": "0",
    })
    solid_fill = ET.SubElement(r_pr, qname(A_NS, "solidFill"))
    ET.SubElement(solid_fill, qname(A_NS, "srgbClr"), {"val": "61736F"})
    ET.SubElement(r_pr, qname(A_NS, "latin"), {"typeface": LATIN_FONT, "pitchFamily": "34", "charset": "0"})
    ET.SubElement(r_pr, qname(A_NS, "ea"), {"typeface": CJK_FONT, "pitchFamily": "34", "charset": "-122"})
    ET.SubElement(r_pr, qname(A_NS, "cs"), {"typeface": LATIN_FONT, "pitchFamily": "34", "charset": "-120"})
    ET.SubElement(run, qname(A_NS, "t")).text = label
    ET.SubElement(paragraph, qname(A_NS, "endParaRPr"), {"lang": "zh-CN", "sz": "2000", "dirty": "0"})
    return shape


def patch_page_marker(root: etree._Element, slide_no: int, label: str) -> bool:
    sp_tree = root.find(".//p:spTree", NS)
    if sp_tree is None:
        raise ValueError(f"Slide {slide_no} has no shape tree")
    matches = [shape for shape in text_shapes(root) if text_of(shape).startswith("教材 P")]
    if matches:
        set_text(matches[0], label)
        for extra in matches[1:]:
            parent = extra.getparent()
            if parent is not None:
                parent.remove(extra)
        return True
    insert_shape(sp_tree, marker_shape(next_shape_id(sp_tree), label, slide_no))
    return False


def patch_cover(root: etree._Element) -> None:
    pill = find_shape(root, name="Shape 3")
    label = first_shape(find_shape(root, exact="在线预习"), find_shape(root, exact="实体课"), find_shape(root, exact="在线课"))
    subtitle = first_shape(find_shape(root, exact="家庭 · 工作 · 爱好"), find_shape(root, exact="听一听，问一问，说一说。"))
    if pill is None or label is None:
        raise ValueError("Current online deck does not contain the expected editable cover shapes")
    set_geometry(pill, cx=round(1.30 * EMU_PER_INCH))
    set_geometry(label, x=round(0.86 * EMU_PER_INCH), y=round(1.11 * EMU_PER_INCH),
                 cx=round(1.14 * EMU_PER_INCH), cy=round(0.30 * EMU_PER_INCH))
    set_text(label, "在线课")
    if subtitle is not None:
        parent = subtitle.getparent()
        if parent is not None:
            parent.remove(subtitle)


def patch_route(root: etree._Element) -> str:
    title = first_shape(find_shape(root, exact="学习流程图"), find_shape(root, exact="我们这样学习"))
    if title is None:
        raise ValueError("Slide 2 is missing the learning-route title shape")
    set_text(title, "学习流程图")
    for shape in list(text_shapes(root)):
        value = text_of(shape)
        if any(token in value for token in ("看词语", "读三篇短文", "每项造三句", "完成综合准备")):
            parent = shape.getparent()
            if parent is not None:
                parent.remove(shape)
    pictures = root.xpath(".//p:pic", namespaces=NS)
    for picture in pictures:
        blip = picture.find(".//a:blip", NS)
        if blip is not None and blip.get(qname(R_NS, "embed")):
            return blip.get(qname(R_NS, "embed"))
    raise ValueError("Slide 2 is missing the user-supplied route image")


def patch_extensions(roots: dict[int, etree._Element], refinement: dict[str, Any]) -> int:
    extension_label = refinement["vocabulary"]["extension_label"]
    source = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    vocabulary = next(section for section in source["sections"] if section["id"] == "vocabulary")
    words = [entry["word"] for entry in vocabulary["entries"]]
    words.extend(entry["word"] for entry in vocabulary.get("proper_nouns", []))
    if len(words) != len(VOCAB_SLIDES):
        raise ValueError(f"Vocabulary/source slide count mismatch: {len(words)} words vs {len(VOCAB_SLIDES)} slides")
    word_by_slide = dict(zip(VOCAB_SLIDES, words))
    extensions = refinement["vocabulary"].get("extensions", {})
    template: etree._Element | None = None
    added = 0
    for slide_no in VOCAB_SLIDES:
        root = roots[slide_no]
        sp_tree = root.find(".//p:spTree", NS)
        if sp_tree is None:
            raise ValueError(f"Slide {slide_no} has no shape tree")
        matches = [shape for shape in text_shapes(root) if "扩展" in text_of(shape)]
        expansion = str(extensions.get(word_by_slide[slide_no], "") or "").strip()
        if not expansion:
            for extra in matches:
                parent = extra.getparent()
                if parent is not None:
                    parent.remove(extra)
            continue
        if matches:
            set_text(matches[0], f"{extension_label}{expansion}")
            for extra in matches[1:]:
                parent = extra.getparent()
                if parent is not None:
                    parent.remove(extra)
            continue
        if template is None:
            for candidate_slide in VOCAB_SLIDES:
                for shape in text_shapes(roots[candidate_slide]):
                    if "扩展" in text_of(shape):
                        template = deepcopy(shape)
                        break
                if template is not None:
                    break
        if template is None:
            raise ValueError("No existing vocabulary extension shape is available as an editable template")
        new_shape = deepcopy(template)
        c_nv_pr = new_shape.find("./p:nvSpPr/p:cNvPr", NS)
        if c_nv_pr is None:
            raise ValueError(f"Extension template on slide {slide_no} has no non-visual properties")
        c_nv_pr.set("id", str(next_shape_id(sp_tree)))
        c_nv_pr.set("name", f"Text Extension {slide_no:02d}")
        set_text(new_shape, f"{extension_label}{expansion}")
        insert_shape(sp_tree, new_shape)
        added += 1
    return added


def normalize_fonts(root: etree._Element) -> tuple[int, int]:
    changed_fonts = 0
    raised_sizes = 0
    for r_pr in root.xpath(".//a:rPr|.//a:defRPr|.//a:endParaRPr", namespaces=NS):
        raw_size = r_pr.get("sz")
        if raw_size:
            try:
                if int(raw_size) < 2000:
                    r_pr.set("sz", "2000")
                    raised_sizes += 1
            except ValueError:
                pass
        for tag, typeface in (("latin", LATIN_FONT), ("ea", CJK_FONT), ("cs", LATIN_FONT)):
            child = r_pr.find(f"./a:{tag}", NS)
            if child is None:
                child = ET.SubElement(r_pr, qname(A_NS, tag))
            if child.get("typeface") != typeface:
                child.set("typeface", typeface)
                changed_fonts += 1
    return changed_fonts, raised_sizes


def normalize_theme(root: etree._Element) -> tuple[int, int]:
    changed_fonts = 0
    for font_group in root.xpath(".//a:majorFont|.//a:minorFont", namespaces=NS):
        for tag, typeface in (("latin", LATIN_FONT), ("ea", CJK_FONT), ("cs", LATIN_FONT)):
            child = font_group.find(f"./a:{tag}", NS)
            if child is None:
                child = ET.SubElement(font_group, qname(A_NS, tag))
            if child.get("typeface") != typeface:
                child.set("typeface", typeface)
                changed_fonts += 1
        for child in font_group.findall("./a:font", NS):
            script = child.get("script", "")
            desired = CJK_FONT if script in {"Hans", "Hant"} else LATIN_FONT if script == "Viet" else child.get("typeface")
            if desired and child.get("typeface") != desired:
                child.set("typeface", desired)
                changed_fonts += 1
    return changed_fonts, 0


def parse_route_target(rel_bytes: bytes, embed: str) -> str:
    root = ET.fromstring(rel_bytes)
    for rel in root:
        if rel.get("Id") != embed:
            continue
        target = rel.get("Target")
        if not target:
            break
        return posixpath.normpath(posixpath.join("ppt/slides", target))
    raise ValueError(f"Slide 2 image relationship {embed} is missing")


def ending_texts(root: etree._Element) -> list[str]:
    return [text_of(shape) for shape in text_shapes(root) if text_of(shape)]


def assert_ending(roots: dict[int, etree._Element]) -> None:
    for slide_no, required in EXPECTED_ENDING.items():
        actual = ending_texts(roots[slide_no])
        missing = [value for value in required if value not in actual]
        if missing:
            raise ValueError(f"Slide {slide_no} does not match the fixed ending contract; missing {missing}")


def run_gate() -> dict[str, Any]:
    command = [
        os.environ.get("BOYA_PYTHON", "python3"),
        str(GATE_SCRIPT),
        "--purpose", "pptx",
        "--output-dir", str(OUTPUT_DIR),
    ]
    result = subprocess.run(command, cwd=PROJECT_ROOT, text=True, capture_output=True, check=False)
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        payload = {"status": "unknown", "raw_output": result.stdout, "stderr": result.stderr}
    payload["command"] = " ".join(command)
    payload["returncode"] = result.returncode
    if result.returncode != 0 and os.environ.get("BOYA_RECOVERY_REBUILD") != "1":
        raise RuntimeError(
            "Production gate blocked the PPTX draft. Set BOYA_RECOVERY_REBUILD=1 only for an explicitly reviewed recovery.\n"
            + result.stdout
        )
    return payload


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def patch_pptx(input_path: Path, output_path: Path, refinement: dict[str, Any]) -> dict[str, Any]:
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Input and output PPTX paths must be different")
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if not ROUTE_ASSET.is_file():
        raise FileNotFoundError(ROUTE_ASSET)
    if refinement.get("learning_route", {}).get("steps") != EXPECTED_ROUTE_STEPS:
        raise ValueError("Learning-route steps do not match the confirmed online-prep flow")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    gate = run_gate()
    roots: dict[int, etree._Element] = {}
    raw_parts: dict[str, bytes] = {}
    route_embed = ""
    route_media_name = ""
    with zipfile.ZipFile(input_path, "r") as source_zip:
        for slide_no in range(1, 73):
            data = source_zip.read(slide_name(slide_no))
            roots[slide_no] = ET.fromstring(data)
        roots[1] = roots[1]
        roots[2] = roots[2]
        route_embed = patch_route(roots[2])
        route_media_name = parse_route_target(source_zip.read(relationship_name(2)), route_embed)

        patch_cover(roots[1])
        extension_added = patch_extensions(roots, refinement)
        marker_existing = 0
        marker_added = 0
        page_markers = {int(key): value for key, value in refinement["page_markers"].items()}
        for slide_no, label in page_markers.items():
            if patch_page_marker(roots[slide_no], slide_no, label):
                marker_existing += 1
            else:
                marker_added += 1

        font_changes = 0
        raised_sizes = 0
        for root in roots.values():
            changed, raised = normalize_fonts(root)
            font_changes += changed
            raised_sizes += raised

        for info in source_zip.infolist():
            data = source_zip.read(info.filename)
            raw_parts[info.filename] = data

    # Apply the user-supplied route image to the existing relationship target.
    raw_parts[route_media_name] = ROUTE_ASSET.read_bytes()

    for theme_name in [name for name in raw_parts if name.startswith("ppt/theme/") and name.endswith(".xml")]:
        theme_root = ET.fromstring(raw_parts[theme_name])
        changed, _ = normalize_theme(theme_root)
        font_changes += changed
        raw_parts[theme_name] = ET.tostring(theme_root, encoding="UTF-8", xml_declaration=True, standalone=True)

    if "ppt/presentation.xml" in raw_parts:
        presentation_root = ET.fromstring(raw_parts["ppt/presentation.xml"])
        changed, raised = normalize_fonts(presentation_root)
        font_changes += changed
        raised_sizes += raised
        raw_parts["ppt/presentation.xml"] = ET.tostring(presentation_root, encoding="UTF-8", xml_declaration=True, standalone=True)

    for slide_no, root in roots.items():
        raw_parts[slide_name(slide_no)] = ET.tostring(root, encoding="UTF-8", xml_declaration=True, standalone=True)

    assert_ending(roots)

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as output_zip:
        with zipfile.ZipFile(input_path, "r") as source_zip:
            for info in source_zip.infolist():
                output_zip.writestr(info, raw_parts[info.filename])

    return {
        "input": str(input_path),
        "output": str(output_path),
        "slide_count": 72,
        "cover": "entity_cover_reused_with_online_label",
        "learning_route": {
            "asset": str(ROUTE_ASSET.relative_to(PROJECT_ROOT)),
            "relationship_target": route_media_name,
            "sha256": hashlib.sha256(ROUTE_ASSET.read_bytes()).hexdigest(),
        },
        "extensions": {
            "policy": refinement["vocabulary"]["extension_policy"],
            "label": refinement["vocabulary"]["extension_label"],
            "added_blank_placeholders": extension_added,
            "invented_text_removed": True,
        },
        "page_markers": {
            "updated_existing": marker_existing,
            "added_missing": marker_added,
            "map": {str(key): value for key, value in sorted(page_markers.items())},
        },
        "ending": "fixed_slides_70_71_72_verified",
        "fonts": {
            "cjk": CJK_FONT,
            "latin": LATIN_FONT,
            "minimum_visible_pt": 20,
            "font_attributes_normalized": font_changes,
            "sub_20pt_runs_raised": raised_sizes,
        },
        "production_gate": gate,
        "sha256": sha256(output_path),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Current manually edited PPTX working copy")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR / "lesson-01-在线预习.pptx")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    refinement = json.loads(REFINEMENT_PATH.read_text(encoding="utf-8"))
    if refinement.get("lesson_key") != LESSON_KEY:
        raise ValueError("Online refinement metadata has the wrong lesson_key")
    input_path = args.input.expanduser().resolve()
    output_path = (args.output if args.output.is_absolute() else PROJECT_ROOT / args.output).resolve()
    report = patch_pptx(input_path, output_path, refinement)
    manifest = {
        "artifact": "lesson-01-在线预习",
        "status": "draft_refined_from_user_working_copy",
        "title": "丽丽是独生女",
        "format": "native_pptx",
        "slide_count": report["slide_count"],
        "output": str(output_path.relative_to(PROJECT_ROOT)),
        "input_working_copy": str(input_path),
        "refinement": str(REFINEMENT_PATH.relative_to(PROJECT_ROOT)),
        "report": report,
        "generated_at": "2026-08-29",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
