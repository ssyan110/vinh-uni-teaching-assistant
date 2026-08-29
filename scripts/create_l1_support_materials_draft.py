from pathlib import Path
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-01/10-design/support-materials')
ROOT.mkdir(parents=True, exist_ok=True)

def set_run_font(run, east='KaiTi', latin='Times New Roman', size=12, bold=False):
    run.font.name = latin
    run.font.size = Pt(size)
    run.bold = bold
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.rFonts
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts'); rPr.append(rFonts)
    rFonts.set(qn('w:eastAsia'), east)
    rFonts.set(qn('w:ascii'), latin); rFonts.set(qn('w:hAnsi'), latin)
    # Explicitly label Han text as Simplified Chinese so Office renderers do
    # not classify the entire run as Latin and drop CJK glyphs in PDF export.
    lang = rPr.find(qn('w:lang'))
    if lang is None:
        lang = OxmlElement('w:lang'); rPr.append(lang)
    lang.set(qn('w:val'), 'zh-CN'); lang.set(qn('w:eastAsia'), 'zh-CN')

def style_doc(doc):
    sec = doc.sections[0]
    sec.top_margin = Inches(.65); sec.bottom_margin = Inches(.65)
    sec.left_margin = Inches(.7); sec.right_margin = Inches(.7)
    for style_name in ['Normal','Body Text']:
        st = doc.styles[style_name]
        st.font.name = 'Times New Roman'; st.font.size = Pt(12)
        st._element.rPr.rFonts.set(qn('w:eastAsia'), 'KaiTi')
        st._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
        st._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
        st._element.rPr.rFonts.set(qn('w:cs'), 'Times New Roman')
        lang = st._element.rPr.find(qn('w:lang'))
        if lang is None:
            lang = OxmlElement('w:lang'); st._element.rPr.append(lang)
        lang.set(qn('w:val'), 'zh-CN'); lang.set(qn('w:eastAsia'), 'zh-CN')

def add_title(doc, text, subtitle=None):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run(text); set_run_font(r,size=18,bold=True)
    if subtitle:
        p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=p.add_run(subtitle); set_run_font(r,size=11)

def add_heading(doc, text, level=1):
    p=doc.add_paragraph(); r=p.add_run(text); set_run_font(r,size=14 if level==1 else 12,bold=True); return p

def add_para(doc, text, size=12, bold=False):
    p=doc.add_paragraph(); r=p.add_run(text); set_run_font(r,size=size,bold=bold); return p

def add_table(doc, headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; c.text=''; c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        r=c.paragraphs[0].add_run(h); set_run_font(r,bold=True)
    for row in rows:
        cells=t.add_row().cells
        for i,val in enumerate(row):
            cells[i].text=''; cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            r=cells[i].paragraphs[0].add_run(val); set_run_font(r)
    if widths:
        for row in t.rows:
            for i,w in enumerate(widths): row.cells[i].width=Inches(w)
    return t

def save(doc, name):
    style_doc(doc); doc.save(ROOT/name)

# Pre-study card
d=Document(); add_title(d,'第一课 预习卡','丽丽是独生女｜家庭 · 工作 · 爱好')
add_para(d,'姓名：____________________    日期：____________________')
add_heading(d,'一、读教材并做标记')
add_para(d,'阅读教材第5—9页的三篇短文。圈出你认识的词语，在不懂的地方做标记。')
add_table(d,['短文','教材页码','我已完成'],[['短文（一）家庭信息','P5—6','□'],['短文（二）工作信息','P7—8','□'],['短文（三）爱好信息','P8—9','□']],[2.4,1.2,1.0])
add_heading(d,'二、整理三栏信息')
add_para(d,'根据短文填写关键词，不必写完整句子。')
add_table(d,['家庭','工作','爱好'],[['成员：\n职业：\n对去北京的态度：','单位：\n职位：\n时间：\n表现：','爱好：\n原因：\n有意思的事：']],[2.3,2.3,2.3])
add_heading(d,'三、准备个人介绍')
add_para(d,'按照三段准备自己的信息：家庭；学习／工作；兴趣爱好。至少使用本课三个常用表达。')
add_table(d,['我的家庭','我的学习／工作','我的兴趣爱好'],[['\n\n','\n\n','\n\n']],[2.3,2.3,2.3])
add_para(d,'我的口语提纲（6—8句话）：\n1. ________________________________________________\n2. ________________________________________________\n3. ________________________________________________\n4. ________________________________________________\n5. ________________________________________________\n6. ________________________________________________\n7. ________________________________________________\n8. ________________________________________________')
add_heading(d,'四、常用表达自我检查')
add_para(d,'完成16项表达，每项3句，共48句。请在自己的笔记中完成。')
add_para(d,'□ 已完成48句    □ 已圈出课堂想说的句子    □ 能说出家庭、学习／工作和爱好')
add_heading(d,'五、带到实体课')
add_para(d,'□ 划线的教材    □ 48句常用表达笔记    □ P10三栏信息表    □ P11个人口语提纲    □ 一个要问同学的问题')
save(d,'lesson-01-预习卡-draft.docx')

# Activity card
d=Document(); add_title(d,'第一课 活动卡01','家庭、工作与爱好：个人介绍准备')
add_para(d,'姓名：____________________    同伴：____________________')
add_heading(d,'任务')
add_para(d,'整理信息，完成丽丽与自己的介绍。先根据教材信息说丽丽，再说自己的家庭、学习／工作和兴趣爱好。')
add_heading(d,'一、介绍丽丽（依据教材）')
add_para(d,'教材页码：P6、P7—8、P8—9、P10')
add_table(d,['家庭','工作','爱好'],[['成员／职业／对去北京的态度：\n\n','单位／职位／时间／表现：\n\n','爱好／原因／有意思的事：\n\n']],[2.3,2.3,2.3])
add_para(d,'用6—8句介绍丽丽：\n__________________________________________________\n__________________________________________________\n__________________________________________________\n__________________________________________________')
add_heading(d,'二、回答课本问题')
add_para(d,'依据课本回答；先说答案，再说短文里的一个信息。')
add_table(d,['问题','我的回答关键词'],[['丽丽的父母为什么担心？','____________________________'],['丽丽为什么去北京？','____________________________'],['丽丽觉得新工作怎么样？','____________________________'],['为什么丽丽有时候很晚才能睡觉？','____________________________'],['丽丽喜欢做哪些事？','____________________________'],['哪个爱好对工作有帮助？','____________________________']],[3.9,2.5])
add_heading(d,'三、我的个人介绍')
add_para(d,'教材页码：P11。说8—10句，必须使用10个课本中的词语和5个句式。')
add_table(d,['家庭','学习／工作','兴趣爱好'],[['\n\n\n','\n\n\n','\n\n\n']],[2.3,2.3,2.3])
add_para(d,'我准备说的句子：\n1. ________________________________________________\n2. ________________________________________________\n3. ________________________________________________\n4. ________________________________________________\n5. ________________________________________________\n6. ________________________________________________\n7. ________________________________________________\n8. ________________________________________________\n9. ________________________________________________\n10. _______________________________________________')
save(d,'lesson-01-活动卡01-家庭工作爱好-draft.docx')

# Rubric
d=Document(); add_title(d,'第一课 口语评量表','个人介绍任务')
add_para(d,'姓名：____________________    日期：____________________    评量者：____________________')
add_para(d,'任务：介绍自己的家庭、学习／工作和兴趣爱好；说8—10句；使用10个课本中的词语和5个句式（教材P11）。')
add_table(d,['项目','达到要求','需要再做一次','记录'],[
 ['内容覆盖','家庭、学习／工作、兴趣爱好三部分都有信息','有一部分缺少信息','________________'],
 ['语言使用','使用10个课本词语和5个句式','数量不足','________________'],
 ['口语长度','完成8—10句','少于8句或超过10句','________________'],
 ['回答与说明','能根据课本问题回答，并提供课文信息','回答不完整或没有课文信息','________________'],
], [1.35,2.65,2.1,1.2])
add_heading(d,'教师／同伴记录')
add_para(d,'做得好的地方：\n__________________________________________________\n需要再做的地方：\n__________________________________________________\n重做后的变化：\n__________________________________________________')
save(d,'lesson-01-评量表-draft.docx')

# 课末检查
d=Document(); add_title(d,'第一课 课末检查','丽丽是独生女')
add_para(d,'姓名：____________________    日期：____________________')
add_heading(d,'今天结束前，请完成')
add_para(d,'1. 我已经读过三篇短文，并在教材上标记了不懂的地方。\n□ 能    □ 还需要练习')
add_para(d,'2. 我完成了48句常用表达，并圈出了课堂想使用的句子。\n□ 能    □ 还需要练习')
add_para(d,'3. 我能说出家庭、学习／工作和爱好。\n□ 能    □ 还需要练习')
add_para(d,'4. 我准备了一个要问同学的问题。\n□ 能    □ 还需要练习')
add_para(d,'5. 我完成了P11个人口语提纲，并准备说6—8句话。\n□ 能    □ 还需要练习')
save(d,'lesson-01-课末检查-draft.docx')
