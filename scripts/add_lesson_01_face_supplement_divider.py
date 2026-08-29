#!/usr/bin/env python3
"""Add the missing divider before Lesson 1's supplemental listening slides."""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def main(source: Path, output: Path) -> None:
    with ZipFile(source) as zin:
        files = {name: zin.read(name) for name in zin.namelist()}
    presentation = ET.fromstring(files["ppt/presentation.xml"])
    rels = ET.fromstring(files["ppt/_rels/presentation.xml.rels"])
    targets = {r.attrib["Id"]: r.attrib["Target"] for r in rels}
    slide_ids = presentation.find(f"{{{P_NS}}}sldIdLst")
    if slide_ids is None or len(slide_ids) != 51:
        raise ValueError("Expected the 51-slide Lesson 1 face-to-face draft")

    divider_rel = next(r for r in rels if r.attrib.get("Target") == "slides/slide5.xml")
    max_slide = 51
    max_id = max(int(e.attrib["id"]) for e in slide_ids)
    max_rid = max(int(r.attrib["Id"][3:]) for r in rels if r.attrib.get("Id", "").startswith("rId") and r.attrib["Id"][3:].isdigit())
    new_slide_number = max_slide + 1
    new_rel_id = f"rId{max_rid + 1}"
    new_slide_id = str(max_id + 1)
    files[f"ppt/slides/slide{new_slide_number}.xml"] = files["ppt/slides/slide5.xml"]
    rels.append(ET.Element(f"{{{REL_NS}}}Relationship", {
        "Id": new_rel_id,
        "Type": divider_rel.attrib["Type"],
        "Target": f"slides/slide{new_slide_number}.xml",
    }))
    insert_at = 49  # before the existing slide 50 (audio 1-7)
    divider = ET.Element(f"{{{P_NS}}}sldId", {"id": new_slide_id, f"{{{R_NS}}}id": new_rel_id})
    slide_ids.insert(insert_at, divider)
    files["ppt/presentation.xml"] = ET.tostring(presentation, encoding="utf-8", xml_declaration=True)
    files["ppt/_rels/presentation.xml.rels"] = ET.tostring(rels, encoding="utf-8", xml_declaration=True)

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(prefix="lesson-01-face-", suffix=".pptx", dir=output.parent, delete=False) as tmp:
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
        manifest.update({
            "lesson_key": "boya-quasi-intermediate-i:lesson-01",
            "mode": "face-to-face",
            "slide_count": 52,
            "status": "draft_reordered_with_supplement_divider",
            "output": str(output),
            "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        })
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    import sys
    main(Path(sys.argv[1]), Path(sys.argv[2]))
