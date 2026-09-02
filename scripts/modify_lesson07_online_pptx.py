"""Retired Lesson 07 patch script.

The previous Lesson 07 online-prep PPTX was deleted after the finalized L01-L06
audit.  This patcher contains the old snapshot-based content and must not be
used as a production path.  Future Lesson 07 work must enter through the
lesson-specific content contract and the draft-only builder.
"""

raise SystemExit(
    'Retired Lesson 07 online PPTX patcher; use the lesson-specific content contract and '
    'scripts/build_l23_pptx_drafts.js after content approval.'
)

from copy import deepcopy
from hashlib import sha256
from io import BytesIO
from pathlib import Path
import json

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
DECK = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-07/10-design/pptx-draft/online/lesson-07-在线预习.pptx'
MANIFEST = DECK.parent / 'manifest.json'

FONT_CJK = 'KaiTi'
FONT_LATIN = 'Times New Roman'
INK = (56, 69, 86)
MUTED = (76, 92, 111)
PURPLE = (115, 87, 158)
TEAL = (61, 137, 141)
CORAL = (194, 102, 83)
LINE = (205, 214, 224)

WORDS = [
    '登山', '优美', '热爱', '邻居', '机会', '耐力', '放松', '市民', '挑战', '根本',
    '合作', '浪漫', '羡慕', '地道', '发亮', '不管', '肚子', '感受', '危险', '将来',
    '山顶', '俱乐部', '结交', '害怕', '信心', '愉快'
]

EXAMPLES = {
    '登山': '周末我喜欢和朋友一起登山。',
    '优美': '山里的风景非常优美。',
    '热爱': '他从小就热爱运动。',
    '邻居': '我的邻居也喜欢跑步。',
    '机会': '我希望有机会去爬雪山。',
    '耐力': '长跑可以提高我们的耐力。',
    '放松': '听音乐是我放松的方法。',
    '市民': '很多市民周末到公园运动。',
    '挑战': '爬上这座山是一个挑战。',
    '根本': '我根本不害怕这次比赛。',
    '合作': '我们合作完成了这项任务。',
    '浪漫': '在山顶看日落很浪漫。',
    '羡慕': '我很羡慕他的好体力。',
    '地道': '这家店的牛肉面很地道。',
    '发亮': '她听到这个消息，眼睛发亮。',
    '不管': '不管下不下雨，我都要跑步。',
    '肚子': '我运动以后肚子很饿。',
    '感受': '旅行让我感受到不同的生活。',
    '危险': '下雨天爬山比较危险。',
    '将来': '将来我想参加一次马拉松。',
    '山顶': '我们终于走到了山顶。',
    '俱乐部': '我参加了学校的登山俱乐部。',
    '结交': '参加活动可以结交新朋友。',
    '害怕': '她第一次滑冰时有点儿害怕。',
    '信心': '老师的话给了我很大信心。',
    '愉快': '我们度过了一个愉快的周末。',
}

VIETNAMESE = {
    '登山': 'leo núi', '优美': 'đẹp; duyên dáng', '热爱': 'yêu thích; say mê',
    '邻居': 'hàng xóm', '机会': 'cơ hội', '耐力': 'sức bền; sức chịu đựng',
    '放松': 'thư giãn', '市民': 'người dân thành phố', '挑战': 'thách thức',
    '根本': 'hoàn toàn; căn bản', '合作': 'hợp tác', '浪漫': 'lãng mạn',
    '羡慕': 'ngưỡng mộ; ghen tị', '地道': 'chính gốc; đích thực', '发亮': 'sáng lên; lấp lánh',
    '不管': 'bất kể; dù', '肚子': 'bụng', '感受': 'cảm nhận; cảm giác',
    '危险': 'nguy hiểm', '将来': 'tương lai', '山顶': 'đỉnh núi',
    '俱乐部': 'câu lạc bộ', '结交': 'kết giao; làm quen', '害怕': 'sợ; lo sợ',
    '信心': 'niềm tin; sự tự tin', '愉快': 'vui vẻ; thú vị',
}

POS = {
    '登山': '动词', '优美': '形容词', '热爱': '动词', '邻居': '名词', '机会': '名词',
    '耐力': '名词', '放松': '动词', '市民': '名词', '挑战': '动词', '根本': '副词',
    '合作': '动词', '浪漫': '形容词', '羡慕': '动词', '地道': '形容词', '发亮': '动词',
    '不管': '连词', '肚子': '名词', '感受': '动词', '危险': '形容词', '将来': '名词',
    '山顶': '名词', '俱乐部': '名词', '结交': '动词', '害怕': '动词', '信心': '名词',
    '愉快': '形容词',
}

EXTENSIONS = {
    5: '扩展：口语也常说【爬山】。',
    11: '扩展：表示一个人能够长时间坚持做一件事的能力。',
    13: '扩展：指居住在一个城市里的人。',
    15: '扩展：表示完全、从一开始就是这样，常用在否定句。\n用法：根本+（就）+不/没+动词：他根本（就）不喜欢你。\n加【就】表示强调。\n根本+动词+不+结果补语：我根本听不到你说什么。',
    18: '扩展：口语也常说【罗曼蒂克】。',
    19: '扩展：看到别人有好的东西、条件或经历，自己也希望能有。',
    20: '扩展：台湾常说【道地】。',
    23: '扩展：常用句式：不管……都……。例如：不管天气好不好，我都去跑步。',
    25: '扩展：【感觉】用在日常、直接的感觉；【感受】比较深入、强调内心体验。',
    27: '扩展：口语也常说【未来】。',
    29: '扩展：名词+顶，表示东西的最上面。例如：屋顶、头顶、车顶。',
    31: '扩展：比“认识”更强调建立并发展关系。',
    32: '扩展：口语也常说【怕】。',
    35: '扩展：【愉快】比【开心】正式，常用在写作。',
}

EXPRESSIONS = [
    ('样样都会', '说明一个人在很多方面都会做。', '小张打球、游泳、滑冰样样都会。'),
    ('不管……都……', '表示条件不同，结果不变。', '不管天气好不好，我都去跑步。'),
    ('像……一样', '表示两个人或两件事很相似。', '他像哥哥一样关心我。'),
    ('又（2）', '表示两种情况同时存在。', '登山又累又有意思。'),
    ('根本', '加强否定语气，表示完全不是这样。', '我根本不怕这次挑战。'),
    ('另外', '表示除此以外的另一个情况。', '我喜欢跑步，另外也喜欢登山。'),
    ('虽然……可是……', '先承认一个情况，再说另一个情况。', '虽然登山很累，可是我很喜欢。'),
    ('慢慢地', '表示变化一点一点发生。', '我慢慢地有了登山的信心。'),
    ('不仅如此', '表示还有更进一步的情况。', '登山让我健康，不仅如此，还让我交到朋友。'),
    ('刚开始……慢慢地', '表示先有一种情况，后来逐渐变化。', '刚开始我很害怕，慢慢地就习惯了。'),
    ('动词+上', '表示开始参加或进入某种状态。', '我爱上了周末登山。'),
    ('动词+起来', '表示动作或状态开始并持续。', '大家合作起来更愉快。'),
]


def set_text(shape, text, size=20, color=INK, bold=False, font=FONT_CJK, align=None):
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Pt(3); tf.margin_right = Pt(3); tf.margin_top = Pt(2); tf.margin_bottom = Pt(2)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    if align is not None: p.alignment = align
    run = p.add_run(); run.text = text
    run.font.name = font; run.font.size = Pt(size); run.font.bold = bold; run.font.color.rgb = RGBColor(*color)


def set_mixed_gloss(shape, gloss):
    tf = shape.text_frame; tf.clear(); tf.word_wrap = True
    tf.margin_left = Pt(3); tf.margin_right = Pt(3); tf.margin_top = Pt(2); tf.margin_bottom = Pt(2)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    r = p.add_run(); r.text = '意思：'; r.font.name = FONT_CJK; r.font.size = Pt(20); r.font.color.rgb = RGBColor(*INK)
    r = p.add_run(); r.text = gloss; r.font.name = FONT_LATIN; r.font.size = Pt(20); r.font.color.rgb = RGBColor(*INK)


def add_text(slide, text, left, top, width, height, size=24, color=INK, bold=False, align=None):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    set_text(box, text, size, color, bold, FONT_CJK, align)
    return box


def sid_of(prs, slide):
    return next(sid for sid in prs.slides._sldIdLst if prs.part.related_part(sid.rId) is slide.part)


def insert_slide(prs, index, layout):
    slide = prs.slides.add_slide(layout)
    sld_id = sid_of(prs, slide)
    ids = prs.slides._sldIdLst
    ids.remove(sld_id)
    ids.insert(index, sld_id)
    return slide


def header(slide, page):
    add_text(slide, '第七课｜小张热爱登山', 0.65, 0.25, 4.5, 0.28, 12, MUTED)
    add_text(slide, f'{page:02d}', 12.0, 0.25, 0.65, 0.28, 12, MUTED, align=PP_ALIGN.RIGHT)
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(0.69), Inches(12.0), Inches(0.01))
    line.fill.solid(); line.fill.fore_color.rgb = RGBColor(*LINE); line.line.fill.background()


def make_expression_slide(prs, index, page, expression, function_text, example, template):
    slide = insert_slide(prs, index, template.slide_layout)
    header(slide, page)
    add_text(slide, '句式练习', 0.72, 0.98, 11.6, 0.62, 32, INK, True)
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.85), Inches(1.85), Inches(7.45), Inches(1.15))
    box.fill.solid(); box.fill.fore_color.rgb = RGBColor(238, 232, 249); box.line.color.rgb = RGBColor(185, 164, 215)
    add_text(slide, expression, 1.05, 2.02, 7.05, 0.72, 31 if len(expression) < 12 else 27, PURPLE, True, PP_ALIGN.CENTER)
    add_text(slide, function_text, 0.95, 3.42, 7.25, 0.62, 22, TEAL, True, PP_ALIGN.CENTER)
    add_text(slide, f'例句：{example}', 0.95, 4.38, 7.25, 0.75, 24, INK, True, PP_ALIGN.CENTER)
    add_text(slide, '完成教材中的练习。', 0.95, 5.48, 7.25, 0.5, 22, CORAL, True, PP_ALIGN.CENTER)
    img = next((sh for sh in template.shapes if getattr(sh, 'shape_type', None) == 13), None)
    if img is not None:
        slide.shapes.add_picture(BytesIO(img.image.blob), Inches(8.55), Inches(1.55), width=Inches(3.55), height=Inches(4.05))
    return slide


def main():
    prs = Presentation(DECK)
    before_slide3 = [s.shapes[16].text for s in [prs.slides[2]] if len(s.shapes) > 16]
    # Patch only the 26 vocabulary pages. Learning goals and all non-vocabulary
    # hand-edited text are intentionally left untouched.
    vocab_pages = [5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35]
    for page, word in zip(vocab_pages, WORDS):
        slide = prs.slides[page - 1]
        for sh in slide.shapes:
            if not hasattr(sh, 'text'):
                continue
            if sh.text.startswith('词类：'):
                set_text(sh, f'词类：{POS[word]}', 20, INK)
            elif sh.text.startswith('意思：'):
                set_mixed_gloss(sh, VIETNAMESE[word])
            elif sh.text.startswith('例句1：'):
                set_text(sh, f'例句：{EXAMPLES[word]}', 22, INK)
                sh.height = Inches(0.78)
        if page in EXTENSIONS:
            target = next((sh for sh in slide.shapes if getattr(sh, 'name', '') == 'Text 11'), None)
            if target is None:
                target = slide.shapes.add_textbox(Inches(1.08), Inches(5.27), Inches(4.7), Inches(1.22))
            target.left = Inches(1.08); target.top = Inches(5.22); target.width = Inches(4.75); target.height = Inches(1.28)
            set_text(target, EXTENSIONS[page], 20, TEAL, True)

    # Keep the existing empty divider in place, and add all expression practice
    # after the comprehensive personal-output page, before the existing checks.
    template = prs.slides[39]
    insertion_index = 50  # immediately before the current slide 51
    add_text(template.shapes[3], '句式练习', 32, INK, True) if False else None
    page = 51
    for expression, function_text, example in EXPRESSIONS:
        make_expression_slide(prs, insertion_index, page, expression, function_text, example, template)
        insertion_index += 1; page += 1
    divider = prs.slides[39]
    # The original empty divider remains a visual signpost; it is intentionally
    # not rewritten to avoid disturbing its approved artwork and positioning.
    # Renumber only the three original ending slides moved by the insertion.
    for slide, new_page in zip(list(prs.slides)[62:65], range(64, 67)):
        for sh in slide.shapes:
            if hasattr(sh, 'text') and sh.text in {'51', '52', '53'}:
                set_text(sh, f'{new_page:02d}', 12, MUTED, align=PP_ALIGN.RIGHT)

    tmp = DECK.with_suffix('.tmp.pptx')
    prs.save(tmp)
    tmp.replace(DECK)
    digest = sha256(DECK.read_bytes()).hexdigest()
    manifest = json.loads(MANIFEST.read_text())
    manifest['status'] = 'draft_user_updates_applied_2026-09-01'
    manifest['slide_count'] = len(prs.slides)
    manifest['sentence_practice'] = {'expression_count': len(EXPRESSIONS), 'inserted_before_original_slide': 51}
    manifest['output']['sha256'] = digest
    manifest['output']['bytes'] = DECK.stat().st_size
    manifest['sha256'] = digest
    manifest['bytes'] = DECK.stat().st_size
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'slides': len(prs.slides), 'sha256': digest, 'bytes': DECK.stat().st_size, 'vocabulary': len(WORDS), 'expressions': len(EXPRESSIONS)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
