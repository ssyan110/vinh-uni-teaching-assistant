#!/usr/bin/env python3
"""Apply the lesson-01 online-PPT feedback without rebuilding the deck.

The approved online deck is the structural base.  This patcher is the
repeatable post-generation step for future online-draft generation, so manual
PowerPoint edits are not needed for these feedback rules.
"""
from __future__ import annotations

import argparse
import copy
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
ET.register_namespace("a", A)
ET.register_namespace("p", P)
ET.register_namespace("r", R)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx"
DEFAULT_OUTPUT = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/online/lesson-01-在线预习.pptx"

def q(ns, tag): return f"{{{ns}}}{tag}"
def slide_name(n): return f"ppt/slides/slide{n}.xml"
def rel_name(n): return f"ppt/slides/_rels/slide{n}.xml.rels"
def notes_name(n): return f"ppt/notesSlides/notesSlide{n}.xml"
def notes_rel_name(n): return f"ppt/notesSlides/_rels/notesSlide{n}.xml.rels"
def shape_text(shape): return "".join((x.text or "") for x in shape.iter(q(A, "t")))
def shapes(root): return root.iter(q(P, "sp"))

def set_shape_text(shape, value):
    nodes = list(shape.iter(q(A, "t")))
    if not nodes: return
    nodes[0].text = value
    for node in nodes[1:]:
        parent = next((p for p in shape.iter() if node in list(p)), None)
        if parent is not None: parent.remove(node)

def replace_all(root, old, new):
    count = 0
    for shape in shapes(root):
        if shape_text(shape) == old:
            set_shape_text(shape, new); count += 1
    return count

def replace_contains(root, old, new):
    count = 0
    for shape in shapes(root):
        value = shape_text(shape)
        if old in value:
            set_shape_text(shape, value.replace(old, new)); count += 1
    return count

def find_shape(root, predicate):
    return next((shape for shape in shapes(root) if predicate(shape_text(shape))), None)

def ensure_green_explanation(root, explanation):
    """Add a standalone green explanation line, using the approved slide-53 style."""
    existing = find_shape(root, lambda value: value.startswith("说明："))
    if existing is not None:
        set_shape_text(existing, explanation)
        return
    template = find_shape(roots_for_template, lambda value: value.startswith("说明："))
    if template is None:
        raise ValueError("No approved green explanation shape is available")
    new_shape = copy.deepcopy(template)
    set_shape_text(new_shape, explanation)
    tree = root.find(f".//{q(P, 'spTree')}")
    if tree is None: raise ValueError("Slide has no shape tree")
    tree.insert(max(0, len(list(tree)) - 1), new_shape)

roots_for_template = {}

def remove_empty_extensions(root):
    count = 0
    for shape in list(shapes(root)):
        if shape_text(shape).strip() == "扩展：":
            parent = next((p for p in root.iter() if shape in list(p)), None)
            if parent is not None: parent.remove(shape); count += 1
    return count

def patch_slide_numbers(root, old, new):
    return replace_all(root, str(old), str(new))

def insert_duplicate(parts, order, source_slide=61, new_slide=73):
    original = ET.fromstring(parts[slide_name(source_slide)])
    duplicate = copy.deepcopy(original)
    replace_all(duplicate, "61", "62")
    replace_all(duplicate, "毕业", "见面")
    replace_all(duplicate, "说明：表示完成学校学习。", "说明：见+人+面。")
    replace_all(duplicate, "大学毕业以后，我想找工作。", "毕业以后，我想和同学见面。")
    parts[slide_name(new_slide)] = ET.tostring(duplicate, encoding="utf-8", xml_declaration=True)
    slide_rels = ET.fromstring(parts[rel_name(source_slide)])
    for rel in list(slide_rels):
        if rel.get("Type", "").endswith("/notesSlide"):
            slide_rels.remove(rel)
    parts[rel_name(new_slide)] = ET.tostring(slide_rels, encoding="utf-8", xml_declaration=True)

    pres = ET.fromstring(parts["ppt/presentation.xml"])
    rels = ET.fromstring(parts["ppt/_rels/presentation.xml.rels"])
    ids = []
    for rel in rels:
        if rel.tag == q(REL, "Relationship") and rel.get("Id", "").startswith("rId"):
            try: ids.append(int(rel.get("Id")[3:]))
            except ValueError: pass
    new_rid = f"rId{max(ids) + 1}"
    ET.SubElement(rels, q(REL, "Relationship"), {"Id": new_rid, "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", "Target": "slides/slide73.xml"})
    rel_map = {x.get("Id"): x.get("Target") for x in rels}
    target_rid = next(k for k, v in rel_map.items() if v == "slides/slide62.xml")
    sld = pres.find(f".//{q(P, 'sldIdLst')}")
    ids_nodes = list(sld)
    insert_at = next(i for i, node in enumerate(ids_nodes) if node.get(q(R, "id")) == target_rid)
    template_id = max(int(node.get("id")) for node in ids_nodes) + 1
    new_node = ET.Element(q(P, "sldId"), {"id": str(template_id), q(R, "id"): new_rid})
    sld.insert(insert_at, new_node)
    parts["ppt/presentation.xml"] = ET.tostring(pres, encoding="utf-8", xml_declaration=True)
    parts["ppt/_rels/presentation.xml.rels"] = ET.tostring(rels, encoding="utf-8", xml_declaration=True)
    ct = ET.fromstring(parts["[Content_Types].xml"])
    ET.SubElement(ct, q("http://schemas.openxmlformats.org/package/2006/content-types", "Override"), {"PartName": "/ppt/slides/slide73.xml", "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"})
    parts["[Content_Types].xml"] = ET.tostring(ct, encoding="utf-8", xml_declaration=True)
    order.insert(insert_at, new_slide)

def main():
    global roots_for_template
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    ap.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = ap.parse_args()
    parts = {}
    with zipfile.ZipFile(args.input) as z:
        parts = {info.filename: z.read(info.filename) for info in z.infolist()}
    roots = {n: ET.fromstring(parts[slide_name(n)]) for n in range(1, 73)}
    roots_for_template = roots[53]
    extensions = {"独生女": "“独生子”是指家里唯一的儿子；“独生女”是指家里唯一的女儿。", "满意": "用法：对……满意／满意+事物", "受欢迎": "用法：受+人+（的）欢迎；“的”可以不加。", "放假": "放+时间数量词+假，表示放假的时长，也就是“放多久假”。例如：放五天假、放一个星期假。", "越来越": "越来越+形容词／心理动词，表示程度随着时间不断变化、加强。", "照片": "也可以说“相片”。", "空儿": "常用短语：有空儿、没空儿。"}
    changed = []
    for n in range(5, 42):
        root = roots[n]
        title = next((shape_text(s) for s in shapes(root) if shape_text(s) in extensions), None)
        if title:
            for shape in shapes(root):
                if shape_text(shape) == "扩展：": set_shape_text(shape, f"扩展：{extensions[title]}")
            changed.append(title)
        else: remove_empty_extensions(root)
    replace_all(roots[46], "为什么有压力？", "为什么她有时候很晚才能睡觉？")
    replace_all(roots[46], "丽丽怎样工作？", "她的工作态度怎么样？")
    replace_all(roots[48], "她喜欢什么爱好：", "她有哪些爱好：")
    replace_all(roots[48], "这项爱好带来什么帮助：", "哪个爱好对她的工作有帮助：")
    replace_all(roots[51], "例句1：我出生在河内。", "例句1：我出生在河内。")
    ensure_green_explanation(roots[51], "说明：出生在+地方")
    replace_all(roots[56], "例句1：我从星期一到星期五上课。", "例句1：我从星期一到星期五上课。")
    ensure_green_explanation(roots[56], "说明：表示时间、地点或范围的起点和终点。")
    replace_all(roots[56], "例句2：商店从早上九点到晚上九点开门。", "例句2：从河内到胡志明市很远。")
    replace_all(roots[57], "为了+目的", "说明：为了+目的")
    ensure_green_explanation(roots[57], "说明：为了+目的")
    replace_contains(roots[62], "放+时量+假", "说明：放+时间数量词+假")
    ensure_green_explanation(roots[62], "说明：放+时间数量词+假，表示放假的时长，也就是“放多久假”。")
    replace_all(roots[61], "毕业／见面", "毕业")
    ensure_green_explanation(roots[61], "说明：表示完成学校学习。")
    for n in range(62, 73): patch_slide_numbers(roots[n], n, n + 1)
    for n, root in roots.items(): parts[slide_name(n)] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    order = list(range(1, 73)); insert_duplicate(parts, order)
    slide73 = ET.fromstring(parts[slide_name(73)])
    ensure_green_explanation(slide73, "说明：见+人+面。")
    parts[slide_name(73)] = ET.tostring(slide73, encoding="utf-8", xml_declaration=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED) as out:
        for name, data in parts.items(): out.writestr(name, data)
    print({"output": str(args.output), "slides": 73, "vocabulary_extensions": changed, "split_expression": "毕业／见面 → 毕业 + 见面"})

if __name__ == "__main__": main()
