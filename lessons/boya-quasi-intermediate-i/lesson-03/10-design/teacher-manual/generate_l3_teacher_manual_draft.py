from pathlib import Path
import json
import hashlib
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "lessons/boya-quasi-intermediate-i/lesson-03/00-source"
CANONICAL = SRC_DIR / "canonical-source.json"
AUDIO_MANIFEST = SRC_DIR / "audio-manifest.json"

canonical = json.loads(CANONICAL.read_text(encoding="utf-8"))
audio_manifest = json.loads(AUDIO_MANIFEST.read_text(encoding="utf-8"))
lesson_key = canonical["lesson_key"]
title = canonical["title"]

def short_audio_rows():
    rows = []
    for track in canonical["audio_map"]:
        label = track["label"]
        pages = {
            "3-1": "P22–P23", "3-2": "P23–P24", "3-3": "P24–P25",
            "3-4": "P25–P26", "3-5": "P26–P28", "3-6": "P28–P29",
        }[label]
        rows.append((label, pages, f"{track['duration_seconds']:.1f} 秒", track["semantic_status"]))
    return rows

def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    for row in rows:
        out.append("| " + " | ".join(str(x).replace("|", "\\|").replace("\n", "；") for x in row) + " |")
    return "\n".join(out)

def text_questions(sec):
    ex = sec["exercises"]
    lines = []
    for name, values in ex.items():
        if isinstance(values, list):
            lines.append((name, values))
        elif isinstance(values, str):
            lines.append((name, [values]))
    return lines

md = []
md.append(f"# 第三课《{title}》教师手册草案")
md.append("")
md.append(md_table(["项目", "内容"], [
    ("lesson_key", lesson_key),
    ("教材", "《博雅汉语听说：准中级加速篇 I》"),
    ("课题", title),
    ("教材范围", "主教材印刷 P22–P31；答案／听力文本 PDF 文件第 11–13 页"),
    ("状态", "来源批准后的教师手册草案，未批准；L3 PPTX draft 已生成但尚未登记为 authority"),
    ("内容边界", "严格依据 canonical source、听力题契约与已确认素材整理；不新增教材内容。后续 PPTX 一旦批准，手册只能对齐 PPTX，不得另行改写"),
]))
md.append("")
md.append("## 使用文件与权威顺序")
md.append("")
md.append("1. 本课来源权威：`00-source/canonical-source.json`（来源内容、教材页码、词语、短文、题目与答案政策）。")
md.append("2. 听力题组契约：`00-source/listening-exercise-contract.json`（题组顺序、音频编号、页码范围与 coverage 引用）。")
md.append("3. 图片候选仅作视觉支持：`10-design/assets/image-manifest.json` 与 `visual-brief-draft.md`；候选素材尚未进入 PPTX。")
md.append("4. 当前已有第三课线上／实体 PPTX draft，但尚未登记为 authority。升格后，批准 PPTX 的文字、页面顺序、音频放置与教材页码标记优先；本草案不得反向覆盖 PPTX。")
md.append("")
md.append("## 来源与内容盘点（已批准范围）")
md.append("")
inv = canonical["content_inventory"]
md.append(md_table(["项目", "数量／范围"], [
    ("一般词语", inv["vocabulary_count"]),
    ("语言专名", inv["proper_noun_count"]),
    ("词语理解", f"{inv['vocabulary_comprehension_group_count']} 组／{inv['vocabulary_comprehension_item_count']} 项"),
    ("听句子判断", f"{inv['listening_sentence_item_count']} 项"),
    ("听说短文", f"{inv['texts_dialogues_count']} 段（3-4、3-5、3-6）"),
    ("常用表达", f"{inv['grammar_pattern_count']} 项"),
    ("听力题组", f"{inv['listening_exercise_group_count']} 组"),
    ("综合练习", f"{inv['comprehensive_exercise_count']} 项"),
    ("结构化练习总数", inv["exercise_count"]),
]))
md.append("")
md.append("## 暂定 Can-Do（须与正式课时及 PPT 边界一起批准）")
md.append("")
md.append("- Interpretive：学生听懂三段关于接触中文、选修中文和中文课堂的主要信息，能回答教材第一遍／第二遍问题，并用来源中的细节核对理解。")
md.append("- Interpersonal：学生围绕家庭经历、语言选择和中文学习经验提问、回答、请求重复、确认理解，并在小组中补充同伴信息。")
md.append("- Presentational：学生使用本课词语和常用表达，介绍自己何时开始对中文有兴趣、为什么选修中文及学习中的收获；按教材要求完成 6–10 句、60–80 字的口头产出。")
md.append("- 以上为教学重组草案，不是已批准课时表；正式实体课时、线上／实体内容边界和评量门槛待人工确认。")
md.append("")
md.append("## 线上／实体边界（结构已确认，课时待确认）")
md.append("")
md.append("- 线上预习建议承载：25 个词语与拼音预览、三段短文的第一次阅读／听力准备、教材题目预读、关键词记录，以及个人中文学习经历提纲。")
md.append("- 实体课建议承载：听力理解核对、词语理解题、判断题、短文问答、小组补充与总结、请求重复和个人口语发表。")
md.append("- 上述分配沿用第一课已确认的线上／实体结构，正式实体课时与来源批准仍待确认；线上学习不折抵实体课。")
md.append("")
md.append("## 暂定实体课流程（不写死分钟数）")
md.append("")
md.append("正式课时尚未批准，以下只提供可由 PPT 页面承载的顺序；每段时间、分组与转场待确认。")
flow_rows = [
    ("A", "词语与听词识别", "词语 3-1；3-2 三组图片词语；学生先听、选择、跟读，再用词语说个人例句。", "教材 P22–P24"),
    ("B", "听句子判断", "3-3 听句子判断对错；学生先看 12 个判断句，听后记录，再以教材答案核对。", "教材 P24–P25"),
    ("C", "短文一：开始接触汉语并产生一定的兴趣", "3-4 听第一遍答题、第二遍用完整句回答、个人介绍李大为并与教材短文比较。", "教材 P25–P26"),
    ("D", "短文二：为什么选修中文", "3-5 按同一听力动作完成问答，说明转学、语言选择与交流／文化动机。", "教材 P26–P28"),
    ("E", "短文三：中文课", "3-6 关注声调、汉字、重复、互相帮助和越来越好；小组先说、补充、最后总结。", "教材 P28–P29"),
    ("F", "综合练习与拓展", "根据三段短文填表，完成小组谈话，再谈自己的中文兴趣、选修原因和学习方法。", "教材 P30–P31"),
]
md.append(md_table(["段落", "主题", "学生产出／动作", "教材页码"], flow_rows))
md.append("")
md.append("## 音频与教材页码")
md.append("")
md.append("六段音频均已完成文件存在、SHA-256、MP3 解码与时长技术核对；教师逐段语义听核及 PPT 实际播放仍待完成。")
md.append("")
md.append(md_table(["音频", "教材范围", "时长", "当前状态"], short_audio_rows()))
md.append("")
md.append("听力操作统一采用：先看题目，抓关键词；再听并记录重点；最后回答与核对。音频编号只能按 3-1 至 3-6 使用，不把音频编号当作教材题号。")
md.append("")
md.append("## 词语覆盖（每词一页的 PPT 要求）")
md.append("")
vocab_rows = []
for e in canonical["sections"][0]["entries"]:
    pos = e.get("pos") or "来源未标注"
    vocab_rows.append((e["no"], e["word"], e["pinyin"], pos, e["gloss"]))
for i, e in enumerate(canonical["sections"][0]["proper_nouns"], 1):
    vocab_rows.append((f"专名{i}", e["word"], e["pinyin"], "来源未标注", e["gloss"]))
md.append(md_table(["序号", "词语", "拼音", "词类", "来源释义（仅供教师核对）"], vocab_rows))
md.append("")
md.append("学生端每页词语固定包含：词语、拼音、词类、使用场合、用法、例句、扩展用法和图片；例句与扩展必须来自已批准 PPT 或 canonical source，不另造与教材冲突的内容。")
md.append("")
md.append("## 教材练习与口语产出 coverage")
md.append("")
md.append("下表把 canonical source 中的所有练习列出，答案只在来源有闭合答案时记录；开放题保留学生产出，不制造唯一标准答案。")
coverage = [
    ("3-2", "词语理解", "3 组／10 项", "选择图片并标序号，第二遍跟读", "闭合答案已与答案 PDF 核对"),
    ("3-3", "听句子判断", "12 项", "判断对错", "闭合答案已与答案 PDF 核对"),
    ("3-4（一）", "短文一第一遍", "4 题", "简单回答：人物、招待、中文程度、是否上课", "开放口语；按来源文本核对"),
    ("3-4（二）", "短文一第二遍", "3 题", "用两三个句子回答，不少于 20 字", "开放口语；不补唯一答案"),
    ("3-4（三）", "短文一介绍", "1 项", "介绍李大为，6–8 句、不少于 60 字", "开放口语；观察词语与信息覆盖"),
    ("3-4（四）", "短文一比较", "1 项", "读教材短文，与自己的介绍比较", "开放比较；教师提示"),
    ("3-5（一）", "短文二第一遍", "3 题", "回答德语、来访者、选修内容", "开放口语；按来源文本核对"),
    ("3-5（二）", "短文二第二遍", "3 题", "使用括号词语说两三个句子，不少于 20 字", "开放口语；不补唯一答案"),
    ("3-5（三）", "短文二介绍", "1 项", "说明为什么决定选修中文，6–8 句、不少于 60 字", "开放口语；观察因果与细节"),
    ("3-5（四）", "短文二比较", "1 项", "读教材短文，与自己的说明比较", "开放比较；教师提示"),
    ("3-6（一）", "短文三第一遍", "4 题", "回答难易、画画儿、教师、兴趣", "开放口语；按来源文本核对"),
    ("3-6（二）", "短文三第二遍", "3 题", "使用括号词语说两三个句子，不少于 20 字", "开放口语；不补唯一答案"),
    ("3-6（三）", "短文三小组练习", "1 项", "先说 4–6 句，组员补充，最后总结 6–8 句", "开放小组产出；无唯一答案"),
    ("3-6（四）", "短文三比较", "1 项", "读教材短文，与小组说法比较", "开放比较；教师提示"),
    ("综合练习 1", "三段短文填表", "1 项", "根据听过的三段短文填表", "开放表格；教师现场核对"),
    ("综合练习 2", "小组谈话与总结", "1 项", "按三项主题先说、补充、总结", "开放口语；无唯一答案"),
    ("综合练习 3", "拓展练习", "1 项", "谈自己何时开始对中文有兴趣、为什么选修、在国内怎么学中文", "开放口语；无唯一答案"),
]
md.append(md_table(["来源编号", "板块", "数量", "学生动作／产出", "答案政策"], coverage))
md.append("")
md.append("## 三段短文的教师核对摘要")
md.append("")
for sec_id in ["short_text_1", "short_text_2", "short_text_3"]:
    sec = next(s for s in canonical["sections"] if s["id"] == sec_id)
    md.append(f"### {sec['audio']}《{sec['title']}》｜教材 P{sec['printed_pages'][0]}–P{sec['printed_pages'][-1]}")
    md.append(f"- 听力文本：{sec['text']}")
    md.append("- 第一遍问题：" + "；".join(sec["exercises"]["first_listen"]))
    md.append("- 第二遍问题：" + "；".join(sec["exercises"]["second_listen"]))
    extra = sec["exercises"].get("present") or sec["exercises"].get("group")
    if extra:
        md.append("- 口语产出要求：" + extra)
    md.append("- 比较／答案：开放产出按来源文本核对；不把示例比较段落当作全班唯一答案。")
    md.append("")
md.append("## 常用表达覆盖")
md.append("")
for sec in [s for s in canonical["sections"] if s["id"].startswith("common_expressions")]:
    md.append(f"### {sec['topic']}｜教材 P{sec['printed_pages'][0]}–P{sec['printed_pages'][-1]}")
    for item in sec["items"]:
        md.append(f"- {item['expression']}：" + "；".join(item["examples"]))
    md.append("")
md.append("## 教师执行提示与答案政策")
md.append("")
md.append("- 先让学生完成听、说、比较或总结，再用来源中的词语与句式做短修补；不以逐词翻译替代任务。")
md.append("- 3-2 的选择答案和 3-3 的判断答案可按答案 PDF 核对；其余短文问答、个人介绍、比较、填表、小组总结和拓展练习均没有唯一标准答案。")
md.append("- 不把图片候选中的人物外貌、人数、身份或地点当成教材事实；图片只服务词义、情境、比较或记忆。")
md.append("- 若音频不能播放，记录音频编号与故障；不要自行换用其他课次或另一本教材的音频。")
md.append("- 正式实体课时、分组、恢复路线、量表与课后任务均待确认；不得用固定 6 节／300 分钟替代正式课表。")
md.append("")
md.append("## Blocker report")
md.append("")
md.append("- 当前已有 L3 PPTX draft，但本手册尚未完成 authority PPTX 对齐或最终交付。")
md.append("- 3-1 至 3-6 尚未完成教师逐段语义听核与 PowerPoint 实际播放测试。")
md.append("- PBI 教学重组、正式实体课时、线上／实体边界、配套材料、storyboard、Visual storyboard、6 张 prototype、QA 与 release 仍待后续 gate。")
md.append("- 本文件不得写入 `20-approved/` 或 `40-release/`；仅供教师手册制作与审核使用。")

md_path = OUT / "lesson-03-教师手册-draft.md"
md_path.write_text("\n".join(md), encoding="utf-8")

def set_font(run, size=12, bold=False, color="17324D"):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for key, value in (("w:ascii", "Times New Roman"), ("w:hAnsi", "Times New Roman"), ("w:cs", "Times New Roman"), ("w:eastAsia", "KaiTi")):
        rfonts.set(qn(key), value)
    # Explicitly mark Han runs as Simplified Chinese.  This keeps KaiTi as
    # the East Asian face and prevents PDF exporters from treating the run as
    # Latin-only text with missing CJK glyphs.
    lang = rpr.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        rpr.append(lang)
    lang.set(qn("w:val"), "zh-CN")
    lang.set(qn("w:eastAsia"), "zh-CN")

def add_p(doc, text="", size=12, bold=False, style=None, color="17324D"):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.08
    r = p.add_run(text)
    set_font(r, size=size, bold=bold, color=color)
    return p

def add_table(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        r = p.add_run(str(h)); set_font(r, size=10, bold=True, color="FFFFFF")
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd"); shd.set(qn("w:fill"), "476A86"); tcPr.append(shd)
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(str(val)); set_font(r, size=10)
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            tcMar = tcPr.first_child_found_in("w:tcMar")
            if tcMar is None:
                tcMar = OxmlElement("w:tcMar"); tcPr.append(tcMar)
            for side in ("top", "left", "bottom", "right"):
                node = tcMar.find(qn(f"w:{side}"))
                if node is None:
                    node = OxmlElement(f"w:{side}"); tcMar.append(node)
                node.set(qn("w:w"), "90"); node.set(qn("w:type"), "dxa")
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.75); sec.bottom_margin = Inches(0.75); sec.left_margin = Inches(0.8); sec.right_margin = Inches(0.8)
normal = doc.styles["Normal"]
normal.font.name = "Times New Roman"; normal.font.size = Pt(12); normal.font.color.rgb = RGBColor.from_string("17324D")
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "KaiTi")
normal._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
normal._element.rPr.rFonts.set(qn("w:cs"), "Times New Roman")
normal_lang = normal._element.rPr.find(qn("w:lang"))
if normal_lang is None:
    normal_lang = OxmlElement("w:lang")
    normal._element.rPr.append(normal_lang)
normal_lang.set(qn("w:val"), "zh-CN")
normal_lang.set(qn("w:eastAsia"), "zh-CN")
for name, size in (("Heading 1", 16), ("Heading 2", 14), ("Heading 3", 13)):
    st = doc.styles[name]; st.font.name = "Times New Roman"; st.font.size = Pt(size); st.font.bold = True; st.font.color.rgb = RGBColor.from_string("17324D"); st._element.rPr.rFonts.set(qn("w:eastAsia"), "KaiTi")
    st._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    st._element.rPr.rFonts.set(qn("w:cs"), "Times New Roman")
    st_lang = st._element.rPr.find(qn("w:lang"))
    if st_lang is None:
        st_lang = OxmlElement("w:lang")
        st._element.rPr.append(st_lang)
    st_lang.set(qn("w:val"), "zh-CN")
    st_lang.set(qn("w:eastAsia"), "zh-CN")

add_p(doc, f"第三课《{title}》教师手册草案", size=20, bold=True, color="234E70")
add_p(doc, f"{lesson_key}｜来源批准范围已确认｜教师手册草案，未批准", size=11, color="476A86")
add_p(doc, "本手册严格整理当前来源包。第三课已有 PPTX draft 但尚未登记为 authority；后续 PPTX 获批后，批准 PPTX 的页面文字、顺序、音频和教材页码标记优先，本手册只做对齐，不另行制作一套内容。", size=12)

def heading(text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}"); p.paragraph_format.space_before = Pt(10); p.paragraph_format.space_after = Pt(5)
    r = p.add_run(text); set_font(r, size={1:16, 2:14, 3:13}[level], bold=True, color="234E70")

heading("一、使用文件与权威顺序", 1)
for t in [
    "来源权威：00-source/canonical-source.json；题组顺序与页码：00-source/listening-exercise-contract.json。",
    "图片候选：10-design/assets/image-manifest.json 与 visual-brief-draft.md；图片不含文字，不代表新增教材事实。",
    "当前已有第三课线上／实体 PPTX draft，但尚未登记为 authority。升格后，批准 PPTX 是最终内容决定；本手册不得反向覆盖 PPTX。",
]: add_p(doc, t, style="List Bullet")

heading("二、来源与内容盘点", 1)
add_table(doc, ["项目", "数量／范围"], [(k, v) for k, v in [
    ("一般词语", inv["vocabulary_count"]), ("语言专名", inv["proper_noun_count"]),
    ("词语理解", f"{inv['vocabulary_comprehension_group_count']} 组／{inv['vocabulary_comprehension_item_count']} 项"),
    ("听句子判断", f"{inv['listening_sentence_item_count']} 项"), ("听说短文", "3 段（3-4、3-5、3-6）"),
    ("常用表达", f"{inv['grammar_pattern_count']} 项"), ("听力题组", f"{inv['listening_exercise_group_count']} 组"),
    ("综合练习", f"{inv['comprehensive_exercise_count']} 项"), ("结构化练习总数", inv["exercise_count"]),
]] )

heading("三、暂定 Can-Do（待正式课时及边界批准）", 1)
for t in [
    "Interpretive：听懂三段短文主要信息，回答第一遍／第二遍问题，并用来源细节核对理解。",
    "Interpersonal：围绕家庭经历、语言选择和中文学习经验提问、回答、请求重复、确认理解，并在小组中补充同伴信息。",
    "Presentational：使用本课词语和常用表达，介绍自己何时开始对中文有兴趣、为什么选修中文及学习收获；按教材要求完成 6–10 句、60–80 字口头产出。",
    "以上为教学重组草案；正式实体课时、线上／实体内容边界和评量门槛待人工确认。",
]: add_p(doc, t, style="List Bullet")

heading("四、线上／实体边界（结构已确认，课时待确认）", 1)
for t in [
    "线上预习建议：词语与拼音预览、三段短文预读、题目预读、关键词记录和个人中文学习经历提纲。",
    "实体课建议：听力理解核对、词语理解题、判断题、短文问答、小组补充与总结、请求重复和个人口语发表。",
    "上述分配只是初稿；Adam 确认前不建立 L3 PPT storyboard，也不以线上学习折抵实体课。",
]: add_p(doc, t, style="List Bullet")

heading("五、暂定实体课流程（不写死分钟数）", 1)
add_p(doc, "正式课时尚未批准，以下只提供可由 PPT 页面承载的顺序；每段时间、分组与转场待确认。")
add_table(doc, ["段落", "主题", "学生产出／动作", "教材页码"], flow_rows)

heading("六、音频与教材页码", 1)
add_p(doc, "六段音频均已完成文件存在、SHA-256、MP3 解码与时长技术核对；教师逐段语义听核及 PPT 实际播放仍待完成。")
add_table(doc, ["音频", "教材范围", "时长", "当前状态"], short_audio_rows())
add_p(doc, "听力操作统一采用：先看题目，抓关键词；再听并记录重点；最后回答与核对。音频编号只能按 3-1 至 3-6 使用。")

heading("七、词语覆盖（每词一页的 PPT 要求）", 1)
add_table(doc, ["序号", "词语", "拼音", "词类", "来源释义"], vocab_rows)
add_p(doc, "学生端每页固定包含词语、拼音、词类、使用场合、用法、例句、扩展用法和图片；例句与扩展必须来自已批准 PPT 或 canonical source。")

heading("八、教材练习与口语产出 coverage", 1)
add_p(doc, "所有练习均列出；只有来源有闭合答案时才记录答案，其余开放题按学生产出观察。")
add_table(doc, ["来源编号", "板块", "数量", "学生动作／产出", "答案政策"], coverage)

heading("九、三段短文教师核对摘要", 1)
for sec_id in ["short_text_1", "short_text_2", "short_text_3"]:
    s = next(s for s in canonical["sections"] if s["id"] == sec_id)
    heading(f"{s['audio']}《{s['title']}》｜教材 P{s['printed_pages'][0]}–P{s['printed_pages'][-1]}", 2)
    add_p(doc, "听力文本：" + s["text"])
    add_p(doc, "第一遍问题：" + "；".join(s["exercises"]["first_listen"]))
    add_p(doc, "第二遍问题：" + "；".join(s["exercises"]["second_listen"]))
    extra = s["exercises"].get("present") or s["exercises"].get("group")
    if extra: add_p(doc, "口语产出要求：" + extra)
    add_p(doc, "比较／答案：开放产出按来源文本核对；示例比较段落不作为全班唯一答案。")

heading("十、常用表达覆盖", 1)
for s in [s for s in canonical["sections"] if s["id"].startswith("common_expressions")]:
    heading(f"{s['topic']}｜教材 P{s['printed_pages'][0]}–P{s['printed_pages'][-1]}", 2)
    for item in s["items"]: add_p(doc, item["expression"] + "：" + "；".join(item["examples"]), style="List Bullet")

heading("十一、教师执行提示与答案政策", 1)
for t in [
    "先让学生完成听、说、比较或总结，再用来源中的词语与句式做短修补；不以逐词翻译替代任务。",
    "3-2 的选择答案和 3-3 的判断答案可按答案 PDF 核对；其余短文问答、个人介绍、比较、填表、小组总结和拓展练习没有唯一标准答案。",
    "不把图片候选中的人物外貌、人数、身份或地点当成教材事实；图片只服务词义、情境、比较或记忆。",
    "若音频不能播放，记录音频编号与故障；不要换用其他课次或另一本教材的音频。",
    "正式实体课时、分组、恢复路线、量表与课后任务待确认；不得用固定 6 节／300 分钟替代正式课表。",
]: add_p(doc, t, style="List Bullet")

heading("十二、Blocker report", 1)
for t in [
    "当前已有 L3 PPTX draft，但本手册尚未完成 authority PPTX 对齐或最终交付。",
    "3-1 至 3-6 尚未完成教师逐段语义听核与 PowerPoint 实际播放测试。",
    "PBI 教学重组、正式实体课时、线上／实体边界、配套材料、storyboard、Visual storyboard、6 张 prototype、QA 与 release 仍待后续 gate。",
    "本文件不得写入 20-approved/ 或 40-release/；仅供教师手册制作与审核使用。",
]: add_p(doc, t, style="List Bullet")

doc_path = OUT / "lesson-03-教师手册-draft.docx"
doc.save(str(doc_path))
print(md_path)
print(doc_path)
