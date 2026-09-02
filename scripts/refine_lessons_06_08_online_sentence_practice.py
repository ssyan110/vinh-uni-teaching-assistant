"""Rebuild the Lesson 06-08 online sentence-practice units from the L05 style.

This is deliberately lesson-scoped and draft-only. It reads the current online
draft, removes only the existing sentence-practice slides, then inserts the
same divider and one-pattern-per-slide structure used by the approved Lesson
05 online deck. It does not modify canonical source, authority, or release.
"""

from copy import deepcopy
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE


ROOT = Path("/Users/ssyan110/Development/vinh-uni-teaching-assistant")
REFERENCE = ROOT / "lessons/boya-quasi-intermediate-i/lesson-05/20-approved/pptx/lesson-05-在线预习.pptx"
TEXTBOOK = "boya-quasi-intermediate-i"
CHINESE_LESSON_NUMBERS = {6: "六", 7: "七", 8: "八"}
BASE_DECKS = {
    6: ROOT / "lessons/boya-quasi-intermediate-i/lesson-06/20-approved/pptx/lesson-06-在线预习.pptx",
    7: ROOT / "lessons/boya-quasi-intermediate-i/lesson-07/20-approved/pptx/lesson-07-在线预习.pptx",
}
RECOVERED_L08_BASE = ROOT / ".tmp-l08-clean-base.pptx"
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def recover_l08_base(source, destination):
    """Recover the pre-rebuild, non-sentence slides from the malformed draft ZIP."""
    keep_rids = {
        *(f"rId{i}" for i in range(2, 47)),
        *(f"rId{i}" for i in range(48, 54)),
        *(f"rId{i}" for i in range(55, 60)),
        "rId82",
    }
    ET.register_namespace("p", P_NS)
    ET.register_namespace("r", R_NS)
    ET.register_namespace("", REL_NS)
    with ZipFile(source) as source_zip:
        first_entries = {}
        for info in source_zip.infolist():
            first_entries.setdefault(info.filename, info)
        presentation = ET.fromstring(source_zip.read(first_entries["ppt/presentation.xml"]))
        slide_id_list = presentation.find(f"{{{P_NS}}}sldIdLst")
        for element in list(slide_id_list):
            if element.get(f"{{{R_NS}}}id") not in keep_rids:
                slide_id_list.remove(element)
        rels = ET.fromstring(source_zip.read(first_entries["ppt/_rels/presentation.xml.rels"]))
        for element in list(rels):
            if element.get("Type", "").endswith("/slide") and element.get("Id") not in keep_rids:
                rels.remove(element)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(destination, "w", ZIP_DEFLATED) as output_zip:
            for filename, info in first_entries.items():
                if filename == "ppt/presentation.xml":
                    payload = ET.tostring(presentation, encoding="utf-8", xml_declaration=True)
                elif filename == "ppt/_rels/presentation.xml.rels":
                    payload = ET.tostring(rels, encoding="utf-8", xml_declaration=True)
                else:
                    payload = source_zip.read(info)
                output_zip.writestr(filename, payload)


def texts(slide):
    return [shape.text.strip() for shape in slide.shapes if hasattr(shape, "text") and shape.text.strip()]


def set_text_preserve_style(shape, value):
    if not hasattr(shape, "text_frame"):
        return
    runs = [run for paragraph in shape.text_frame.paragraphs for run in paragraph.runs]
    if runs:
        runs[0].text = value
        for run in runs[1:]:
            run.text = ""
    else:
        shape.text = value


def set_notes(slide, value, notes_body_template):
    if slide.notes_slide.notes_text_frame is None:
        slide.notes_slide.shapes._spTree.append(deepcopy(notes_body_template._element))
    slide.notes_slide.notes_text_frame.text = value


def slide_id_element(prs, slide):
    for element in prs.slides._sldIdLst:
        if prs.part.related_part(element.rId) is slide.part:
            return element
    raise ValueError("slide relationship not found")


def remove_slide(prs, slide):
    partname = slide.part.partname
    elements = [
        element for element in list(prs.slides._sldIdLst)
        if prs.part.related_part(element.rId).partname == partname
    ]
    for element in elements:
        prs.slides._sldIdLst.remove(element)
        prs.part.drop_rel(element.rId)


def move_group_before(prs, group, anchor):
    ids = prs.slides._sldIdLst
    anchor_id = slide_id_element(prs, anchor)
    for slide in group:
        element = slide_id_element(prs, slide)
        ids.remove(element)
        ids.insert(list(ids).index(anchor_id), element)


def find_exact(prs, value, start=0):
    for index, slide in enumerate(prs.slides):
        if index < start:
            continue
        if value in texts(slide):
            return slide
    raise ValueError(f"missing slide text: {value}")


def find_after_record_anchor(prs, record_text):
    record_index = next(i for i, slide in enumerate(prs.slides) if record_text in texts(slide))
    for slide in list(prs.slides)[record_index + 1:]:
        values = texts(slide)
        if any(value == "综合练习" for value in values):
            return slide
        if any(value.startswith("我") or value.startswith("介绍") or value.startswith("你喜欢") for value in values):
            return slide
    raise ValueError(f"missing post-record anchor: {record_text}")


def clone_non_picture_shapes(source_slide, target_slide):
    for shape in source_slide.shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            continue
        target_slide.shapes._spTree.append(deepcopy(shape._element))


def add_reference_divider(prs, reference_divider, lesson_title, slide_number, picture_blob, notes_body_template):
    slide = prs.slides.add_slide(prs.slides[0].slide_layout)
    clone_non_picture_shapes(reference_divider, slide)
    if picture_blob:
        picture = next(shape for shape in reference_divider.shapes if shape.shape_type == MSO_SHAPE_TYPE.PICTURE)
        slide.shapes.add_picture(
            BytesIO(picture_blob),
            picture.left,
            picture.top,
            width=picture.width,
            height=picture.height,
        )
    for shape in slide.shapes:
        if not hasattr(shape, "text"):
            continue
        if shape.text.strip() == "第五课｜我的音乐老师":
            set_text_preserve_style(shape, lesson_title)
        elif shape.text.strip() == "40":
            set_text_preserve_style(shape, str(slide_number))
    set_notes(slide, "进入句式练习部分。", notes_body_template)
    return slide


def add_reference_pattern(prs, reference_pattern, lesson_title, slide_number, page, expression, examples, notes_body_template):
    slide = prs.slides.add_slide(prs.slides[0].slide_layout)
    clone_non_picture_shapes(reference_pattern, slide)
    expression_shapes = []
    for shape in slide.shapes:
        if not hasattr(shape, "text"):
            continue
        value = shape.text.strip()
        if value == "第五课｜我的音乐老师":
            set_text_preserve_style(shape, lesson_title)
        elif value == "41":
            set_text_preserve_style(shape, str(slide_number))
        elif value == "教材 P46":
            set_text_preserve_style(shape, page)
        elif value == "从小就":
            expression_shapes.append(shape)
        elif value.startswith("例句1："):
            set_text_preserve_style(shape, f"例句1：{examples[0]}")
        elif value.startswith("例句2："):
            set_text_preserve_style(shape, f"例句2：{examples[1]}")
        elif value == "用这个句式写出三句话":
            set_text_preserve_style(shape, "用这个句式写出三句话")
    if len(expression_shapes) != 2:
        raise ValueError(f"reference pattern title shapes: {len(expression_shapes)}")
    for shape in expression_shapes:
        set_text_preserve_style(shape, expression)
    set_notes(slide, f"常用表达 {expression}；学生先读两条例句，再准备三句话，课堂用于任务。", notes_body_template)
    return slide


def canonical_l06():
    source = json.loads((ROOT / "lessons/boya-quasi-intermediate-i/lesson-06/00-source/canonical-source.json").read_text())
    expression_section = next(section for section in source["sections"] if section["id"] == "common_expressions")
    items = []
    for group in expression_section["groups"]:
        for item in group["items"]:
            items.append((item["expression"], item["examples"][:2]))
    expected = [
        "来自", "相当", "和……相比", "对……有帮助（2）",
        "小时候", "上……的时候", "快……的时候", "……前一/几天",
        "让某人……的是", "要+动词+上+数量词", "没有那么多",
    ]
    by_expression = {expression: examples for expression, examples in items}
    if list(by_expression) != expected:
        raise ValueError(f"L06 source expression order changed: {list(by_expression)}")
    return [
        [(expression, "教材 P54", by_expression[expression]) for expression in expected[:4]],
        [(expression, "教材 P55", by_expression[expression]) for expression in expected[4:8]],
        [(expression, "教材 P57", by_expression[expression]) for expression in expected[8:]],
    ]


def canonical_l07():
    return [
        [
            ("样样都会", "教材 P62", ("大岛唱歌、弹钢琴样样都会。", "小张打球、游泳、滑冰样样都会。")),
            ("不管……都……", "教材 P62", ("不管是学习还是工作，都需要耐力。", "不管是同事还是朋友，都需要互相鼓励。")),
            ("像……一样", "教材 P62", ("工作也像登山一样，需要耐力。", "朴大宇希望自己的中文说得能像中国人一样地道。")),
        ],
        [
            ("又（2）", "教材 P63", ("朴大宇上午上课，下午又要去参观或听讲座。", "丽丽白天上班，晚上又要去学外语。")),
            ("根本", "教材 P63", ("爬山根本不像你说的那样有意思。", "来中国以前，朴大宇根本没想到街上有这么多人。")),
            ("另外", "教材 P64", ("小张最大的爱好是登山，另外也喜欢打球。", "我喜欢跑步，另外也喜欢登山。")),
            ("虽然……可是……", "教材 P64", ("虽然住在大城市，可是小张并不喜欢夜生活。", "虽然登山很累，可是我很喜欢。")),
            ("慢慢地", "教材 P64", ("丽丽慢慢适应了北方的生活。", "登山慢慢成了小张的习惯。")),
        ],
        [
            ("不仅如此", "教材 P65", ("登山让小张认识了新朋友，不仅如此，还让工作更顺利。", "画画让她觉得放松，不仅如此，对设计也有帮助。")),
            ("刚开始……慢慢地", "教材 P65", ("刚开始丽丽不习惯北方，慢慢地爱上了那里。", "刚开始我害怕登山，慢慢地有了信心。")),
            ("动词+上", "教材 P65", ("请在这儿写上你的名字和电话。", "丽丽也喜欢唱歌，我们叫上她吧。")),
            ("动词+起来", "教材 P65", ("小张笑起来真可爱。", "说起来容易，做起来就难了。")),
        ],
    ]


def canonical_l08():
    return [
        [
            ("根据", "教材 P72", ("根据学校的规定，学生们星期一要穿校服。", "根据史书的记载，春秋时期有一百多个国家。")),
            ("曾经", "教材 P72", ("朴大宇小时候曾经来过北京。", "孙武曾经当过齐国和吴国的将军。")),
            ("把……动词+成", "教材 P72", ("老师把志愿者分成两组。", "大岛希望把这部话剧翻译成日文。")),
            ("按", "教材 P72", ("李大为每天都按老师说的读课文。", "你要按将军的要求去做。")),
            ("把……动词+补语", "教材 P72", ("丽丽不小心把公司的电脑弄坏了。", "朴大宇一晚上就把这30个生词都记住了。")),
            ("虽然（2）", "教材 P72", ("虽然训练的对象是宫中的美女，可是军法还是很严明。", "虽然队长是大王的妻子，可是孙子还是按军法处死了她们。")),
        ],
        [
            ("关于", "教材 P73", ("这部电影是关于什么的？", "朴大宇喜欢看关于中国历史的电影。")),
            ("通过", "教材 P73", ("回国以后，朴大宇希望通过看书提高中文水平。", "李大为通过爸爸的同事认识了不少中国学生。")),
            ("必须", "教材 P73", ("这个专业的学生必须学习一门外语。", "要得到这份工作，必须有工作经验。")),
            ("要在……内", "教材 P73", ("要在短时间内提高听力水平不容易。", "这项工作要在一周内完成。")),
            ("既……又/也……", "教材 P73", ("李大为在中文课上既学听说写，又学书法。", "登山既可以锻炼身体，又可以放松自己。")),
            ("既不……也不……", "教材 P73", ("这本书里的文章既不长，也不短。", "这些作业既不太多，也不少，正合适。")),
        ],
        [
            ("被翻译/介绍+到/成", "教材 P74", ("《孙子兵法》被翻译介绍到国外以后，很受欢迎。", "这本书被翻译成多种语言。")),
            ("有的……有的……还有的……", "教材 P74", ("有的同学喜欢历史，有的喜欢文学，还有的喜欢音乐。", "有的国家使用中文，有的使用英文，还有的使用法文。")),
            ("除了……还/也……", "教材 P74", ("除了军事活动，还可以用在商业活动中。", "除了中国，其他国家也有很多读者。")),
            ("比如", "教材 P74", ("比如‘知彼知己，百战不殆’已经成为名句。", "我喜欢很多历史书，比如《孙子兵法》。")),
            ("已经成为", "教材 P74", ("这句话已经成为企业家们熟悉的名句。", "《孙子兵法》已经成为重要的文化作品。")),
        ],
    ]


def update_header_numbers(prs):
    for number, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if not hasattr(shape, "text"):
                continue
            if shape.left > 11.5 * 914400 and shape.top < 0.8 * 914400 and shape.text.strip().isdigit():
                set_text_preserve_style(shape, str(number))


def build(lesson_number, groups):
    lesson_id = f"lesson-{lesson_number:02d}"
    deck = ROOT / f"lessons/{TEXTBOOK}/{lesson_id}/10-design/pptx-draft/online/{lesson_id}-在线预习.pptx"
    if "10-design/pptx-draft/online" not in str(deck):
        raise ValueError("draft-only output assertion failed")
    if lesson_number == 8:
        if not RECOVERED_L08_BASE.exists():
            recover_l08_base(deck, RECOVERED_L08_BASE)
        base_deck = RECOVERED_L08_BASE
    else:
        base_deck = BASE_DECKS[lesson_number]
    prs = Presentation(base_deck)
    reference_prs = Presentation(REFERENCE)
    reference_divider = reference_prs.slides[39]
    reference_pattern = reference_prs.slides[40]
    picture = next((shape.image.blob for shape in reference_divider.shapes if shape.shape_type == MSO_SHAPE_TYPE.PICTURE), None)
    lesson_title = next(value for value in texts(prs.slides[0]) if value.startswith(f"第{CHINESE_LESSON_NUMBERS[lesson_number]}课｜"))

    old_sentence_slides = []
    seen_sentence_parts = set()
    for slide in list(prs.slides):
        values = texts(slide)
        if lesson_number == 8:
            is_sentence = "句式练习" in values or "常用词语和表达" in values
        else:
            is_sentence = "句式练习" in values
        partname = str(slide.part.partname)
        if is_sentence and partname not in seen_sentence_parts:
            old_sentence_slides.append(slide)
            seen_sentence_parts.add(partname)
    for slide in old_sentence_slides:
        remove_slide(prs, slide)

    # Compact the package before adding slides so removed slide parts cannot
    # collide with the part names assigned to the new slides.
    compact = deck.with_suffix(".sentence-practice-compact.tmp.pptx")
    prs.save(compact)
    prs = Presentation(compact)
    compact.unlink(missing_ok=True)
    notes_body_template = next(
        shape for shape in prs.slides[0].notes_slide.shapes
        if getattr(getattr(shape, "placeholder_format", None), "idx", None) == 1
    )

    anchors = [
        find_exact(prs, "短文（二）"),
        find_exact(prs, "短文（三）"),
        find_after_record_anchor(prs, "短文三：记录练习"),
    ]
    new_groups = []
    next_number = len(prs.slides) + 1
    for group in groups:
        generated = [add_reference_divider(prs, reference_divider, lesson_title, next_number, picture, notes_body_template)]
        next_number += 1
        for expression, page, examples in group:
            generated.append(add_reference_pattern(prs, reference_pattern, lesson_title, next_number, page, expression, examples, notes_body_template))
            next_number += 1
        new_groups.append(generated)

    for generated, anchor in reversed(list(zip(new_groups, anchors))):
        move_group_before(prs, generated, anchor)

    update_header_numbers(prs)
    expected_patterns = [expression for group in groups for expression, _, _ in group]
    found_patterns = []
    for slide in prs.slides:
        values = texts(slide)
        if "用这个句式写出三句话" in values:
            matches = [expression for expression in expected_patterns if values.count(expression) >= 2]
            if len(matches) != 1:
                raise ValueError(f"pattern slide not uniquely identified: {values}")
            found_patterns.append(matches[0])
            if not any(value.startswith("例句1：") for value in values) or not any(value.startswith("例句2：") for value in values):
                raise ValueError(f"pattern slide missing two examples: {values}")
    if found_patterns != expected_patterns:
        raise ValueError(f"L{lesson_number:02d} pattern order mismatch: {found_patterns} != {expected_patterns}")
    old_form_tokens = {
        "常用词语和表达",
        "课本例句",
        "请用这个句式说1句中文。",
        "说明一个人在很多方面都会做。",
    }
    if any(old_form_tokens.intersection(texts(slide)) for slide in prs.slides):
        raise ValueError("old sentence-practice form remains")
    if prs.slide_width != 12192000 or prs.slide_height != 6858000:
        raise ValueError("deck is not 16:9")

    tmp = deck.with_suffix(".sentence-practice.tmp.pptx")
    prs.save(tmp)
    tmp.replace(deck)
    return {
        "lesson_key": f"{TEXTBOOK}:{lesson_id}",
        "deck": str(deck),
        "removed_slides": len(old_sentence_slides),
        "slide_count": len(prs.slides),
        "pattern_count": len(found_patterns),
        "pattern_order": found_patterns,
        "sha256": sha256(deck.read_bytes()).hexdigest(),
        "bytes": deck.stat().st_size,
        "source_status": "unchanged_pending_review",
    }


if __name__ == "__main__":
    results = [build(6, canonical_l06()), build(7, canonical_l07()), build(8, canonical_l08())]
    for result in results:
        print(json.dumps(result, ensure_ascii=False))
