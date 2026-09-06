#!/usr/bin/env python3
"""Build the first-week ACTFL/ESL icebreaker teacher guide and student cards."""

from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parent
INK = "17324D"
BLACK = "000000"
HEADER = "DCE8F2"
PALE = "F5F8FA"
GRID = "D9D9D9"


def set_rfonts(rpr, east_asia="KaiTi"):
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), "Times New Roman")
    rfonts.set(qn("w:hAnsi"), "Times New Roman")
    rfonts.set(qn("w:cs"), "Times New Roman")
    rfonts.set(qn("w:eastAsia"), east_asia)


def set_lang(rpr):
    lang = rpr.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        rpr.append(lang)
    lang.set(qn("w:val"), "zh-CN")
    lang.set(qn("w:eastAsia"), "zh-CN")


def format_run(run, size=12, bold=False, color=INK):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    rpr = run._element.get_or_add_rPr()
    set_rfonts(rpr)
    set_lang(rpr)


def format_style(style, size=12, bold=False, color=INK):
    style.font.name = "Times New Roman"
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor.from_string(color)
    rpr = style._element.get_or_add_rPr()
    set_rfonts(rpr)
    set_lang(rpr)


def setup_doc(doc, student=False):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.58 if student else 0.62)
    section.bottom_margin = Inches(0.58 if student else 0.62)
    section.left_margin = Inches(0.65)
    section.right_margin = Inches(0.65)

    format_style(doc.styles["Normal"], 12 if not student else 13, color=INK)
    doc.styles["Normal"].paragraph_format.space_after = Pt(5)
    doc.styles["Normal"].paragraph_format.line_spacing = 1.18
    format_style(doc.styles["Title"], 19 if not student else 18, True, BLACK)
    format_style(doc.styles["Heading 1"], 16, True, BLACK)
    format_style(doc.styles["Heading 2"], 14, True, BLACK)
    format_style(doc.styles["Heading 3"], 12, True, BLACK)
    for name in ("List Bullet", "List Number"):
        format_style(doc.styles[name], 12 if not student else 13, color=INK)
        doc.styles[name].paragraph_format.space_after = Pt(3)
        doc.styles[name].paragraph_format.line_spacing = 1.15


def set_cell_border(cell, color=GRID, size="6"):
    tcpr = cell._tc.get_or_add_tcPr()
    borders = tcpr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tcpr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn("w:" + edge)
        item = borders.find(tag)
        if item is None:
            item = OxmlElement("w:" + edge)
            borders.append(item)
        item.set(qn("w:val"), "single")
        item.set(qn("w:sz"), size)
        item.set(qn("w:space"), "0")
        item.set(qn("w:color"), color)


def set_cell_padding(cell, top=90, start=110, bottom=90, end=110):
    tcpr = cell._tc.get_or_add_tcPr()
    margins = tcpr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tcpr.append(margins)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn("w:" + side))
        if node is None:
            node = OxmlElement("w:" + side)
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def cell_text(cell, text, *, bold=False, size=11, color=INK, align=WD_ALIGN_PARAGRAPH.LEFT, fill=None):
    cell.text = ""
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_border(cell)
    set_cell_padding(cell)
    if fill:
        tcpr = cell._tc.get_or_add_tcPr()
        shading = tcpr.first_child_found_in("w:shd")
        if shading is None:
            shading = OxmlElement("w:shd")
            tcpr.append(shading)
        shading.set(qn("w:fill"), fill)
    paragraph = cell.paragraphs[0]
    paragraph.alignment = align
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = 1.1
    run = paragraph.add_run(text)
    format_run(run, size=size, bold=bold, color=color)


def add_table(doc, headers, rows, widths=None, size=10.5, header_size=10.5):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for index, value in enumerate(headers):
        cell_text(table.rows[0].cells[index], value, bold=True, size=header_size, color=BLACK, align=WD_ALIGN_PARAGRAPH.CENTER, fill=HEADER)
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for index in range(len(headers)):
            value = row[index] if index < len(row) else ""
            fill = PALE if row_index % 2 else None
            alignment = WD_ALIGN_PARAGRAPH.CENTER if index == 0 and len(headers) <= 4 else WD_ALIGN_PARAGRAPH.LEFT
            cell_text(cells[index], value, size=size, align=alignment, fill=fill)
    if widths:
        for row in table.rows:
            for index, width in enumerate(widths):
                if index < len(row.cells):
                    row.cells[index].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_title(doc, title, subtitle=None, student=False):
    paragraph = doc.add_paragraph(style="Title")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_after = Pt(4)
    run = paragraph.add_run(title)
    format_run(run, size=19 if not student else 18, bold=True, color=BLACK)
    if subtitle:
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(8)
        run = paragraph.add_run(subtitle)
        format_run(run, size=11 if not student else 10.5, color=INK)


def add_heading(doc, text, level=1):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    paragraph.paragraph_format.space_before = Pt(7 if level == 1 else 4)
    paragraph.paragraph_format.space_after = Pt(4)
    run = paragraph.add_run(text)
    format_run(run, size=16 if level == 1 else 14 if level == 2 else 12, bold=True, color=BLACK)
    return paragraph


def add_para(doc, text, size=12, bold=False, color=INK, align=WD_ALIGN_PARAGRAPH.LEFT, after=5):
    paragraph = doc.add_paragraph()
    paragraph.alignment = align
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = 1.18
    run = paragraph.add_run(text)
    format_run(run, size=size, bold=bold, color=color)
    return paragraph


def add_bullet(doc, text, level=0, size=12):
    style = "List Bullet" if level == 0 else "List Bullet 2"
    paragraph = doc.add_paragraph(style=style)
    paragraph.paragraph_format.space_after = Pt(2)
    paragraph.paragraph_format.line_spacing = 1.15
    run = paragraph.add_run(text)
    format_run(run, size=size, color=INK)
    return paragraph


def add_number(doc, text, size=12):
    paragraph = doc.add_paragraph(style="List Number")
    paragraph.paragraph_format.space_after = Pt(2)
    paragraph.paragraph_format.line_spacing = 1.15
    run = paragraph.add_run(text)
    format_run(run, size=size, color=INK)
    return paragraph


def add_code_block(doc, lines, size=11.5, after=5):
    for line in lines:
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.left_indent = Inches(0.18)
        paragraph.paragraph_format.space_after = Pt(1)
        paragraph.paragraph_format.line_spacing = 1.1
        run = paragraph.add_run(line)
        format_run(run, size=size, color=INK)
    if after:
        doc.add_paragraph().paragraph_format.space_after = Pt(after)


def page_break(doc):
    doc.add_page_break()


def build_teacher_guide(path):
    doc = Document()
    setup_doc(doc)
    add_title(doc, "第一周华语听说破冰活动", "教师用｜2026 fall｜准中级加速篇 I")
    add_para(doc, "这套流程给第一次带三个听说班的教师使用。学生已经完成《博雅汉语听说：初级起步篇》第一、二册，第一周开始学习《博雅汉语听说：准中级加速篇 I》。同一套活动可直接用于三个班，先建立安全的互动习惯，再进入第一课《丽丽是独生女》。", size=12, after=7)

    add_heading(doc, "三个班的第一周课表", 1)
    add_table(
        doc,
        ["日期", "班别", "教室", "节次"],
        [
            ["2026/09/09 周三", "Nghe - Nói tiếng Trung Quốc 3 (126.1)_LT_01", "B3_305", "6、7、8、9"],
            ["2026/09/10 周四", "Nghe - Nói tiếng Trung Quốc 3 (126.1)_LT_02", "B3_505", "6、7、8、9"],
            ["2026/09/11 周五", "Nghe - Nói tiếng Trung Quốc 3 (126.1)_LT_03", "B3_504", "2、3、4、5"],
        ],
        widths=[1.25, 3.35, 0.8, 0.7],
        size=9.5,
        header_size=10,
    )
    add_para(doc, "每次课 4 节、每节 50 分钟。建议先用约 95 分钟完成破冰、口语诊断和课堂沟通规则，再转入第一课的听力与口语任务。", after=6)

    add_heading(doc, "学生要完成的语言行动", 1)
    add_table(
        doc,
        ["沟通模式", "课堂证据"],
        [
            ["Interpretive 理解", "听懂同伴的个人信息，写下至少两条关键词。"],
            ["Interpersonal 互动", "向不同同学提问、追问，并在听不清时确认或请求重复。"],
            ["Presentational 表达", "根据小组信息完成 45–60 秒的共同介绍。"],
        ],
        widths=[1.55, 4.9],
        size=11,
    )
    add_para(doc, "第一次课不把这份记录当成正式成绩。教师只需要知道学生当前能做什么，作为后续安排搭档、语言支架和即时修补的依据。", after=6)

    add_heading(doc, "课前准备", 1)
    for text in [
        "黑板或投影：写好教师示范和沟通用语。",
        "每位学生一套活动卡：我的中文名片、找同学、听者三件事、我们的小组介绍、课末小卡片。",
        "计时器；不需要手机、网络、照片或复杂教具。",
        "座位先排成两人一组；找同学开始后允许学生站起来走动。",
    ]:
        add_bullet(doc, text)

    add_heading(doc, "黑板语言支架", 1)
    add_code_block(
        doc,
        [
            "你叫什么名字？大家怎么叫你？",
            "你为什么学习中文？",
            "你平时喜欢做什么？为什么？",
            "你这学期想在哪方面进步？",
            "真的吗？为什么？",
            "你是说……吗？",
            "我没听清楚，请再说一遍。",
            "我想补充一点……",
        ],
        size=12,
    )
    add_para(doc, "先告诉学生：可以先看句子再说；忘记一个词时可以换一种说法；听不清楚时可以请求重复。教师只即时修补一个会影响理解的表达，不在破冰过程中逐句纠错。", after=5)

    add_heading(doc, "95 分钟流程", 1)
    add_table(
        doc,
        ["时间", "活动", "学生要做什么", "教师观察"],
        [
            ["0–8", "欢迎与示范", "听教师介绍，了解今天的任务。", "能否听懂任务和基本课堂用语。"],
            ["8–23", "我的中文名片", "写 5 条信息；交换；听者记 1 条；介绍同伴。", "短句说明、关键词理解。"],
            ["23–48", "找同学", "问 4 位以上同学；每次追问一句；记录名字和信息。", "问句、追问、真实听取。"],
            ["48–53", "信息回收", "说出自己听到的一条信息。", "内容是否来自真实听到的信息。"],
            ["53–68", "听者三件事", "用追问、确认、请求重复完成两轮对话。", "能否修补理解。"],
            ["68–88", "小组介绍", "找共同点、差异、目标和课堂约定；报告。", "共同决定和组织表达。"],
            ["88–95", "课末小卡片", "写下会做的事和想进步的一点。", "留下每位学生的起点证据。"],
        ],
        widths=[0.65, 1.2, 2.55, 2.05],
        size=9.5,
        header_size=9.8,
    )

    page_break(doc)
    add_heading(doc, "活动一 我的中文名片", 1)
    add_heading(doc, "操作目标", 2)
    add_para(doc, "先给每位学生准备时间，再进入真实问答。教师可以借此记住名字、了解学习原因，并观察学生能否听懂个人信息。", after=4)
    add_heading(doc, "教师示范", 2)
    add_code_block(doc, [
        "我叫________，大家可以叫我________。",
        "我来自________。",
        "我现在________。",
        "我学习中文是因为________。",
        "这学期我希望________。",
    ], size=12)
    add_para(doc, "说完后问：“我来自哪里？我这学期希望做什么？”学生可以只回答关键词。这样学生先看到如何完成任务，不需要猜规则。", after=4)
    add_heading(doc, "学生步骤", 2)
    for text in [
        "独立写下 5 条可以公开分享的信息。",
        "A 说 30–45 秒，B 听并记一条信息。",
        "B 问一个问题，例如“你为什么学习中文？”或“你平时喜欢做什么？”",
        "交换角色。",
        "每人用 20 秒向另一位同学介绍自己的同伴。",
    ]:
        add_number(doc, text)
    add_heading(doc, "安全边界", 2)
    add_para(doc, "不要求学生说年龄、恋爱、家庭经济或其他私人信息。学生可以用家乡、专业、学习经历、兴趣、周末活动或中文学习目标替代家庭信息。", after=4)
    add_heading(doc, "教师快速记录", 2)
    add_bullet(doc, "能否说出 3 条可以理解的信息。")
    add_bullet(doc, "能否回答同伴问题。")
    add_bullet(doc, "是否需要句子支架或较长准备时间。")

    add_heading(doc, "活动二 找同学", 1)
    add_heading(doc, "教师先做一轮", 2)
    add_code_block(doc, [
        "A：你以前用中文跟别人说过话吗？",
        "B：说过。",
        "A：跟谁说过？",
        "B：跟中国朋友说过。",
        "A：真的吗？你觉得难不难？",
    ], size=11.5)
    add_para(doc, "检查三个规则：每格写一个名字；得到回答后还要追问一句；尽量换人。不要把活动做成只收集名字的比赛。", after=4)
    add_heading(doc, "建议题目", 2)
    for text in [
        "你喜欢听中文歌或看中文视频吗？",
        "你以前用中文跟别人说过话吗？",
        "你学中文时更喜欢听力还是口语？为什么？",
        "你课前会先看题目再听吗？",
        "你有没有忘记一个词，但还是把意思说清楚的时候？",
        "这学期你想在哪方面进步？",
        "你有什么爱好？为什么喜欢？",
    ]:
        add_bullet(doc, text, size=11.5)
    add_para(doc, "学生选择 4 个问题，去问不同同学。每次得到回答后，从卡片底部选择一个追问：什么时候？为什么？跟谁？在哪里？你觉得难不难？你可以再说一点吗？", size=11.5, after=4)

    page_break(doc)
    add_heading(doc, "活动二的课堂管理与分层", 1)
    add_heading(doc, "进行方式", 2)
    for text in [
        "先让学生在座位上默读问题，教师处理 2–3 个最影响理解的词。",
        "学生站起来找不同同学，问问题并记录“名字＋一条信息”。",
        "教师只在学生真的卡住时给词语或句型，不替学生完成对话。",
        "时间到后回座位，用一句话说出自己听到的信息。",
    ]:
        add_number(doc, text)
    add_heading(doc, "强化版", 2)
    add_para(doc, "如果班级很快完成，要求学生不能只回答“是／不是”，必须补充一个原因、时间或例子；也可以换一个问题，再找两位同学。", after=4)
    add_heading(doc, "活动三 听者三件事", 1)
    add_para(doc, "第一天就建立“听不懂可以修补”的课堂习惯。学生练习追问、确认和请求重复。", after=4)
    add_table(
        doc,
        ["动作", "可以说"],
        [
            ["追问", "为什么？什么时候？你可以再说一点吗？"],
            ["确认", "你是说……吗？所以你的意思是……，对吗？"],
            ["请求重复", "我没听清楚，请再说一遍。请说慢一点。"],
        ],
        widths=[1.25, 5.2],
        size=11,
    )
    add_heading(doc, "步骤", 2)
    for text in [
        "从《找同学》记录中选一条信息。",
        "A 用 20 秒说出信息，B 必须追问一句。",
        "A 故意把一个细节说得不清楚，B 用“你是说……吗？”确认。",
        "使用一次“请再说一遍”，对方换一种方式重说。",
        "交换角色。",
    ]:
        add_number(doc, text)
    add_para(doc, "反馈时先谈沟通是否成功，再选一个全班共同问题修补。不要公开指出某位学生的错误。", after=4)

    page_break(doc)
    add_heading(doc, "活动四 我们的小组介绍", 1)
    add_para(doc, "三人小组找出两个共同点、一个不同点、一个共同目标和一条帮助大家学习中文的课堂约定，然后报告 45–60 秒。每个人至少说一句。", after=4)
    add_code_block(doc, [
        "我们是________、________和________。",
        "我们都________。",
        "我们还都喜欢／想要________。",
        "不过，________和________不一样：________。",
        "这学期我们希望________。",
        "为了做到这一点，我们同意________。",
    ], size=11.5)
    add_para(doc, "小组先练习一次，再报告。听众写下一个“我听到的共同点”。第二次练习时交换提问、记录和报告角色。", after=4)

    add_heading(doc, "分层与低压备用路线", 1)
    add_heading(doc, "需要支架的学生", 2)
    add_bullet(doc, "允许先写关键词；第一轮只要求问一个问题。")
    add_bullet(doc, "保留句子开头和追问清单；小组介绍只要求说 3–4 句。")
    add_bullet(doc, "先两人练习，再进入走动活动；不要要求学生即兴说很长。")
    add_heading(doc, "完成很快的学生", 2)
    add_bullet(doc, "补充“为什么”，并回答听众的一个追问。")
    add_bullet(doc, "不能只回答“是／不是”，要加时间、原因或例子。")
    add_heading(doc, "学生很安静", 2)
    add_bullet(doc, "先保持两人一组，给 30 秒准备时间，只要求每人问一个问题。")
    add_bullet(doc, "第一轮后再换一位同学，不立刻要求全班报告。")
    add_heading(doc, "学生不想谈家庭", 2)
    add_bullet(doc, "立即允许改谈家乡、专业、学习经历、兴趣或周末活动。")
    add_para(doc, "活动目标是交换信息和建立沟通，不是公开私人资料。", after=4)
    add_heading(doc, "班级人数较多", 2)
    add_bullet(doc, "教师不逐一听完所有人；巡视时每组记录一条证据。")
    add_bullet(doc, "全班只邀请 3–4 组分享，其余用课末小卡片留下证据。")

    add_heading(doc, "课末小卡片", 1)
    add_para(doc, "让学生写下：今天我能问同学什么；今天我能听懂什么；我会使用哪一句修补用语；这学期想在哪方面进步。收回后用来安排下一次课的搭档和即时修补重点。", after=4)
    add_heading(doc, "转入第一课", 1)
    add_code_block(doc, [
        "刚才我们已经谈了家庭、学习和爱好。现在打开教材第1页。",
        "先看题目，写下你想听到的两个关键词；然后听、记关键词、回答，最后和同学核对。",
    ], size=12)
    add_para(doc, "接着按第一课《丽丽是独生女》的实体课流程进入教材听力。破冰中的家庭、学习和爱好信息只作为背景，不替代教材内容，也不预先讲完整课文。", after=5)

    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)


def add_blank_line(doc, label, width=54, size=13):
    add_para(doc, f"{label}{'_' * width}", size=size, after=6)


def build_student_cards(path):
    doc = Document()
    setup_doc(doc, student=True)

    add_title(doc, "第一周华语听说活动卡", "我的中文名片", student=True)
    add_para(doc, "写下可以和同学分享的信息。不会写完整句子时，可以先写关键词。", size=13, after=8)
    add_blank_line(doc, "我的名字是：", 22)
    add_blank_line(doc, "大家可以叫我：", 19)
    add_blank_line(doc, "我来自：", 29)
    add_blank_line(doc, "我现在学习／工作：", 19)
    add_blank_line(doc, "我学习中文是因为：", 17)
    add_blank_line(doc, "这学期我希望：", 21)
    add_heading(doc, "和同学说", 2)
    add_para(doc, "A 说 30–45 秒。B 听一听，写下一条信息，再问一个问题。然后交换。", size=13, after=5)
    add_blank_line(doc, "我听到同学说：", 21)
    add_blank_line(doc, "我想问：", 29)

    page_break(doc)
    add_title(doc, "第一周华语听说活动卡", "找同学", student=True)
    add_para(doc, "问不同的同学。得到回答后，再追问一句。每次写下“名字＋一条信息”。", size=13, after=8)
    add_table(
        doc,
        ["我的问题", "同学名字", "我听到的一条信息"],
        [
            ["你喜欢听中文歌或看中文视频吗？", "", ""],
            ["你以前用中文跟别人说过话吗？", "", ""],
            ["你学中文时更喜欢听力还是口语？为什么？", "", ""],
            ["你课前会先看题目再听吗？", "", ""],
            ["这学期你想在哪方面进步？", "", ""],
        ],
        widths=[3.15, 1.1, 2.15],
        size=10.5,
        header_size=10.5,
    )
    add_heading(doc, "可以这样追问", 2)
    add_para(doc, "什么时候？为什么？跟谁？在哪里？你觉得难不难？你可以再说一点吗？", size=13, after=6)
    add_para(doc, "我还听到：____________________________________________________________", size=13, after=4)

    page_break(doc)
    add_title(doc, "第一周华语听说活动卡", "听者三件事", student=True)
    add_para(doc, "和同学说一条你刚才听到的信息。听者完成三个动作。", size=13, after=8)
    add_table(
        doc,
        ["动作", "我可以说"],
        [
            ["1 追问", "为什么？什么时候？你可以再说一点吗？"],
            ["2 确认", "你是说________________吗？"],
            ["3 请求重复", "我没听清楚，请再说一遍。请说慢一点。"],
        ],
        widths=[1.3, 5.0],
        size=12,
        header_size=11.5,
    )
    add_heading(doc, "我听到的信息", 2)
    add_blank_line(doc, "____________________________________________________________", 0, size=13)
    add_blank_line(doc, "____________________________________________________________", 0, size=13)
    add_para(doc, "交换角色，再做一轮。", size=13, bold=True, after=7)
    add_para(doc, "我今天使用了：□ 追问　□ 确认　□ 请求重复", size=13, after=5)

    page_break(doc)
    add_title(doc, "第一周华语听说活动卡", "我们的小组介绍", student=True)
    add_para(doc, "三个人一起完成。找出两个共同点、一个不同点、一个共同目标和一条课堂约定。", size=13, after=8)
    add_blank_line(doc, "我们是：", 27, size=13)
    add_blank_line(doc, "我们都：", 28, size=13)
    add_blank_line(doc, "我们还都喜欢／想要：", 16, size=13)
    add_blank_line(doc, "不过：", 31, size=13)
    add_blank_line(doc, "这学期我们希望：", 20, size=13)
    add_blank_line(doc, "为了做到这一点，我们同意：", 10, size=13)
    add_heading(doc, "报告时可以这样说", 2)
    add_code_block(doc, [
        "我们是________、________和________。",
        "我们都________。不过，________和________不一样：________。",
        "这学期我们希望________。为了做到这一点，我们同意________。",
    ], size=12.5)
    add_para(doc, "每个人至少说一句。听众写下一个“我听到的共同点”。", size=13, bold=True, after=4)

    page_break(doc)
    add_title(doc, "第一周华语听说活动卡", "课末小卡片", student=True)
    add_para(doc, "用简短中文完成。", size=13, after=10)
    add_blank_line(doc, "今天我能问同学：", 22, size=13)
    add_blank_line(doc, "今天我能听懂：", 22, size=13)
    add_blank_line(doc, "我会使用的一句修补用语：", 12, size=13)
    add_blank_line(doc, "这学期我想进步：", 20, size=13)
    add_para(doc, "我现在的感觉：　□ 我可以说　□ 我需要多练习　□ 我想问老师", size=13, after=8)
    add_para(doc, "谢谢你的认真参与。", size=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=4)

    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)


if __name__ == "__main__":
    teacher = ROOT / "lesson-01-第一周破冰-教师手册.docx"
    cards = ROOT / "lesson-01-第一周破冰-学生活动卡.docx"
    build_teacher_guide(teacher)
    build_student_cards(cards)
    print(teacher)
    print(cards)
