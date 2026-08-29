from pathlib import Path
import re
from pptx import Presentation
from docx import Document
from docx.shared import Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
ONLINE = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx"
FACE = ROOT / "lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-实体课.pptx"

def slide_data(path):
    prs = Presentation(str(path))
    data = []
    for num, slide in enumerate(prs.slides, 1):
        texts = []
        audio = []
        for shape in slide.shapes:
            if getattr(shape, "text", "").strip():
                txt = "\n".join(x.strip() for x in shape.text.splitlines() if x.strip())
                texts.append(txt)
            if str(shape.shape_type) == "MEDIA (16)" or getattr(shape, "shape_type", None) == 16:
                name = getattr(shape, "name", "")
                m = re.search(r"音频\s*([0-9]+-[0-9]+)", name)
                if m:
                    audio.append(m.group(1))
        notes = []
        try:
            for shape in slide.notes_slide.shapes:
                if hasattr(shape, "text_frame"):
                    for p in shape.text_frame.paragraphs:
                        if p.text.strip() and p.text.strip() not in {"#", ""}:
                            notes.append(p.text.strip())
        except Exception:
            notes = []
        page = ""
        for txt in texts:
            m = re.search(r"教材\s*P[0-9]+(?:[–—-]P?[0-9]+)?", txt)
            if m:
                page = m.group(0).replace("—", "–")
                break
        notes = [
            note.replace(
                "1-7 尚未取得，不虚构播放。",
                "音频 1-7 文件已在本地来源目录；使用前完成教师语义听核与 PowerPoint 播放确认。",
            ).replace(
                "1-8 尚未取得，不虚构播放。",
                "音频 1-8 文件已在本地来源目录；使用前完成教师语义听核与 PowerPoint 播放确认。",
            )
            for note in notes
        ]
        data.append({"num": num, "texts": texts, "notes": notes, "audio": audio, "page": page})
    return data

online = slide_data(ONLINE)
face = slide_data(FACE)

def esc(s):
    return s.replace("|", "\\|").replace("\n", "；")

def slide_block(prefix, d):
    title = f"### {prefix}第{d['num']:02d}页"
    if d["page"]:
        title += f"｜{d['page']}"
    if d["audio"]:
        title += f"｜音频 {', '.join(d['audio'])}"
    out = [title, "**学生画面文字：**"]
    out.extend([f"> {esc(t)}" for t in d["texts"]])
    if d["notes"]:
        # The locked PPTX retained an old production note saying that 1-7 and
        # 1-8 had not yet been obtained.  The files are now present locally;
        # keep the historical note out of the derived teacher-facing manual
        # while preserving the still-pending semantic/playback check.
        notes = []
        for note in d["notes"]:
            note = note.replace(
                "1-7 尚未取得，不虚构播放。",
                "音频 1-7 文件已在本地来源目录；使用前完成教师语义听核与 PowerPoint 播放确认。",
            ).replace(
                "1-8 尚未取得，不虚构播放。",
                "音频 1-8 文件已在本地来源目录；使用前完成教师语义听核与 PowerPoint 播放确认。",
            )
            notes.append(note)
        out.append("**speaker notes：**")
        out.extend([f"> {esc(t)}" for t in notes])
    return "\n".join(out)

md = []
md.append("# 第一课《丽丽是独生女》教师手册草案")
md.append("")
md.append("| 项目 | 内容 |")
md.append("|---|---|")
md.append("| lesson_key | boya-quasi-intermediate-i:lesson-01 |")
md.append("| 教材 | 《博雅汉语听说：准中级加速篇 I》 |")
md.append("| 课题 | 丽丽是独生女 |")
md.append("| 状态 | 依据系主任已批准的两份 PPTX 整理的教师手册草案，未批准 |")
md.append("| 内容边界 | 只整理批准 PPTX 的文字、页面顺序、音频、教材页码和 speaker notes；未补写 PPT 未提供的内容 |")
md.append("| 音频状态说明 | PPT 原始 speaker notes 中的“1-7／1-8 尚未取得”是历史备注；当前文件状态以 `00-source/audio-manifest.json` 与人工语义听核为准 |")
md.append("")
md.append("## 使用文件")
md.append("")
md.append(f"- [在线预习 PPTX]({ONLINE})（72 页；批准稿，保持锁定）")
md.append(f"- [实体课 PPTX]({FACE})（51 页；批准稿，保持锁定）")
md.append("")
md.append("## 教学目标（实体课 PPT 第 03 页原文）")
md.append("")
md.extend(["- 听懂关于家庭、工作和爱好的主要信息。", "- 用本课词语介绍自己的家庭、学习／工作和爱好。", "- 回答和讨论跟课本主题有关的问题。", "- 根据要求写出并准备一段个人介绍。"])
md.append("")
md.append("## 预习回收")
md.append("")
md.append("在线预习末页要求学生带着以下内容进入实体课：划线的教材（不懂的地方）、48 句常用表达笔记、P10 三栏信息表、P11 个人口语提纲（在线预习第 69 页）。课前检查页还要求学生读过三篇短文、标记不懂处、准备一个要问同学的问题，并完成 48 句常用表达、圈出课堂想用的句子，能够说出家庭、学习／工作和爱好（在线预习第 70–71 页）。")
md.append("")
md.append("实体课开场先看图说出家庭、工作和爱好三个主题（第 01 页），随后按 PPT 第 02 页的路线推进：复习词语 → 开口热身 → 听懂课文 → 学习句式 → 整理信息 → 介绍丽丽 → 介绍自己。未预习学生的处理时间、分组方式和替代任务，PPT 未提供，待人工确认。")
md.append("")
md.append("## 实体课逐节暂存分段")
md.append("")
md.append("以下只是按批准 PPT 的连续页面和现有 section 顺序整理的暂存分段；正式课时、是否跨节、分组与转场时间均未在 PPT 中提供，不能视为已批准课表。")
md.append("")
segments = [(1, 1, 18, "开场、学习路线、暖身与听力练习（1-2 至 1-6）"), (2, 19, 29, "口语练习、短文（一）、家庭介绍与家庭句式"), (3, 30, 40, "短文（二）、工作句式与短文（三）"), (4, 41, 51, "爱好句式、综合表达、个人介绍与短文音频（1-7、1-8）")]
for period, start, end, label in segments:
    md.append(f"### 第{period}节（暂存页面 {start:02d}–{end:02d}）")
    md.append(f"- 页面主题：{label}。")
    md.append(f"- 执行顺序：依次使用实体课 PPT 第 {start:02d} 页至第 {end:02d} 页；每页学生动作和教师提示见下方逐页记录。")
    md.append("- 时间、分组、正式课时与未预习备用方案：PPT 未提供，待人工确认。")
    md.append("")

md.append("## 音频与教材页码")
md.append("")
md.append("实体课 PPT 明确放置的音频及页码如下；音频技术清单另见 `00-source/audio-manifest.json`。")
md.append("")
md.append("| 音频 | 实体课页 | 教材页码 | PPT动作 |")
md.append("|---|---:|---|---|")
for d in face:
    if d["audio"]:
        action = "；".join(t for t in d["texts"] if t not in {"第一课｜丽丽是独生女", f"{d['num']:02d}", d["page"]})
        md.append(f"| {', '.join(d['audio'])} | {d['num']:02d} | {d['page'] or '未标注'} | {esc(action)} |")
md.append("")
md.append("## 教材练习与口语产出 coverage（按 PPT 可见内容）")
md.append("")
md.append("下表只记录 PPT 明确呈现的教材练习、课文介绍和口语产出，不宣称已经覆盖 canonical source 中尚未完成语义审核的全部练习。")
md.append("")
md.append("| 实体课页 | 教材页码 | PPT明确动作／产出 | 答案状态 |")
md.append("|---:|---|---|---|")
coverage_nums = [6,7,8,9,12,18,21,22,24,25,26,27,28,29,31,33,34,35,36,37,38,40,42,43,44,45,47,48,49,50,51]
for n in coverage_nums:
    d = face[n-1]
    relevant = [t for t in d["texts"] if not t.startswith("第一课") and t != f"{n:02d}" and t != d["page"]]
    action = "；".join(relevant)
    status = "PPT未提供唯一答案；开放题按课堂口语产出观察" if any(x in action for x in ["介绍", "请你说说", "回答", "用这个句式说", "听力练习"]) else "按教材页面完成；答案须以参考答案／来源核对为准"
    md.append(f"| {n:02d} | {d['page'] or '—'} | {esc(action)} | {status} |")
md.append("")
md.append("## 词语、句式与教师提示")
md.append("")
md.append("在线预习第 03–33 页逐词呈现本课词语，每页保留词语、拼音、词类、意思、使用场合、例句和扩展说法；实体课第 24–28、33–37、42–45 页逐项要求学生用现有句式各说 1 句。教师提示只采用 PPT speaker notes：先让学生完成个人表达，再针对影响理解的错误做短修补；不得用新例句替换 PPT 内容。完整逐页 notes 见下方。")
md.append("")
md.append("## 开放题答案政策、评量与备用方案")
md.append("")
md.append("- PPT 已明确标注的开放产出（如实体课第 10–17、29、38、48–49 页）不设唯一答案；教师依据学生是否完成 PPT 要求的表达、是否能使用指定课本词语／句式、是否能形成 8–10 句个人介绍进行课堂观察。")
md.append("- 参考答案只可采用 canonical source 或参考答案 PDF 中能够核对的内容；教材未提供答案的题目不补写标准答案。")
md.append("- PPT 未提供正式量表、分数、及格线、每节分钟数、分组、恢复路线和课后作业格式；这些项目待人工确认。")
md.append("- 若音频无法播放，PPT 未提供替代流程；先记录故障并待教师决定是否使用教材原音频或暂停该项。")
md.append("")
md.append("## 在线预习逐页记录（批准 PPT 原文与 notes）")
md.append("")
for d in online:
    md.append(slide_block("在线预习", d))
    md.append("")
md.append("## 实体课逐页记录（批准 PPT 原文与 notes）")
md.append("")
for d in face:
    md.append(slide_block("实体课", d))
    md.append("")
md.append("## 草案状态")
md.append("")
md.append("本文件可用于教师审阅和准备，但不是已批准教师手册；来源语义审核、PBI／正式课时批准、配套材料、PowerPoint 实际播放与教师 rehearsal 尚未完成。")

md_path = OUT / "lesson-01-教师手册-draft.md"
md_path.write_text("\n".join(md), encoding="utf-8")

def set_run_font(run, size=10.5, bold=False):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.bold = bold
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), "Times New Roman")
    rfonts.set(qn("w:hAnsi"), "Times New Roman")
    rfonts.set(qn("w:cs"), "Times New Roman")
    rfonts.set(qn("w:eastAsia"), "KaiTi")
    # Tell Word/LibreOffice that Han characters use the Simplified-Chinese
    # East Asian script.  Without an explicit language hint some renderers
    # classify the whole run as Latin and substitute a font with no CJK
    # glyphs, leaving blank boxes in PDF previews.
    lang = rpr.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        rpr.append(lang)
    lang.set(qn("w:val"), "zh-CN")
    lang.set(qn("w:eastAsia"), "zh-CN")

def add_para(doc, text="", style=None, size=10, bold=False):
    p = doc.add_paragraph(style=style)
    r = p.add_run(text)
    set_run_font(r, size=size, bold=bold)
    return p

doc = Document()
sec = doc.sections[0]
sec.top_margin = Pt(32); sec.bottom_margin = Pt(32); sec.left_margin = Pt(48); sec.right_margin = Pt(48)
normal = doc.styles["Normal"]
normal.font.name = "Times New Roman"; normal.font.size = Pt(10)
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
for name, size in [("Title",18),("Heading 1",15),("Heading 2",13),("Heading 3",11.5)]:
    st=doc.styles[name]; st.font.name="Times New Roman"; st.font.size=Pt(size); st.font.bold=True; st._element.rPr.rFonts.set(qn("w:eastAsia"),"KaiTi")
    st._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    st._element.rPr.rFonts.set(qn("w:cs"), "Times New Roman")
    st_lang = st._element.rPr.find(qn("w:lang"))
    if st_lang is None:
        st_lang = OxmlElement("w:lang")
        st._element.rPr.append(st_lang)
    st_lang.set(qn("w:val"), "zh-CN")
    st_lang.set(qn("w:eastAsia"), "zh-CN")

add_para(doc, "第一课《丽丽是独生女》教师手册草案", style="Title", size=18, bold=True)
add_para(doc, "lesson_key：boya-quasi-intermediate-i:lesson-01｜依据系主任批准 PPTX 整理｜草案，未批准", size=10.5)
add_para(doc, "本手册只整理批准的在线预习与实体课 PPTX 文字、页面顺序、音频、教材页码和 speaker notes。PPT 未提供的正式课时、分组、答案、补充活动和备用流程均标记为待人工确认。", size=10.5)
add_para(doc, "说明：PPT 原始 speaker notes 中的“1-7／1-8 尚未取得”是历史备注；当前文件状态以 00-source/audio-manifest.json 与人工语义听核为准。", size=10.5)

def add_heading(text, level=1):
    p=doc.add_paragraph(style=f"Heading {level}"); r=p.add_run(text); set_run_font(r, size={1:15,2:13,3:11.5}[level], bold=True)

add_heading("一、教学目标",1)
for t in ["听懂关于家庭、工作和爱好的主要信息。","用本课词语介绍自己的家庭、学习／工作和爱好。","回答和讨论跟课本主题有关的问题。","根据要求写出并准备一段个人介绍。"]: add_para(doc,"• "+t)
add_heading("二、预习回收",1)
add_para(doc,"在线预习第 69–72 页要求学生带着划线教材、48 句常用表达笔记、P10 三栏信息表和 P11 个人口语提纲进入实体课；课前检查要求读过三篇短文、标记不懂处、准备一个要问同学的问题，并完成 48 句常用表达。实体课第 1 页先看图说家庭、工作和爱好，第 2 页按 PPT 路线推进。未预习处理时间和分组方式未由 PPT 提供。")
add_heading("三、实体课暂存分段",1)
for period,start,end,label in segments:
    add_heading(f"第{period}节（暂存页面 {start:02d}–{end:02d}）",2)
    add_para(doc,f"页面主题：{label}。依批准 PPT 连续页执行。正式课时、分组、转场和备用方案：PPT 未提供，待人工确认。")
add_heading("四、音频与练习 coverage",1)
add_para(doc,"实体课音频按 PPT 明确编号使用："+"；".join(f"{', '.join(d['audio'])}（第{d['num']:02d}页，{d['page'] or '未标页码'}）" for d in face if d['audio'])+"。教材练习与口语产出仅按 PPT 可见内容记录，不宣称已完成 canonical source 全部练习语义审核。")
add_para(doc,"开放题不设唯一答案；参考答案只能采用 canonical source 或参考答案 PDF 可核对内容。PPT 未提供正式量表、分数、分钟数、分组和恢复路线，均待人工确认。")
add_heading("五、逐页执行记录",1)
for d in online:
    add_heading(f"在线预习第{d['num']:02d}页" + (f"｜{d['page']}" if d['page'] else "") + (f"｜音频 {', '.join(d['audio'])}" if d['audio'] else ""), 2)
    add_para(doc, "学生画面文字：" + "；".join(d["texts"]))
    if d["notes"]: add_para(doc, "speaker notes：" + "；".join(d["notes"]))
for d in face:
    add_heading(f"实体课第{d['num']:02d}页" + (f"｜{d['page']}" if d['page'] else "") + (f"｜音频 {', '.join(d['audio'])}" if d['audio'] else ""), 2)
    add_para(doc, "学生画面文字：" + "；".join(d["texts"]))
    if d["notes"]: add_para(doc, "speaker notes：" + "；".join(d["notes"]))
add_heading("六、草案状态与 blockers",1)
add_para(doc,"本文件可供教师审阅和准备，但不是已批准教师手册。来源语义审核、PBI／正式课时批准、配套材料、PowerPoint 实际播放与教师 rehearsal 尚未完成。")

doc_path = OUT / "lesson-01-教师手册-draft.docx"
doc.save(str(doc_path))
print(md_path)
print(doc_path)
