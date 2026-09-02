from io import BytesIO
from hashlib import sha256
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
DECK = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-06/10-design/pptx-draft/online/lesson-06-在线预习.pptx'

prs = Presentation(DECK)

def add_text(slide, text, left, top, width, height, size=28, bold=False, color=(76, 92, 111)):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame; tf.clear(); tf.word_wrap = True
    tf.margin_left = Pt(3); tf.margin_right = Pt(3); tf.margin_top = Pt(2); tf.margin_bottom = Pt(2)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.text = text
    for run in p.runs:
        run.font.name = 'KaiTi'; run.font.size = Pt(size); run.font.bold = bold; run.font.color.rgb = RGBColor(*color)
    return box

def add_divider(picture_blob, page_number):
    slide = prs.slides.add_slide(prs.slides[38].slide_layout)
    add_text(slide, '第六课｜大岛参加了学校的合唱团', 0.65, 0.25, 4.5, 0.28, 12, color=(78, 94, 112))
    add_text(slide, f'{page_number:02d}', 12.0, 0.25, 0.65, 0.28, 12, color=(78, 94, 112))
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(0.69), Inches(12.0), Inches(0.01))
    line.fill.solid(); line.fill.fore_color.rgb = RGBColor(205, 214, 224); line.line.fill.background()
    add_text(slide, '句式练习', 0.82, 2.25, 6.6, 0.8, 32, bold=True)
    if picture_blob:
        slide.shapes.add_picture(BytesIO(picture_blob), Inches(7.35), Inches(1.35), width=Inches(3.8), height=Inches(3.95))
    return slide

def sid_of(slide):
    return next(sid for sid in prs.slides._sldIdLst if prs.part.related_part(sid.rId) is slide.part)

def move_before(slide, anchor):
    ids = prs.slides._sldIdLst; sid = sid_of(slide); ids.remove(sid); ids.insert(list(ids).index(sid_of(anchor)), sid)

def find_by_text(text):
    for slide in prs.slides:
        if any(hasattr(sh, 'text') and sh.text == text for sh in slide.shapes):
            return slide
    raise ValueError(text)

picture_blob = next((sh.image.blob for sh in prs.slides[38].shapes if getattr(sh, 'shape_type', None) == 13), None)
patterns = {
    '相当＋形容词': find_by_text('相当＋形容词'),
    '和……相比': find_by_text('和……相比'),
    '上……的时候': find_by_text('上……的时候'),
    '没有那么多': find_by_text('没有那么多'),
    '有得必有失': find_by_text('有得必有失'),
}
short2_record = find_by_text('短文二：记录练习')
short3_divider = find_by_text('短文（三）')
reflection = find_by_text('我觉得很难的地方')

div2 = add_divider(picture_blob, 58)
div3 = add_divider(picture_blob, 59)
# Move all sentence materials out of the temporary end position and into their
# corresponding short-text unit.
move_before(patterns['相当＋形容词'], short2_record)
move_before(patterns['和……相比'], short2_record)
move_before(div2, short3_divider)
move_before(patterns['上……的时候'], short3_divider)
move_before(div3, reflection)
move_before(patterns['没有那么多'], reflection)
move_before(patterns['有得必有失'], reflection)

tmp = DECK.with_suffix('.tmp.pptx'); prs.save(tmp); tmp.replace(DECK)
print(f'slides={len(prs.slides)}')
print(f'sha256={sha256(DECK.read_bytes()).hexdigest()}')
