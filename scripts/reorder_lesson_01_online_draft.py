#!/usr/bin/env python3
"""Reorder the Lesson 1 online draft without changing slide contents."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def slide_number(target: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", target)
    if not match:
        raise ValueError(f"Unexpected slide target: {target}")
    return int(match.group(1))


def reorder(source: Path, output: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    if source.resolve() == output.resolve():
        raise ValueError("Source and output must be different paths")

    with ZipFile(source) as zin:
        files = {name: zin.read(name) for name in zin.namelist()}
        presentation = ET.fromstring(files["ppt/presentation.xml"])
        rels = ET.fromstring(files["ppt/_rels/presentation.xml.rels"])
        targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in rels.findall("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship")
        }
        slide_ids = presentation.find("{%(p)s}sldIdLst" % NS)
        if slide_ids is None:
            raise ValueError("Missing slide list")

        current = []
        for element in list(slide_ids):
            rid = element.attrib["{%s}id" % NS["r"]]
            target = targets[rid].lstrip("/")
            if not target.startswith("ppt/"):
                target = "ppt/" + target
            current.append((slide_number(target), element))

        if [number for number, _ in current] != list(range(1, 73)):
            raise ValueError("Expected the 72-slide Lesson 1 online deck")

        # Keep all existing content, moving only the sentence-pattern groups:
        # text 1 -> patterns P6, text 2 -> patterns P8, text 3 -> patterns P9.
        order = (
            list(range(1, 43))
            + [43, 44, 50, 51, 52, 53, 54, 55]
            + [45, 46, 56, 57, 58, 59, 60]
            + [47, 48, 61, 62, 63, 64, 65, 66]
            + [49]
            + list(range(67, 73))
        )
        by_number = {number: element for number, element in current}
        next_slide_id = max(int(element.attrib["id"]) for _, element in current) + 1
        slide_rel_by_target = {}
        for rel in rels.findall("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"):
            if rel.attrib.get("Type", "").endswith("/slide"):
                slide_rel_by_target[rel.attrib["Target"]] = rel
        next_rel_id = max(
            [int(rel.attrib["Id"][3:]) for rel in rels if rel.attrib.get("Id", "").startswith("rId") and rel.attrib["Id"][3:].isdigit()]
        ) + 1

        def duplicate_divider(source_number: int, copy_number: int, title: str | None = None):
            nonlocal next_slide_id, next_rel_id
            new_slide_number = max(number for number, _ in current) + copy_number
            new_slide_path = f"ppt/slides/slide{new_slide_number}.xml"
            source_path = f"ppt/slides/slide{source_number}.xml"
            slide_data = files[source_path]
            if title:
                slide_root = ET.fromstring(slide_data)
                for text_node in slide_root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t"):
                    if text_node.text == "听力和阅读练习":
                        text_node.text = title
                slide_data = ET.tostring(slide_root, encoding="utf-8", xml_declaration=True)
            files[new_slide_path] = slide_data
            rel_source_path = f"ppt/slides/_rels/slide{source_number}.xml.rels"
            rel_new_path = f"ppt/slides/_rels/slide{new_slide_number}.xml.rels"
            if rel_source_path in files:
                files[rel_new_path] = files[rel_source_path]
            new_rel_id = f"rId{next_rel_id}"
            next_rel_id += 1
            source_rel = slide_rel_by_target[f"slides/slide{source_number}.xml"]
            rel = ET.Element("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship", {
                "Id": new_rel_id,
                "Type": source_rel.attrib["Type"],
                "Target": f"slides/slide{new_slide_number}.xml",
            })
            rels.append(rel)
            new_slide = ET.Element("{http://schemas.openxmlformats.org/presentationml/2006/main}sldId", {
                "id": str(next_slide_id),
                "{%s}id" % NS["r"]: new_rel_id,
            })
            next_slide_id += 1
            return new_slide

        ordered_elements = []
        for number in order:
            if number == 43:
                ordered_elements.append(duplicate_divider(42, 1, "短文（一）"))
            if number == 56:
                ordered_elements.append(duplicate_divider(50, 2))
            if number == 61:
                ordered_elements.append(duplicate_divider(50, 3))
            if number == 45:
                ordered_elements.append(duplicate_divider(42, 4, "短文（二）"))
            if number == 47:
                ordered_elements.append(duplicate_divider(42, 5, "短文（三）"))
            ordered_elements.append(by_number[number])
        slide_ids[:] = ordered_elements
        files["ppt/presentation.xml"] = ET.tostring(presentation, encoding="utf-8", xml_declaration=True)
        files["ppt/_rels/presentation.xml.rels"] = ET.tostring(rels, encoding="utf-8", xml_declaration=True)

        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(prefix="lesson-01-online-", suffix=".pptx", dir=output.parent, delete=False) as tmp:
            temporary = Path(tmp.name)
        try:
            with ZipFile(temporary, "w", ZIP_DEFLATED) as zout:
                for name, data in files.items():
                    zout.writestr(name, data)
            os.replace(temporary, output)
        finally:
            if temporary.exists():
                temporary.unlink()

    manifest_path = output.parent / "manifest.json"
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["lesson_key"] = "boya-quasi-intermediate-i:lesson-01"
        manifest["mode"] = "online"
        manifest["slide_count"] = 77
        manifest["status"] = "draft_reordered_from_approved_reference"
        manifest["output"] = str(output)
        manifest["sha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    reorder(args.source, args.output)


if __name__ == "__main__":
    main()
