#!/usr/bin/env python3
"""Apply Adam's scoped Lesson 09 online-PPTX content corrections.

This edits the existing draft in place through a temporary PPTX, preserving
all non-target slide text and the existing layout family. It intentionally
does not rebuild the deck from the lesson generator.
"""

from __future__ import annotations

import hashlib
import os
import tempfile
import zipfile
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "lessons/boya-quasi-intermediate-i/lesson-09/10-design/pptx-draft/online/lesson-09-在线预习.pptx"
EARLY_TEA = ROOT / "lessons/boya-quasi-intermediate-i/lesson-09/10-design/assets/l09-context-early-tea-street-food.png"

VOCAB = {
    5: ("土豆", "tǔdòu", "名词", "khoai tây", "我喜欢吃土豆。", "这家餐厅的土豆很好吃。"),
    6: ("蔬菜", "shūcài", "名词", "rau củ", "每天吃蔬菜对身体有好处。", "我晚餐常吃蔬菜。"),
    7: ("早茶", "zǎochá", "名词", "trà buổi sáng kèm món ăn nhẹ", "广州人常常一起喝早茶。", "我周末喜欢和朋友喝早茶。"),
    8: ("凉拌", "liángbàn", "动词", "trộn nguội; trộn nguyên liệu rồi ăn nguội", "夏天我常吃凉拌菜。", "凉拌黄瓜很清爽。"),
    9: ("青菜", "qīngcài", "名词", "rau xanh; rau lá xanh", "妈妈每天都做青菜。", "我喜欢吃清炒青菜。"),
    11: ("酸辣汤", "suānlàtāng", "名词", "canh chua cay", "这家饭馆的酸辣汤很好喝。", "天气冷时，我想喝一碗酸辣汤。"),
    12: ("涮", "shuàn", "动词", "nhúng nhanh vào nước lẩu", "冬天我们常涮羊肉。", "我喜欢在火锅里涮肉片。"),
    13: ("口味", "kǒuwèi", "名词", "khẩu vị", "南方人的口味比较清淡。", "我的口味不太重。"),
    14: ("渐渐", "jiànjiàn", "副词", "dần dần", "我渐渐习惯了这里的口味。", "天气渐渐变冷了。"),
    15: ("黄瓜", "huángguā", "名词", "dưa chuột", "这根黄瓜很新鲜。", "我把黄瓜切成小片。"),
    17: ("炖", "dùn", "动词", "hầm; ninh", "妈妈喜欢炖鸡汤。", "这锅汤要炖一个小时。"),
    18: ("夜宵", "yèxiāo", "名词", "đồ ăn khuya; bữa ăn khuya", "晚上十点以后，我不吃夜宵。", "他下班后常去吃夜宵。"),
    19: ("大排档", "dàpáidàng", "名词", "quán ăn đường phố bình dân", "我们晚上去大排档吃饭。", "这家大排档晚上人很多。"),
    20: ("聚会", "jùhuì", "动词", "tụ họp; gặp mặt", "我们周末常常聚会。", "同学们毕业后还会聚会。"),
    21: ("聚餐", "jùcān", "动词", "cùng nhau ăn một bữa; ăn chung", "今晚我们一起聚餐。", "我们星期六中午和同学聚餐。"),
    23: ("休闲", "xiūxián", "动词", "thư giãn; giải trí", "散步是很好的休闲方式。", "休闲活动让人放松。"),
    24: ("豆角", "dòujiǎo", "名词", "đậu đũa", "我喜欢吃豆角。", "豆角可以炒鸡蛋。"),
    25: ("不光", "bùguāng", "连词", "không chỉ", "这家饭馆不光菜好吃，服务也很好。", "她不光会做饭，还会做甜点。"),
    26: ("取代", "qǔdài", "动词", "thay thế hoàn toàn; làm cho cái cũ mất vị trí", "手机逐渐取代了传统相机。", "电子书正在取代纸质书。"),
    27: ("季节", "jìjié", "名词", "mùa", "不同季节有不同的蔬菜。", "春天是我最喜欢的季节。"),
    29: ("种类", "zhǒnglèi", "名词", "loại; chủng loại", "这家店的菜种类很多。", "我想试试不同种类的面条。"),
    30: ("普遍", "pǔbiàn", "形容词", "phổ biến; có ở nhiều nơi", "在这里，周末聚餐很普遍。", "手机支付现在很普遍。"),
    31: ("年轻", "niánqīng", "形容词", "trẻ; trẻ tuổi", "年轻人喜欢尝试新口味。", "她看起来比实际年龄年轻。"),
    32: ("一般", "yìbān", "副词", "thường; thông thường", "我一般在家吃早餐。", "我一般六点半起床。"),
    33: ("数量", "shùliàng", "名词", "số lượng", "今年参加活动的人数量增加了。", "这家店每天接待的顾客数量很多。"),
    35: ("增加", "zēngjiā", "动词", "tăng; tăng lên; làm tăng", "这家餐馆增加了几个新菜。", "运动可以增加体力。"),
    36: ("方式", "fāngshì", "名词", "cách thức; cách làm", "每个人都有自己的休闲方式。", "我们用不同的方式学习。"),
}

EXTENSIONS = {
    5: "扩展：一些中国南方地区和台湾常叫“马铃薯”。",
    8: "扩展：凉拌＋菜名，例如：凉拌黄瓜、凉拌木耳。",
    9: "扩展：通常指绿色的菜。",
    12: "扩展：涮＋食物名，例如：涮羊肉、涮肉片。",
    13: "扩展：口味＋形容词，例如：我口味比较重，柠檬口味酸。",
    14: "扩展：常用结构：渐渐＋动词／形容词，例如：天气渐渐变冷了。\n我渐渐喜欢上这里了。\n他渐渐明白了老师的意思。",
    18: "扩展：台湾常说“宵夜”。",
    19: "扩展：台湾常说“路边摊”。",
    20: "扩展：常见短语：参加聚会、举办聚会。\n名称＋聚会，例如：同学聚会、老师聚会、朋友聚会。",
    21: "扩展：常用结构：和＋人＋聚餐，例如：我们星期六中午和同学聚餐。",
    23: "扩展：常用来修饰名词，例如：休闲时间、休闲方式、休闲活动。",
    25: "扩展：常用结构：不光……，还／也……。也可以说“不只A，还／也B”。",
    26: "扩展：取代：A把B换下去了，B不再被使用或地位变低。例如：手机逐渐取代了传统相机。\n替代：没有B，可以用A来换。B不一定消失，只是可以换成A。例如：没有牛奶，可以用豆浆替代。",
    27: "扩展：可以加名词修饰，例如：芒果季、雨季、冬季、毕业季。",
    29: "扩展：“……＋种＋东西”，表示某一种或几种事物。\n这／那＋种＋东西：这种水果不甜。\n数量＋种＋东西：我想买两种青菜。\n“种”表示事物的种类。",
    32: "扩展：一般：普通、常见的，没有特别的地方。例如：我一般六点下班。\n普遍：很多人、很多地方都有这种情况。例如：手机支付现在很普遍。",
    35: "扩展：反义词是“减少”。",
    36: "扩展：方式：怎么做、以什么形式做，如付款方式、学习方式、生活方式。\n方法：为了达到目的，具体怎么做，如学习方法、解决问题的方法。",
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def shape_by_name(slide, name: str):
    for shape in slide.shapes:
        if shape.name == name:
            return shape
    raise ValueError(f"missing shape {name!r}")


def set_all_script_fonts(run, font_name: str, size: int, color: str, bold: bool = False, lang: str = "zh-CN"):
    run.font.name = font_name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._r.get_or_add_rPr()
    rpr.set(qn("a:lang"), lang)
    for tag in ("a:latin", "a:ea", "a:cs"):
        child = rpr.find(qn(tag))
        if child is None:
            child = OxmlElement(tag)
            rpr.append(child)
        child.set("typeface", font_name)


def set_first_run_text(shape, text: str):
    paragraphs = shape.text_frame.paragraphs
    if not paragraphs or not paragraphs[0].runs:
        shape.text = text
        return
    paragraphs[0].runs[0].text = text
    for paragraph in paragraphs:
        for run in paragraph.runs[1:]:
            run._r.getparent().remove(run._r)
    for paragraph in paragraphs[1:]:
        paragraph._p.getparent().remove(paragraph._p)


def set_meaning(shape, meaning: str):
    tf = shape.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    label = p.add_run()
    label.text = "意思："
    set_all_script_fonts(label, "KaiTi", 21, "14282D")
    value = p.add_run()
    value.text = meaning
    set_all_script_fonts(value, "Times New Roman", 21, "14282D", lang="vi-VN")


def set_examples(shape, first: str, second: str):
    tf = shape.text_frame
    tf.clear()
    for index, text in enumerate((f"例句1：{first}", f"例句2：{second}")):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(0)
        run = p.add_run()
        run.text = text
        set_all_script_fonts(run, "KaiTi", 22, "14282D", bold=True)


def set_extension(shape, text: str):
    tf = shape.text_frame
    tf.clear()
    for index, line in enumerate(text.split("\n")):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(0)
        run = p.add_run()
        run.text = line
        set_all_script_fonts(run, "KaiTi", 20, "3C8F86", bold=True)
    shape.top = Inches(5.28)
    shape.height = Inches(1.28)


def replace_slide_text(slide, old: str, new: str):
    for shape in slide.shapes:
        if not getattr(shape, "has_text_frame", False):
            continue
        for paragraph in shape.text_frame.paragraphs:
            for run in paragraph.runs:
                if old in run.text:
                    run.text = run.text.replace(old, new)


def slide_texts(prs):
    result = {}
    for number, slide in enumerate(prs.slides, 1):
        result[number] = [shape.text for shape in slide.shapes if getattr(shape, "has_text_frame", False)]
    return result


def notes_text(slide) -> str:
    return slide.notes_slide.notes_text_frame.text


def patch_pptx_media(source_pptx: Path, output_pptx: Path):
    with zipfile.ZipFile(source_pptx, "r") as source, zipfile.ZipFile(output_pptx, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for info in source.infolist():
            data = EARLY_TEA.read_bytes() if info.filename == "ppt/media/image6.png" else source.read(info.filename)
            output.writestr(info, data)


def main():
    if not TARGET.is_file():
        raise FileNotFoundError(TARGET)
    if not EARLY_TEA.is_file():
        raise FileNotFoundError(EARLY_TEA)

    prs = Presentation(str(TARGET))
    if len(prs.slides) != 72:
        raise ValueError(f"unexpected slide count: {len(prs.slides)}")
    before = slide_texts(prs)
    goals_before = before[3]
    if not any("听懂中国南北饮食习惯和口味的主要信息" in text for text in goals_before):
        raise ValueError("slide 3 learning-goal text does not match the current manual revision")

    vocab_slides = set(VOCAB)
    for number, (word, pinyin, pos, meaning, first, second) in VOCAB.items():
        slide = prs.slides[number - 1]
        set_first_run_text(shape_by_name(slide, "Text 4"), word)
        set_first_run_text(shape_by_name(slide, "Text 6"), word)
        set_first_run_text(shape_by_name(slide, "Text 7"), pinyin)
        set_first_run_text(shape_by_name(slide, "Text 8"), f"词类：{pos}")
        set_meaning(shape_by_name(slide, "Text 9"), meaning)
        set_examples(shape_by_name(slide, "Text 14"), first, second)
        if number in EXTENSIONS:
            set_extension(shape_by_name(slide, "Text 11"), EXTENSIONS[number])
        slide.notes_slide.notes_text_frame.text = f"词语 {word}；来源：canonical-source.json#sections.vocabulary。已补充词语例句与越南文意思；扩展内容按本课修订记录。"

    # The review slide repeats the five vocabulary images. image6.png is the
    # repeated third image, so replacing that one media part updates both the
    # vocabulary page and its review card without changing relationships.
    replace_slide_text(prs.slides[6], "早餐", "早茶")
    replace_slide_text(prs.slides[9], "早餐", "早茶")

    slide66 = prs.slides[65]
    set_first_run_text(shape_by_name(slide66, "Text 4"), "我的家乡菜")
    set_first_run_text(shape_by_name(slide66, "Text 5"), "请介绍两道你的家乡菜。")
    set_first_run_text(shape_by_name(slide66, "Text 6"), "可以说说菜名、味道和做法。")
    slide66.notes_slide.notes_text_frame.text = "学生介绍两道家乡菜；开放题不设唯一答案。"

    slide68 = prs.slides[67]
    set_first_run_text(shape_by_name(slide68, "Text 5"), "请填写课本第85页的表格。")

    slide69 = prs.slides[68]
    set_first_run_text(shape_by_name(slide69, "Text 4"), "我的越南菜介绍")
    set_first_run_text(shape_by_name(slide69, "Text 5"), "回答下面三个问题：")
    set_first_run_text(shape_by_name(slide69, "Text 7"), "喜欢和不喜欢")
    set_first_run_text(shape_by_name(slide69, "Text 8"), "你喜欢和不喜欢吃哪些越南菜？")
    set_first_run_text(shape_by_name(slide69, "Text 10"), "为什么")
    set_first_run_text(shape_by_name(slide69, "Text 11"), "为什么喜欢和不喜欢？")
    set_first_run_text(shape_by_name(slide69, "Text 13"), "中越菜的不同")
    set_first_run_text(shape_by_name(slide69, "Text 14"), "你觉得越南菜和中国菜哪里不一样？")
    set_first_run_text(shape_by_name(slide69, "Text 15"), "请说10到12句，至少100字。")
    slide69.notes_slide.notes_text_frame.text = "学生围绕越南菜的喜好、理由和中越饮食差异准备口语介绍；开放题不设唯一答案。"

    after_in_memory = slide_texts(prs)
    allowed = vocab_slides | {10, 66, 68, 69}
    for number in range(1, len(prs.slides) + 1):
        if number not in allowed and after_in_memory[number] != before[number]:
            raise ValueError(f"unexpected text change on slide {number}")
    if after_in_memory[3] != goals_before:
        raise ValueError("slide 3 learning-goal text changed")
    if "早茶" not in " ".join(after_in_memory[7]) or "早餐" in " ".join(after_in_memory[7]):
        raise ValueError("slide 7 did not become 早茶")
    if "第85页" not in " ".join(after_in_memory[68]):
        raise ValueError("slide 68 did not become textbook page 85")
    if "10到12句" not in " ".join(after_in_memory[69]) or "至少100字" not in " ".join(after_in_memory[69]):
        raise ValueError("slide 69 speaking requirement missing")

    with tempfile.TemporaryDirectory(prefix="lesson09-online-patch-", dir=str(TARGET.parent)) as temp_dir:
        temp_dir_path = Path(temp_dir)
        saved = temp_dir_path / "text-patched.pptx"
        media_patched = temp_dir_path / "media-patched.pptx"
        prs.save(str(saved))
        patch_pptx_media(saved, media_patched)
        os.replace(media_patched, TARGET)

    final = Presentation(str(TARGET))
    final_texts = slide_texts(final)
    if final_texts[3] != goals_before:
        raise ValueError("slide 3 learning-goal text changed after save")
    if "早茶" not in " ".join(final_texts[7]) or "早餐" in " ".join(final_texts[7]):
        raise ValueError("saved slide 7 is not 早茶")
    if "课本第85页" not in " ".join(final_texts[68]):
        raise ValueError("saved slide 68 page reference is wrong")
    if "10到12句" not in " ".join(final_texts[69]) or "至少100字" not in " ".join(final_texts[69]):
        raise ValueError("saved slide 69 requirement is wrong")
    print(f"patched: {TARGET}")
    print(f"sha256: {file_sha256(TARGET)}")
    print(f"slides: {len(final.slides)}")
    print("learning_goal_slide_3: preserved")
    print("vocabulary_pages: 27 updated")
    print("examples: 54 updated")
    print("extensions: 17 updated")
    print("early_tea_media: ppt/media/image6.png replaced")


if __name__ == "__main__":
    main()
