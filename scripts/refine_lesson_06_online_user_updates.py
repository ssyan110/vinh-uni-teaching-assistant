from copy import deepcopy
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


def set_text(shape, text):
    shape.text = text
    for p in shape.text_frame.paragraphs:
        for run in p.runs:
            run.font.name = 'KaiTi'
            run.font.size = Pt(20)


def slide_text(slide):
    return [sh.text for sh in slide.shapes if hasattr(sh, 'text') and sh.text.strip()]


def find_shape(slide, exact):
    hits = [sh for sh in slide.shapes if hasattr(sh, 'text') and sh.text == exact]
    if len(hits) != 1:
        raise ValueError(f'expected one shape {exact!r}, got {len(hits)}')
    return hits[0]


def find_word_slide(prs, word):
    for slide in prs.slides:
        if any(hasattr(sh, 'text') and sh.text == word for sh in slide.shapes):
            if any(hasattr(sh, 'text') and sh.text.startswith('词类：') for sh in slide.shapes):
                return slide
    raise ValueError(f'word slide not found: {word}')


def add_text(slide, text, left, top, width, height, size=22, bold=False, color=(38, 54, 76)):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Pt(3)
    tf.margin_right = Pt(3)
    tf.margin_top = Pt(2)
    tf.margin_bottom = Pt(2)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    for run in p.runs:
        run.font.name = 'KaiTi'
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = RGBColor(*color)
    return box


def add_pattern_slide(prs, lesson_title, number, page, pattern, examples, picture_blob):
    slide = prs.slides.add_slide(prs.slides[38].slide_layout)
    # Match the existing online deck header and divider line.
    add_text(slide, lesson_title, 0.65, 0.25, 4.5, 0.28, 12, color=(78, 94, 112))
    add_text(slide, f'{number:02d}', 12.0, 0.25, 0.65, 0.28, 12, color=(78, 94, 112))
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.65), Inches(0.69), Inches(12.0), Inches(0.01))
    line.fill.solid(); line.fill.fore_color.rgb = RGBColor(205, 214, 224)
    line.line.fill.background()
    add_text(slide, page, 10.35, 7.02, 2.3, 0.28, 20, color=(78, 94, 112))

    # Reuse the existing divider's image as a quiet visual anchor.
    if picture_blob:
        slide.shapes.add_picture(BytesIO(picture_blob), Inches(9.6), Inches(1.05), width=Inches(2.7), height=Inches(2.8))

    add_text(slide, '句式练习', 0.82, 1.1, 3.0, 0.55, 28, bold=True, color=(76, 92, 111))
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.82), Inches(1.9), Inches(7.9), Inches(0.95))
    card.fill.solid(); card.fill.fore_color.rgb = RGBColor(235, 229, 248)
    card.line.color.rgb = RGBColor(193, 181, 222)
    add_text(slide, pattern, 1.08, 2.08, 7.35, 0.52, 26, bold=True)
    add_text(slide, '课本例句', 0.95, 3.2, 2.0, 0.38, 20, bold=True, color=(95, 111, 128))
    add_text(slide, f'例句1：{examples[0]}\n例句2：{examples[1]}', 0.95, 3.68, 10.8, 1.35, 24, bold=True)
    add_text(slide, '完成教材中的练习。', 0.95, 5.55, 5.2, 0.48, 22, bold=True, color=(76, 92, 111))
    return slide


prs = Presentation(DECK)

# The user explicitly asked to preserve their current learning-goals text.
goals_before = slide_text(prs.slides[2])

vocab = {
    '钢琴': ('名词', 'đàn piano', '我妹妹每天练钢琴。', '这架钢琴的声音很好听。', None),
    '合唱节': ('名词', 'ngày hội hợp xướng', '学校下个月要举办合唱节。', '我们班准备参加合唱节。', None),
    '话剧': ('名词', 'kịch nói; kịch sân khấu', '周末我和朋友去看话剧。', '这部话剧很有意思。', None),
    '交响乐': ('名词', 'nhạc giao hưởng', '爸爸喜欢在晚上听交响乐。', '我第一次听交响乐是在音乐会上。', None),
    '住院': ('动词', 'nằm viện; nhập viện', '他生病了，所以住院了。', '姐姐住院一个星期后回家了。', None),
    '弹': ('动词', 'chơi (đàn piano, guitar...)', '我会弹钢琴。', '她正在学弹吉他。', '扩展：弹＋乐器名称。'),
    '翻译': ('动词', 'dịch; biên dịch', '她正在翻译一篇文章。', '我想把这本书翻译成中文。', None),
    '硕士': ('名词', 'bằng thạc sĩ', '她明年就拿到硕士学位了。', '我姐姐在读硕士。', None),
    '正式': ('形容词', 'trang trọng; chính thức', '明天我们有一个正式会议。', '参加比赛时要穿得正式一点儿。', None),
    '语速': ('名词', 'tốc độ nói', '老师说话的语速很慢。', '请说慢一点儿，语速太快了。', '扩展：口语也常说“说话的速度”。'),
    '代替': ('动词', 'thay thế; thay cho', '我代替同学参加比赛。', '牛奶可以代替水吗？', '扩展用法：A代替B：我代替老师去开会。\n用A代替B：可以用牛奶代替水。\n代替＋人＋动词：我代替他参加比赛。'),
    '充实': ('形容词', 'phong phú; đầy đủ và có ích', '参加社团让我的大学生活很充实。', '今天的学习让我觉得很充实。', '扩展：意思就是内容丰富、很有收获，不觉得无聊。'),
    '忙碌': ('形容词', 'bận rộn', '妈妈每天都过得很忙碌。', '我这个星期都很忙。', '扩展：口语也常说“忙”，例如：我这个星期都很忙。'),
    '排练': ('动词', 'tập dượt; diễn tập', '合唱团每星期排练两次。', '演出前大家都在认真排练。', '扩展：常用在正式表演、演出或活动，意思是反复练习。'),
    '业余': ('形容词', 'nghiệp dư; ngoài giờ làm việc', '我业余时间喜欢唱歌。', '他是一名业余歌手。', '扩展：反义词是“专业”。'),
    '爱好': ('名词', 'sở thích', '我的爱好是听音乐。', '每个人都有自己的爱好。', '扩展：口语也常说“兴趣”，例如：我的兴趣是唱歌。'),
    '研究生': ('名词', 'học viên cao học', '她是一名研究生。', '研究生的学习任务很多。', None),
    '外向': ('形容词', 'hướng ngoại', '小王性格外向，很喜欢交朋友。', '她很外向，第一次见面也不紧张。', '扩展：反义词是“内向”。'),
    '乐观': ('形容词', 'lạc quan', '他遇到困难时总是很乐观。', '我希望自己成为一个乐观的人。', None),
    '相当': ('副词、形容词', 'khá; tương đương', '这家餐厅的菜相当好吃。', '他们的口语能力相当。', '扩展：相当＋形容词，用来比较；也可以表示“一样”，例如：他们的口语能力相当。'),
    '梦想': ('名词', 'ước mơ', '我的梦想是当一名老师。', '她一直努力实现自己的梦想。', None),
    '伟大': ('形容词', 'vĩ đại', '贝多芬是一位伟大的音乐家。', '我觉得母爱很伟大。', None),
    '作家': ('名词', 'nhà văn', '这位作家写过很多小说。', '她长大以后想当作家。', None),
    '作品': ('名词', 'tác phẩm', '我很喜欢这位作家的作品。', '这件作品用了很多颜色。', None),
    '发音': ('名词', 'cách phát âm; phát âm', '老师帮我纠正发音。', '这个词的发音不难。', None),
}

for word, (pos, gloss, ex1, ex2, extension) in vocab.items():
    slide = find_word_slide(prs, word)
    set_text(find_shape(slide, next(t for t in slide_text(slide) if t.startswith('词类：'))), f'词类：{pos}')
    meaning = next(t for t in slide_text(slide) if t.startswith('意思：'))
    set_text(find_shape(slide, meaning), f'意思：{gloss}')
    example = next(t for t in slide_text(slide) if t.startswith('例句1：'))
    set_text(find_shape(slide, example), f'例句1：{ex1}\n例句2：{ex2}')
    # The blank box immediately before the image is the deck's extension box.
    candidates = [sh for sh in slide.shapes if hasattr(sh, 'text') and not sh.text.strip() and sh.top > Inches(5.1)]
    if extension:
        if not candidates:
            raise ValueError(f'extension box missing for {word}')
        set_text(candidates[0], extension)

if slide_text(prs.slides[2]) != goals_before:
    raise AssertionError('learning-goals page changed')

# Add the missing sentence-pattern practice pages after each short-text unit.
# Examples come from canonical-source textbook examples or the textbook short text itself.
lesson_title = '第六课｜大岛参加了学校的合唱团'
divider_picture = next((sh.image.blob for sh in prs.slides[38].shapes if getattr(sh, 'shape_type', None) == 13), None)
patterns = [
    ('教材 P53–54', '相当＋形容词', ('大岛的业余爱好相当多。', '阿里的钢琴弹得相当好。')),
    ('教材 P53–54', '和……相比', ('和山东菜相比，丽丽觉得广东菜更可口。', '和坐公共汽车相比，王红觉得坐地铁更方便。')),
    ('教材 P54–55', '上……的时候', ('李大为上中学二年级的时候开始学习中文。', '大岛上研究生的时候参加了合唱团。')),
    ('教材 P56–57', '没有那么多', ('她来到了陌生的城市，没有那么多朋友来看她了。', '参加合唱团以后，大岛没有那么多时间看话剧了。')),
    ('教材 P56–57', '有得必有失', ('她明白了“有得必有失”的意思。', '参加合唱团以后，大岛的生活更充实也忙碌。')),
]

# Append pages in the existing deck's final section, immediately before the reflection page.
insert_before = prs.slides[49]  # current "我觉得很难的地方" slide
insert_index = list(prs.slides._sldIdLst).index(insert_before._element.getparent().getparent()) if False else 49
new_slides = []
for offset, (page, pattern, examples) in enumerate(patterns):
    new_slides.append(add_pattern_slide(prs, lesson_title, len(prs.slides) + 1, page, pattern, examples, divider_picture))

# Move the newly appended slides before reflection/checklist/ending.
slide_ids = prs.slides._sldIdLst
anchor = list(slide_ids)[49]
new_ids = list(slide_ids)[-len(new_slides):]
for sid in new_ids:
    slide_ids.remove(sid)
    slide_ids.insert(list(slide_ids).index(anchor), sid)

tmp = DECK.with_suffix('.tmp.pptx')
prs.save(tmp)
tmp.replace(DECK)
print(f'slides={len(prs.slides)}')
print(f'sha256={sha256(DECK.read_bytes()).hexdigest()}')
