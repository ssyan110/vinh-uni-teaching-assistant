#!/usr/bin/env python3
"""Build the semester teacher manual and append the approved Lesson 1 guide."""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from textwrap import dedent
from typing import Iterable, Sequence

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont

from production_gate import assert_ready


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
LESSON_DIR = PROJECT_ROOT / CONFIG["lesson_root"]
LESSON_GUIDE = Path(os.environ.get(
    "BOYA_LESSON_GUIDE_PATH",
    str(LESSON_DIR / "10-design/teacher-manual-draft/lesson-01-teacher-guide.md"),
))
MANUAL_DIR = Path(os.environ.get("BOYA_MANUAL_EXPORT_DIR", str(LESSON_DIR / "10-design/teacher-manual-export-draft")))
MANUAL_MD = MANUAL_DIR / "boya-intermediate-i-semester-teacher-manual.md"
MANUAL_DOCX = MANUAL_DIR / "boya-intermediate-i-semester-teacher-manual.docx"
MANUAL_PDF = MANUAL_DIR / "boya-intermediate-i-semester-teacher-manual.pdf"
MANIFEST = MANUAL_DIR / "manifest.json"
GANTT_PNG = MANUAL_DIR / "semester-gantt.png"
HISTORICAL_LESSON_KEY = "boya-intermediate-i:lesson-01"
EXPECTED_HISTORICAL_LESSON_ROOT = (PROJECT_ROOT / "lessons/boya-intermediate-i/lesson-01").resolve()

FONT = CONFIG.get("font_policy", {}).get("latin", "Times New Roman")
# Use the standard cross-platform CJK face required for delivery packages.
CJK_FONT = CONFIG.get("font_policy", {}).get("cjk", "KaiTi")
INK = "17324D"
ACCENT = "2E74B5"
DARK_ACCENT = "1F4D78"
LIGHT_BLUE = "E8EEF5"
LIGHT_GRAY = "F2F4F7"
FORM_LINE = "AAB8C6"
MUTED = "64748B"


SEMESTER_SESSIONS = [
    ("01", "09/07", "09/13"),
    ("02", "09/14", "09/20"),
    ("03", "09/21", "09/27"),
    ("04", "09/28", "10/04"),
    ("05", "10/05", "10/11"),
    ("06", "10/12", "10/18"),
    ("07", "10/19", "10/25"),
    ("08", "10/26", "11/01"),
    ("09", "11/02", "11/08"),
    ("10", "11/09", "11/15"),
    ("11", "11/16", "11/22"),
    ("12", "11/23", "11/29"),
    ("13", "11/30", "12/06"),
    ("14", "12/07", "12/13"),
    ("15", "12/14", "12/20"),
    ("弹性周", "12/21", "12/27"),
]


SEMESTER_GANTT_ROWS = [
    ("课程启动与诊断", "diagnostic", [(0, 0.0, 1.0, "4节")]),
    ("第1课  中国人的姓名（第2次至第3次）", "lesson", [(1, 0.0, 1.0, "第2次"), (2, 0.0, 0.5, "第3次")]),
    ("第2课  真正的朋友（第3次至第4次）", "lesson", [(2, 0.5, 0.5, "第3次"), (3, 0.0, 1.0, "第4次")]),
    ("第5课  音乐的魅力（第5次至第6次）", "lesson", [(4, 0.0, 1.0, "第5次"), (5, 0.0, 0.5, "第6次")]),
    ("第3课  宜居之地（第6次至第7次）", "lesson", [(5, 0.5, 0.5, "第6次"), (6, 0.0, 1.0, "第7次")]),
    ("中期听说评量", "assessment", [(7, 0.0, 1.0, "4节")]),
    ("第7课  我的同事（第9次至第10次）", "lesson", [(8, 0.0, 1.0, "第9次"), (9, 0.0, 0.5, "第10次")]),
    ("第6课  挑战（第10次至第11次）", "lesson", [(9, 0.5, 0.5, "第10次"), (10, 0.0, 1.0, "第11次")]),
    ("第4课  地球人的担忧（第12次至第13次）", "lesson", [(11, 0.0, 1.0, "第12次"), (12, 0.0, 0.5, "第13次")]),
    ("第8课  学汉语的苦恼（第13次至第14次）", "lesson", [(12, 0.5, 0.5, "第13次"), (13, 0.0, 1.0, "第14次")]),
    ("期末整合表现", "assessment", [(14, 0.0, 1.0, "4节")]),
    ("弹性周", "flex", [(15, 0.0, 1.0, "按需调整")]),
]


def chart_font_path() -> Path:
    candidates = [
        Path("/Library/Fonts/Microsoft/Kaiti.ttf"),
        Path("/System/Library/Fonts/Supplemental/Kai.ttf"),
        Path("/System/Library/Fonts/Supplemental/Kaiti.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("找不到可用于学期甘特图的中文字体")


def make_chart_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def draw_centered(draw: ImageDraw.ImageDraw, box: tuple[float, float, float, float], text: str,
                  font: ImageFont.FreeTypeFont, fill: str) -> None:
    left, top, right, bottom = box
    bounds = draw.textbbox((0, 0), text, font=font)
    text_width = bounds[2] - bounds[0]
    text_height = bounds[3] - bounds[1]
    x = left + (right - left - text_width) / 2 - bounds[0]
    y = top + (bottom - top - text_height) / 2 - bounds[1]
    draw.text((x, y), text, font=font, fill=fill)


def build_semester_gantt() -> None:
    """Create the reader-facing semester schedule visual used in the manual."""
    font_path = chart_font_path()
    width, height = 3000, 1320
    image = Image.new("RGB", (width, height), "#F8FAFC")
    draw = ImageDraw.Draw(image)
    title_font = make_chart_font(font_path, 48)
    subtitle_font = make_chart_font(font_path, 25)
    header_font = make_chart_font(font_path, 22)
    date_font = make_chart_font(font_path, 17)
    row_font = make_chart_font(font_path, 23)
    bar_font = make_chart_font(font_path, 20)
    small_bar_font = make_chart_font(font_path, 17)
    summary_font = make_chart_font(font_path, 21)
    legend_font = make_chart_font(font_path, 19)

    ink = "#17324D"
    muted = "#64748B"
    grid = "#D7E1EB"
    header_fill = "#E8EEF5"
    row_fill = "#FFFFFF"
    lesson_colors = ["#2E74B5", "#4C83B0", "#6395B9", "#5576A9", "#7198B5", "#3E7899", "#5B8A9B", "#477B9F"]
    diagnostic_color = "#7A8794"
    assessment_color = "#D96B52"
    flex_color = "#CBD5E1"

    draw.text((80, 45), "学期课程节数与时间安排", font=title_font, fill=ink)
    draw.text((80, 111), "每个单元代表一次上课（4节／200分钟）；半格代表2节课。", font=subtitle_font, fill=muted)

    left = 550
    right = 100
    top = 205
    header_height = 82
    row_height = 64
    grid_width = width - left - right
    column_width = grid_width / len(SEMESTER_SESSIONS)
    grid_top = top + header_height
    grid_bottom = grid_top + row_height * len(SEMESTER_GANTT_ROWS)

    draw.rounded_rectangle((left, top, width - right, grid_bottom), radius=14, fill=row_fill, outline=grid, width=2)
    for index, (session, start_date, end_date) in enumerate(SEMESTER_SESSIONS):
        x0 = left + index * column_width
        x1 = x0 + column_width
        draw.rectangle((x0, top, x1, grid_top), fill=header_fill)
        draw.line((x0, top, x0, grid_bottom), fill=grid, width=2)
        label = "第" + session + "次" if session.isdigit() else session
        draw_centered(draw, (x0, top + 5, x1, top + 42), label, header_font, ink)
        draw_centered(draw, (x0, top + 43, x1, grid_top - 3), start_date + "–" + end_date, date_font, muted)
    draw.line((width - right, top, width - right, grid_bottom), fill=grid, width=2)
    draw.line((left, grid_top, width - right, grid_top), fill=grid, width=2)

    for row_index, (label, kind, segments) in enumerate(SEMESTER_GANTT_ROWS):
        y0 = grid_top + row_index * row_height
        y1 = y0 + row_height
        if row_index % 2 == 1:
            draw.rectangle((left, y0, width - right, y1), fill="#FBFCFE")
        draw.line((left, y1, width - right, y1), fill=grid, width=1)
        draw.text((80, y0 + 18), label, font=row_font, fill=ink)
        if kind == "diagnostic":
            color = diagnostic_color
        elif kind == "assessment":
            color = assessment_color
        elif kind == "flex":
            color = flex_color
        else:
            color = lesson_colors[row_index % len(lesson_colors)]
        for session_index, offset, duration, text in segments:
            x0 = left + (session_index + offset) * column_width + 5
            x1 = left + (session_index + offset + duration) * column_width - 5
            bar_y0 = y0 + 12
            bar_y1 = y1 - 12
            draw.rounded_rectangle((x0, bar_y0, x1, bar_y1), radius=10, fill=color)
            text_color = "#17324D" if kind == "flex" else "#FFFFFF"
            font = small_bar_font if duration < 0.6 else bar_font
            draw_centered(draw, (x0, bar_y0, x1, bar_y1), text, font, text_color)

    # Bottom summary makes the total time visible without reading the table.
    summary_y = grid_bottom + 38
    summary_items = [
        ("60节", "3000分钟", "#2E74B5"),
        ("8课", "48节教材", "#4C83B0"),
        ("课程诊断", "4节", diagnostic_color),
        ("中期评量", "4节", assessment_color),
        ("期末整合", "4节", assessment_color),
        ("弹性周", "按需调整", flex_color),
    ]
    summary_width = (width - 160) / len(summary_items) - 12
    for index, (label, value, color) in enumerate(summary_items):
        x0 = 80 + index * (summary_width + 12)
        x1 = x0 + summary_width
        fill = color if color != flex_color else "#E7EDF3"
        draw.rounded_rectangle((x0, summary_y, x1, summary_y + 78), radius=12, fill=fill)
        text_color = "#17324D" if color == flex_color else "#FFFFFF"
        draw.text((x0 + 18, summary_y + 11), label, font=summary_font, fill=text_color)
        draw.text((x0 + 18, summary_y + 43), value, font=legend_font, fill=text_color)

    image.save(GANTT_PNG, format="PNG", optimize=True)


OVERVIEW_MD = dedent(
    """
    # 《博雅汉语听说：中级冲刺篇 I》整学期教师手册

    荣市大学华语听说课程 · 2026 年秋季学期

    ## 文件信息

    | 栏目 | 当前内容 |
    | --- | --- |
    | 文件版本 | v0.4 |
    | 当前范围 | 全学期课程总览＋第一课〈中国人的姓名〉 |
    | 后续扩充 | 第2–8课继续写入本手册，沿用同一课次结构 |
    | 课程状态 | 第一课教师手册已于 2026-08-20 由 Adam 批准；全学期日期按学校正式课表微调 |
    | 教师手册语言 | 简体中文；只有在确有需要时另附越南文说明 |
    | 学生端语言 | 全中文；目标内容使用教材简体字 |
    | 课程教材 | 《博雅汉语听说：中级冲刺篇 I》 |
    | 更新日期 | 2026-08-21 |

    ## 1. 课程快照

    | 项目 | 执行规格 |
    | --- | --- |
    | 学生起点 | 已完成《博雅汉语听说：初级起步篇》一、二册，进入中级冲刺阶段 |
    | 课程重点 | 听力理解、口语互动、成段口语表达；阅读只作为听说任务的输入和证据来源 |
| 课程方法 | ACTFL能力导向教学（PBI）；用理解、人际互动、表达呈现三种模式组织可观察表现 |
| 任务设计 | 使用真实角色、信息差、条件限制、共同产出和追问，形成行动导向任务 |
    | 学期时间 | 2026/09/07–2026/12/27；15次实际授课，保留第16周作为弹性周 |
    | 课堂单位 | 1节 = 50分钟；1次上课 = 4节 = 200分钟；1课 = 6节 = 300分钟 |
    | 学期总量 | 15次 × 4节 = 60节，共3000分钟有效教学时间 |
    | 教材范围 | 《中级冲刺篇 I》共8课；课程顺序依任务和学习表现安排，不按教材页码直线推进 |
    | 课堂语言 | 教师和学生在课堂使用中文；学生投影片、预习卡和活动卡不放越南文 |
    | 休息安排 | 200分钟是有效教学时间；学校若安排休息，教师插入转场或任务间，不减少已排定的教学分钟 |

    ### 1.1 学期结束时的学生表现

    学生完成本学期后，能够在没有逐句翻译的情况下：

    - 听懂新材料的主旨、关键细节、说话者立场和支持答案的证据。
    - 在访谈、讨论、角色任务和小组决策中提问、回答、追问、确认和换一种说法。
    - 根据对象和任务完成 60 秒至 3 分钟的说明、叙述、比较、推荐或提案。
    - 听到不同意见后回应，并根据同伴或教师反馈重说一段话。
    - 用个人听力记录、口语表现、调查资料和反思组成学习档案。

    以上表现以课堂证据判断，不以背诵词语数量或单一语法错误作为主要标准。

    ### 1.2 课程运行循环

    | 阶段 | 学生任务 | 教师工作 | 课堂证据 |
    | --- | --- | --- | --- |
    | 课前预习 | 快速看指定教材，听音档，标记一个卡点，准备个人资料或问题 | 提前发预习卡，说明最低完成标准 | 预习卡、标记的问题、个人资料 |
    | 进入课堂 | 交换预习证据，先说已经知道的，再提出想确认的内容 | 用3–5分钟处理进场问题，随后回到任务 | 预习回收、第一轮口语 |
    | 理解任务 | 第一次听抓大意，第二次听找细节、态度和证据 | 控制播放次数和任务焦点，不逐句翻译 | 答案、关键词、证据位置 |
    | 互动任务 | 依角色、信息差和限制完成访谈、协商或共同决策 | 观察互动，记录影响理解的语言问题 | 追问、回应、协商记录 |
    | 表现任务 | 完成短讲、报告、提案或情境回应 | 只修补最影响任务完成的语言，再安排重做 | 个人口语、同伴反馈、重做版本 |
    | 课后整理 | 完成出口卡、录音、短报告或下一课预习 | 记录下一节要处理的两三个问题 | 出口卡、学习档案、课后资料 |

    ## 2. 学期时间架构

    ### 2.1 时间单位与排课原则

    | 单位 | 时间 | 用法 |
    | --- | --- | --- |
    | 节 | 50分钟 | 一个可观察目标和一次学生产出；直接讲解原则上不超过5分钟 |
    | 次上课 | 4节／200分钟 | 学校实际到校单位；通常安排一个主题的输入、互动和表现 |
    | 一课 | 6节／300分钟 | 教材课次的生产单位；通常跨两次上课，或与下一课衔接 |
    | 一学期 | 60节／3000分钟 | 8课×6节，加课程诊断、期中表现和期末整合表现各4节 |

本学期的8课共占48节；另外12节用于课程启动与诊断、期中听说评量和期末整合表现。每一课仍保留教材所有练习和活动的覆盖记录，课堂采用全班核心、小组轮站、课前调查、课后口语任务和评量素材等不同路径完成。

    ### 2.2 每次200分钟的建议结构

    | 节次 | 主要功能 | 学生主要产出 |
    | --- | --- | --- |
    | 第1节 | 预习回收与诠释理解 | 主旨、人物、问题或第一轮听力证据 |
    | 第2节 | 细节证据与情境语言 | 答案、关键词、替换句或对话重建 |
    | 第3节 | 人际互动与信息交换 | 访谈、追问、协商、共同决策或角色任务 |
    | 第4节 | 表达呈现、反馈与重做 | 60秒以上个人表现、同伴反馈、出口卡 |

    这四节是时间安排的骨架，不是固定讲课顺序。教材内容较长时，教师可以把第1–2节延伸到第二次上课，但必须保留个人口语证据和反馈后重做。

    ### 2.3 15次授课时间轴

    下表列出八课在本学期实际覆盖的上课次数。每课占6节课（300分钟），通常分布在连续两次上课中。

    本学期实际教学顺序为：第1课 → 第2课 → 第5课 → 第3课 → 第7课 → 第6课 → 第4课 → 第8课。

    | 课程 | 主题 | 覆盖的上课次数 | 实际日期 | 课程总量 |
    | --- | --- | --- | --- | --- |
    | 第1课 | 中国人的姓名 | 第2次至第3次 | 09/14–09/27 | 6节／300分钟 |
    | 第2课 | 真正的朋友 | 第3次至第4次 | 09/21–10/04 | 6节／300分钟 |
    | 第5课 | 音乐的魅力 | 第5次至第6次 | 10/05–10/18 | 6节／300分钟 |
    | 第3课 | 宜居之地 | 第6次至第7次 | 10/12–10/25 | 6节／300分钟 |
    | 第7课 | 我的同事 | 第9次至第10次 | 11/02–11/15 | 6节／300分钟 |
    | 第6课 | 挑战 | 第10次至第11次 | 11/09–11/22 | 6节／300分钟 |
    | 第4课 | 地球人的担忧 | 第12次至第13次 | 11/23–12/06 | 6节／300分钟 |
    | 第8课 | 学汉语的苦恼 | 第13次至第14次 | 11/30–12/13 | 6节／300分钟 |

    ![学期课程节数与时间安排](semester-gantt.png)

    图1  学期课程节数与时间安排。每个单元代表一次上课（4节／200分钟）；半格代表2节课。

    | 次数 | 暂定日期 | 四节课配置 | 主题与教材 | 主要口语／听力证据 |
    | --- | --- | --- | --- | --- |
    | 01 | 09/07–09/13 | 课程启动、先备衔接、听力诊断、互动诊断 | 课程启动与听说诊断；不引入新教材课文 | 个人60秒自我介绍；双人追问；听力主旨与细节记录 |
    | 02 | 09/14–09/20 | 第1课 | 第1课〈中国人的姓名〉；教材印刷页1–16，PDF pp.12–27，11个音档 | 听力证据表；姓名意义90秒说明；称姓与澄清练习 |
    | 03 | 09/21–09/27 | 第1课收束；第2课导入 | 从姓名文化进入朋友关系；完成第1课收束并导入第2课 | 命名顾问任务；朋友调查准备；第2课第一次听力主旨 |
    | 04 | 09/28–10/04 | 第2课 | 第2课〈真正的朋友〉；朋友、价值观、故事与观点 | 朋友价值观3分钟演讲；小组报告；辩论与追问 |
    | 05 | 10/05–10/11 | 第5课 | 第5课〈音乐的魅力〉；偏好、感受、描述与评论 | 音乐偏好调查；听感描述；短篇音乐评论 |
    | 06 | 10/12–10/18 | 第5课收束；第3课导入 | 从音乐策展进入宜居城市；完成第5课收束并导入第3课 | 校园音乐策展提案；旅游类别偏好；第3课主旨听力 |
    | 07 | 10/19–10/25 | 第3课 | 第3课〈宜居之地〉；城市、农村、生活条件与旅游 | 十日旅游线路；海岛旅游公司模拟；城市／农村观点表达 |
    | 08 | 10/26–11/01 | 中期听说表现、反馈、重做、学习档案 | 中期评量范围：第1、2、5、3课 | 新听力材料；陌生情境互动；2分钟口语表现；反馈后重做 |
    | 09 | 11/02–11/08 | 第7课 | 第7课〈我的同事〉；职场关系、礼貌、谦虚与语用 | 谦虚／敬语辨识；职场请求与回应；语用判断 |
    | 10 | 11/09–11/15 | 第7课收束；第6课导入 | 从职场语用进入挑战叙事；完成第7课收束并导入第6课 | 职场沟通诊所；人生态度讨论；第6课主旨听力 |
    | 11 | 11/16–11/22 | 第6课 | 第6课〈挑战〉；运动、人物、梦想与同理表达 | 运动解说；运动员成长报告；人物介绍与追问 |
    | 12 | 11/23–11/29 | 第4课 | 第4课〈地球人的担忧〉；问题、原因、结果与环境议题 | 环境议题听力；事故2分钟叙述；因果关系说明 |
    | 13 | 11/30–12/06 | 第4课收束；第8课导入 | 从公共议题进入语言学习反思；完成第4课收束并导入第8课 | 地球议题论坛；环境调查报告；第8课问题主旨听力 |
    | 14 | 12/07–12/13 | 第8课 | 第8课〈学汉语的苦恼〉；汉字、语用、文化与学习策略 | 汉字／组词任务；委婉语与禁忌语；学习者支援建议 |
    | 15 | 12/14–12/20 | 期末整合表现、个人口语、反思 | 新听力、新限制和第1–8课迁移 | 新情境听说任务；2–3分钟口语；追问、澄清与重做 |
    | 弹性周 | 12/21–12/27 | 不排新内容；按正式课表调整 | 补课、重做、补考、个别反馈或课程资料整理 | 缺课补做、个人口语补录、学习档案完成 |

    日期以学校正式课表为准；若实际授课周发生变化，优先保留15次有效授课的内容顺序，并使用弹性周处理补课或重做。

    ### 2.4 跨课衔接

    本学期不把每一课切成互不相连的四节。第1课与第2课、第5课与第3课、第7课与第6课、第4课与第8课之间都安排了跨课衔接：上一课的口语任务成为下一课的背景，学生在熟悉的互动流程中接触新主题。教师准备时应同时查看当前课的结束任务和下一课的预习卡。

    ## 3. 教学方法与课堂决策

### 3.1 ACTFL能力导向教学

    | 模式 | 课堂问题 | 学生证据 |
    | --- | --- | --- |
| 理解模式 | 学生听懂了什么？主旨、细节、态度和证据在哪里？ | 听力记录、关键词、判断依据、口头摘要 |
| 人际互动模式 | 学生能不能接住对方？能不能问、答、追问、确认和协商？ | 访谈、角色任务、讨论、追问、协商记录 |
| 表达呈现模式 | 学生能不能让听众听懂一个完整信息？ | 短讲、报告、提案、叙述、个人录音 |

    语言形式服务于任务。教师先让学生听、说和完成任务，再根据实际表现进行短时间修补；修补之后必须安排再说一次、再听一次或再完成一次任务。

### 3.2 行动导向任务

    每个小组任务至少包含以下三项：

    - 角色：顾问、客户、记者、居民、学生、主持人或资料整理者。
    - 条件：对象、时间、字数、语气、资料或资源限制。
    - 结果：共同方案、调查摘要、短讲、报告、建议或需要回答的问题。

    小组任务结束时，教师仍要检查每个人的个人口语证据，不能只评估小组最后交出的纸张或投影片。

    ### 3.3 语言修补原则

    - 每节直接讲解原则上不超过5分钟。
    - 只修补影响理解、互动或任务完成的词语、读音、语序和句式。
    - 优先使用学生刚刚听到或说过的内容示范，不抽离成词语清单。
    - 修补后让学生换一个同伴或换一个情境重做。
- 未预习学生使用3–5分钟补位方案：看简短卡片、听一次、说一句、问一题，然后回到原任务。

    ## 4. 教师的学期工作安排

    ### 4.1 开学前

    | 时间 | 教师工作 | 完成标准 |
    | --- | --- | --- |
    | 第一次备课 | 确认正式课表、15次授课日期和弹性周 | 手册时间轴与学校课表一致 |
    | 每课开始前 | 阅读本课教师手册，确认教材页、音档、练习覆盖和最终任务 | 能说明本课每节的学生产出 |
    | 课前一周 | 发出预习卡和音档；说明最低预习要求 | 学生知道看哪些页、听哪些音档、带什么资料 |
    | 课前一至两天 | 检查音档播放、PPTX、活动卡、分组和打印份数 | 设备、材料和备用方案已准备 |

    ### 4.2 每次上课前

    1. 确认本次课覆盖哪些课次和 P1–P6 节点。
    2. 读出口卡或上次课堂记录，选出两三个需要短修补的问题。
    3. 准备音档播放顺序、教材页、学生活动卡和计时方式。
    4. 预先安排三人或四人小组，并准备缺席或未预习学生的加入方案。
    5. 把本次课的个人口语证据写在教师观察表上。

    ### 4.3 每次上课后

    - 收回或拍照保存听力证据、同伴反馈和出口卡。
    - 记录两三个影响全班理解的问题，不把所有错误都列入下一节。
    - 标记需要补做的学生和可以在弹性周处理的任务。
    - 选一项学生表现放入学习档案，保留反馈前后版本。

    ## 5. 课程评量与学习档案

    ### 5.1 建议评量配置

    以下比例用于排课和准备证据；若学校或系上有正式评分规定，以正式规定为准。

    | 项目 | 建议比例 | 主要证据 |
    | --- | --- | --- |
    | 形成性课堂表现 | 30% | 听力证据、互动观察、短讲、角色任务、重做 |
    | 中期听说评量 | 20% | 新听力、陌生情境互动、2分钟口语、反馈后版本 |
    | 期末整合口语表现 | 30% | 新材料理解、小组任务、2–3分钟个人口语、追问回应 |
| 学习档案、调查与反思 | 20% | 预习卡、课外调查、录音、出口卡、自评和修订记录 |

    ### 5.2 课程口语观察表

    | 面向 | 观察重点 | 0–3记录标准 |
    | --- | --- | --- |
    | 任务完成 | 是否完成描述、叙述、比较、推荐或说服等任务 | 0：未完成；1：完成部分；2：完成主要要求；3：完成主要要求并能依反馈改善 |
    | 可理解度与准确度 | 听者能否理解；核心词语、句式和语气是否支持意思 | 0：没有可用信息；1：零散信息；2：大致清楚；3：主要信息清楚且容易理解 |
    | 互动与修补 | 是否能回答、追问、澄清、确认、改述和处理不同意见 | 0：无法维持互动；1：只能回答；2：能回答并追问；3：能依据对方信息延续互动 |
    | 内容、组织与情境 | 是否有理由、例子、顺序；表达是否适合对象和场景 | 0：没有组织；1：片段表达；2：信息大致完整；3：结构清楚、理由具体、情境合适 |

    ### 5.3 每次课至少留下的证据

    - 一份个人听力理解记录。
    - 一次双人或小组互动观察。
    - 一次60秒以上的个人口语表现。
    - 一次反馈后的重做或改述。
    - 一张出口卡或一项课后口语资料。

    ## 6. 教材与教学材料管理

    ### 6.1 每课教材包

    每课在本手册中形成一个完整单元，并配套以下材料：

    | 材料 | 使用者 | 作用 |
    | --- | --- | --- |
    | 教师手册 | 教师 | 课次目标、时间、教材页、音档、活动、提示、修补、评量和备用方案 |
    | 预习卡 | 学生 | 指定页码、音档、个人准备和课前证据 |
    | 活动卡 | 学生小组 | 角色、信息差、条件、步骤和共同产出 |
    | 评量表与出口卡 | 学生／教师 | 同伴反馈、个人表现、重做目标和下一课准备 |
    | PPTX | 全班 | 学生当前要做的事情、音档编号、时间和任务产出 |
    | 音档清单 | 教师 | 音档编号、教材练习、播放顺序和备用播放方式 |

    PPTX 只呈现学生当下需要的内容；教师提示、答案状态、来源追踪和制作记录留在教师手册或内部记录中。

    ### 6.2 教材练习的处理方式

教材原有练习全部保留，并在每课覆盖表中标记位置。课堂不要求每题都采用全班逐题讲解，可以依学习目标安排为：

    - 全班共同完成的核心听力题。
    - 两人核对后改述的选择题、填空题和判断题。
    - 小组轮站完成的替换、重建和文化题。
    - 课前调查、课后录音或学习档案任务。
    - 中期、期末表现使用的输入与口语证据。

    开放题没有教材标准答案时，教师依据信息完整度、理由／证据、互动和可理解度评分，不自行制造唯一答案。

    ## 7. 后续课次的固定手册结构

    第2–8课加入本手册时，沿用以下顺序：

    1. 文件信息与本课时间资料。
    2. 本课目标、教学重点与最终任务。
3. 教材来源、页码、音档和练习覆盖表。
    4. 预习卡、课后任务与未预习学生的进场方案。
    5. P1–P6 六节教学计划和每节50分钟范本。
    6. 活动执行规格、教师课堂语句、即时修补和备用方案。
    7. 形成性评量、出口卡、配套材料清单与答案政策。
    8. 教材练习对应表和待核对事项。

    每一课的6节教学内容可以跨两次200分钟上课；跨课衔接必须在时间轴和当课手册中写清楚。

    ---

    """
).strip() + "\n"


def clean_inline(text: str) -> str:
    text = text.replace("\\|", "|")
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = text.replace("**", "").replace("__", "")
    text = text.replace("*", "")
    return text.strip()


def split_table_row(line: str) -> list[str]:
    raw = line.strip()
    if raw.startswith("|"):
        raw = raw[1:]
    if raw.endswith("|"):
        raw = raw[:-1]
    return [clean_inline(part) for part in re.split(r"(?<!\\)\|", raw)]


def is_table_separator(cells: Sequence[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{2,}:?", cell.replace(" ", "")) for cell in cells)


def parse_markdown(text: str) -> list[tuple[str, object]]:
    lines = text.replace("\r\n", "\n").splitlines()
    blocks: list[tuple[str, object]] = []
    index = 0
    paragraph: list[str] = []

    def flush_paragraph() -> None:
        if paragraph:
            content = " ".join(item.strip() for item in paragraph).strip()
            if content:
                blocks.append(("paragraph", clean_inline(content)))
            paragraph.clear()

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if not stripped:
            flush_paragraph()
            index += 1
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            flush_paragraph()
            blocks.append(("heading", (len(heading.group(1)), clean_inline(heading.group(2)))))
            index += 1
            continue
        image = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
        if image:
            flush_paragraph()
            blocks.append(("image", (image.group(1), image.group(2))))
            index += 1
            continue
        if stripped == "---":
            flush_paragraph()
            blocks.append(("separator", None))
            index += 1
            continue
        if stripped.startswith("|"):
            flush_paragraph()
            rows: list[list[str]] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                cells = split_table_row(lines[index])
                if not is_table_separator(cells):
                    rows.append(cells)
                index += 1
            if rows:
                blocks.append(("table", rows))
            continue
        if re.match(r"^[-*]\s+", stripped):
            flush_paragraph()
            items: list[str] = []
            while index < len(lines) and re.match(r"^[-*]\s+", lines[index].strip()):
                items.append(clean_inline(re.sub(r"^[-*]\s+", "", lines[index].strip())))
                index += 1
            blocks.append(("bullet", items))
            continue
        if re.match(r"^\d+\.\s+", stripped):
            flush_paragraph()
            items = []
            while index < len(lines) and re.match(r"^\d+\.\s+", lines[index].strip()):
                items.append(clean_inline(re.sub(r"^\d+\.\s+", "", lines[index].strip())))
                index += 1
            blocks.append(("number", items))
            continue
        paragraph.append(stripped)
        index += 1
    flush_paragraph()
    return blocks


def merged_manual_markdown() -> str:
    lesson = LESSON_GUIDE.read_text(encoding="utf-8")
    lesson = lesson.replace("# 第一课〈中国人的姓名〉教师手册", "# 第一课〈中国人的姓名〉教师手册", 1)
    lesson = lesson.replace("| 文件版本 | v0.1 |", "| 文件版本 | v1.0 |", 1)
    lesson = lesson.replace("| 文件状态 | 待审核 |", "| 文件状态 | 已批准 |", 1)
    lesson = lesson.replace("| 审核人／日期 | 待填 |", "| 审核人／日期 | Adam／2026-08-20 |", 1)
    lesson = lesson.replace("| 审核决定 | 待填：批准／需修订 |", "| 审核决定 | 批准 |", 1)
    return OVERVIEW_MD + lesson.strip() + "\n"


def set_run_font(run, size: float = 12, color: str = INK, bold: bool | None = None) -> None:
    run.font.name = FONT
    r_pr = run._element.get_or_add_rPr()
    r_pr.rFonts.set(qn("w:ascii"), FONT)
    r_pr.rFonts.set(qn("w:hAnsi"), FONT)
    r_pr.rFonts.set(qn("w:eastAsia"), CJK_FONT)
    r_pr.rFonts.set(qn("w:cs"), FONT)
    lang = r_pr.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        r_pr.append(lang)
    lang.set(qn("w:val"), "zh-CN")
    lang.set(qn("w:eastAsia"), "zh-CN")
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold


def set_paragraph(paragraph, before: float = 0, after: float = 6, line_spacing: float = 1.2,
                  alignment=None) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line_spacing
    if alignment is not None:
        paragraph.alignment = alignment


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top: int = 75, start: int = 100, bottom: int = 75, end: int = 100) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color: str = FORM_LINE, size: int = 6) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), str(size))
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_table_geometry(table, widths: Sequence[int]) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "0")
    tbl_ind.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for i, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[min(i, len(widths) - 1)]))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_page_defaults(document: Document) -> None:
    section = document.sections[0]
    section.top_margin = Inches(0.68)
    section.bottom_margin = Inches(0.68)
    section.left_margin = Inches(0.72)
    section.right_margin = Inches(0.72)
    section.header_distance = Inches(0.30)
    section.footer_distance = Inches(0.30)
    styles = document.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), CJK_FONT)
    normal._element.rPr.rFonts.set(qn("w:cs"), FONT)
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.22
    for name, size, color, before, after in (
        ("Title", 23, INK, 0, 8),
        ("Heading 1", 16, ACCENT, 16, 8),
        ("Heading 2", 14, DARK_ACCENT, 12, 6),
        ("Heading 3", 12, DARK_ACCENT, 9, 4),
    ):
        style = styles[name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style._element.rPr.rFonts.set(qn("w:eastAsia"), CJK_FONT)
        style._element.rPr.rFonts.set(qn("w:cs"), FONT)
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)
        style.font.bold = name != "Title"
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.1
    apply_header_footer(document)


def apply_header_footer(document: Document) -> None:
    for section in document.sections:
        header = section.header
        hp = header.paragraphs[0]
        hp.text = ""
        set_paragraph(hp, after=1, line_spacing=1.0)
        run = hp.add_run("《博雅汉语听说：中级冲刺篇 I》· 整学期教师手册")
        set_run_font(run, size=8.5, color=MUTED, bold=True)
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = ""
        set_paragraph(fp, after=0, line_spacing=1.0, alignment=WD_ALIGN_PARAGRAPH.RIGHT)
        run = fp.add_run("荣市大学华语听说课程")
        set_run_font(run, size=8.5, color=MUTED)


def add_heading(document: Document, text: str, level: int, page_break_before: bool = False) -> None:
    p = document.add_paragraph(text, style=f"Heading {level}")
    set_paragraph(p, before={1: 16, 2: 12, 3: 9}.get(level, 7),
                  after={1: 8, 2: 6, 3: 4}.get(level, 4), line_spacing=1.1)
    p.paragraph_format.page_break_before = page_break_before
    for run in p.runs:
        set_run_font(run, size={1: 16, 2: 14, 3: 12}.get(level, 12),
                     color=ACCENT if level == 1 else DARK_ACCENT, bold=True)


def add_title(document: Document, text: str) -> None:
    p = document.add_paragraph(style="Title")
    set_paragraph(p, after=4, line_spacing=1.05)
    run = p.add_run(text)
    set_run_font(run, size=23, color=INK, bold=True)


def add_body(document: Document, text: str, after: float = 6) -> None:
    p = document.add_paragraph()
    set_paragraph(p, after=after, line_spacing=1.22)
    run = p.add_run(text)
    set_run_font(run, size=12, color=INK)


def add_bullets(document: Document, items: Sequence[str], numbered: bool = False) -> None:
    for item in items:
        style = "List Number" if numbered else "List Bullet"
        p = document.add_paragraph(style=style)
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.first_line_indent = Inches(-0.18)
        set_paragraph(p, after=4, line_spacing=1.18)
        run = p.add_run(item)
        set_run_font(run, size=11.5, color=INK)


def table_widths(count: int, landscape: bool, first_header: str = "") -> list[int]:
    total = 13200 if landscape else 9800
    if count == 7 and first_header == "ID" and not landscape:
        ratios = [0.11, 0.17, 0.15, 0.12, 0.15, 0.19, 0.11]
    elif count == 9 and first_header == "ID" and landscape:
        ratios = [0.07, 0.07, 0.09, 0.08, 0.13, 0.18, 0.18, 0.10, 0.10]
    else:
        ratios = {
        2: [0.22, 0.78],
        3: [0.22, 0.34, 0.44],
        4: [0.12, 0.20, 0.45, 0.23],
        5: [0.08, 0.17, 0.18, 0.31, 0.26],
        6: [0.07, 0.12, 0.17, 0.27, 0.18, 0.19],
        7: [0.06, 0.12, 0.13, 0.25, 0.14, 0.14, 0.16],
        8: [0.06, 0.10, 0.11, 0.13, 0.21, 0.15, 0.13, 0.11],
        9: [0.055, 0.075, 0.10, 0.085, 0.15, 0.17, 0.17, 0.10, 0.095],
        }.get(count)
    if ratios is None:
        ratios = [1 / count] * count
    widths = [int(total * ratio) for ratio in ratios]
    widths[-1] += total - sum(widths)
    return widths


def add_table(document: Document, rows: Sequence[Sequence[str]], landscape: bool) -> None:
    if not rows:
        return
    count = max(len(row) for row in rows)
    widths = table_widths(count, landscape, rows[0][0] if rows and rows[0] else "")
    table = document.add_table(rows=len(rows), cols=count)
    set_table_geometry(table, widths)
    for row_index, source_row in enumerate(rows):
        target = table.rows[row_index]
        tr_pr = target._tr.get_or_add_trPr()
        cant_split = OxmlElement("w:cantSplit")
        tr_pr.append(cant_split)
        if row_index == 0:
            set_repeat_table_header(target)
        for column_index in range(count):
            cell = target.cells[column_index]
            cell.text = ""
            set_cell_border(cell)
            if row_index == 0:
                set_cell_shading(cell, LIGHT_BLUE)
            paragraph = cell.paragraphs[0]
            set_paragraph(paragraph, after=0, line_spacing=1.05)
            value = source_row[column_index] if column_index < len(source_row) else ""
            run = paragraph.add_run(value)
            set_run_font(run, size=9.2 if count >= 7 else 9.8,
                         color=DARK_ACCENT if row_index == 0 else INK,
                         bold=row_index == 0)
    document.add_paragraph().paragraph_format.space_after = Pt(1)


def switch_section(document: Document, landscape: bool) -> None:
    current = document.sections[-1]
    current_landscape = current.orientation == WD_ORIENT.LANDSCAPE
    if current_landscape == landscape:
        return
    section = document.add_section(WD_SECTION.NEW_PAGE)
    section.top_margin = Inches(0.60)
    section.bottom_margin = Inches(0.60)
    section.left_margin = Inches(0.60)
    section.right_margin = Inches(0.60)
    section.header_distance = Inches(0.28)
    section.footer_distance = Inches(0.28)
    if landscape:
        section.orientation = WD_ORIENT.LANDSCAPE
        section.page_width, section.page_height = section.page_height, section.page_width
    else:
        section.orientation = WD_ORIENT.PORTRAIT
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
    apply_header_footer(document)


def build_docx(markdown_text: str) -> None:
    document = Document()
    set_page_defaults(document)
    blocks = parse_markdown(markdown_text)
    first_heading = True
    pending_page_break = False
    landscape = False
    for kind, payload in blocks:
        if kind == "heading":
            level, text = payload  # type: ignore[misc]
            if text.startswith("2.3 15次授课时间轴") and not landscape:
                switch_section(document, True)
                landscape = True
            elif text.startswith("3. 教学方法与课堂决策") and landscape:
                switch_section(document, False)
                landscape = False
            elif text.startswith("12. 教材练习对应表") and not landscape:
                switch_section(document, True)
                landscape = True
            elif text.startswith("13. 配套材料清单") and landscape:
                switch_section(document, False)
                landscape = False
            if first_heading and level == 1:
                add_title(document, text)
                first_heading = False
                continue
            force_section_break = text.startswith("13. 审核记录")
            add_heading(document, text, min(level, 3),
                        page_break_before=pending_page_break or level == 1 or force_section_break)
            pending_page_break = False
        elif kind == "paragraph":
            add_body(document, str(payload))
        elif kind == "bullet":
            add_bullets(document, payload)  # type: ignore[arg-type]
        elif kind == "number":
            add_bullets(document, payload, numbered=True)  # type: ignore[arg-type]
        elif kind == "table":
            add_table(document, payload, landscape)  # type: ignore[arg-type]
        elif kind == "image":
            _alt, relative_path = payload  # type: ignore[misc]
            image_path = (MANUAL_DIR / str(relative_path)).resolve()
            if image_path.exists():
                paragraph = document.add_paragraph()
                set_paragraph(paragraph, after=3, line_spacing=1.0, alignment=WD_ALIGN_PARAGRAPH.CENTER)
                run = paragraph.add_run()
                run.add_picture(str(image_path), width=Inches(9.8 if landscape else 7.0))
        elif kind == "separator":
            pending_page_break = True
    document.save(MANUAL_DOCX)


def write_manifest() -> None:
    data = {
        "package": "boya-intermediate-i-semester-teacher-manual",
        "version": "v0.4",
        "updated_at": "2026-08-21",
        "status": "overview_plus_lesson_01_ready_for_review",
        "language": "简体中文",
        "course": "《博雅汉语听说：中级冲刺篇 I》",
        "semester_window": "2026/09/07–2026/12/27",
        "teaching_sessions": 15,
        "flexible_weeks": 1,
        "periods_per_session": 4,
        "minutes_per_period": 50,
        "instructional_minutes_per_session": 200,
        "total_periods": 60,
        "total_instructional_minutes": 3000,
        "lesson_count": 8,
        "lesson_periods": 6,
        "current_scope": ["course_overview", "lesson_01"],
        "lesson_01_teacher_guide_approval": "approved_by_adam_2026-08-20",
        "source_of_truth_for_lesson_01": "lessons/boya-intermediate-i/lesson-01/20-approved/teacher-manual/第一课简易教案.docx",
        "output_files": [
            "boya-intermediate-i-semester-teacher-manual.md",
            "boya-intermediate-i-semester-teacher-manual.docx",
            "boya-intermediate-i-semester-teacher-manual.pdf",
            "semester-gantt.png",
        ],
        "semester_schedule_visual": "semester-gantt.png",
        "next_scope": "append_lesson_02_using_the_same_structure",
    }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    active_key = CONFIG.get("active_context", {}).get("lesson_key")
    configured_root = (PROJECT_ROOT / CONFIG.get("lesson_root", "")).resolve()
    if active_key != HISTORICAL_LESSON_KEY or configured_root != EXPECTED_HISTORICAL_LESSON_ROOT:
        raise RuntimeError(
            "build_full_teacher_manual.py is historical and scoped to "
            f"{HISTORICAL_LESSON_KEY}; active context is {active_key!r} and lesson_root is {configured_root}. "
            "Use a lesson-key-scoped semester builder for the current offering."
        )
    assert_ready("semester-manual", MANUAL_DIR)
    if not LESSON_GUIDE.is_file():
        raise FileNotFoundError(f"Teacher-guide input is missing: {LESSON_GUIDE}")
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    build_semester_gantt()
    markdown_text = merged_manual_markdown()
    MANUAL_MD.write_text(markdown_text, encoding="utf-8")
    build_docx(markdown_text)
    write_manifest()
    print(MANUAL_MD)
    print(MANUAL_DOCX)
    print(MANIFEST)


if __name__ == "__main__":
    main()
