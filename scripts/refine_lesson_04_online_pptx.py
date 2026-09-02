from copy import deepcopy
from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from pptx import Presentation

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
DECK = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-04/10-design/pptx-draft/online/lesson-04-在线预习.pptx'
L1 = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx'

def texts(slide):
    return [sh.text for sh in slide.shapes if hasattr(sh, 'text') and sh.text.strip()]

def set_shape_text(slide, old, new):
    hits = 0
    for sh in slide.shapes:
        if hasattr(sh, 'text') and sh.text == old:
            sh.text = new
            hits += 1
    return hits

def replace_in_shape(slide, old, new):
    hits = 0
    for sh in slide.shapes:
        if hasattr(sh, 'text') and old in sh.text:
            sh.text = sh.text.replace(old, new)
            hits += 1
    return hits

prs = Presentation(DECK)
l1 = Presentation(L1)

# Preserve the current Lesson 4 goal wording, but copy the complete Lesson 1
# goals-page visual body (number boxes, title hierarchy, colors and text levels).
goal_texts = [
    '听懂关于家庭、工作和爱好的主要信息。',
    '用本课词语介绍自己的家庭、学习／工作和爱好。',
    '回答和讨论跟课本主题有关的问题。',
    '根据要求写出并准备一段个人介绍。',
]
old_goal = prs.slides[2]
new_goal = l1.slides[2]
for sh in list(old_goal.shapes)[3:]:
    old_goal.shapes._spTree.remove(sh._element)
for sh in list(new_goal.shapes)[3:]:
    old_goal.shapes._spTree.append(deepcopy(sh._element))
# The copied page has Lesson 1's goal strings; replace only those strings.
goal_candidates = [sh for sh in old_goal.shapes if hasattr(sh, 'text') and sh.text.strip()]
for sh in goal_candidates:
    for i, old in enumerate([
        '听懂关于家庭、工作和爱好的主要信息。',
        '用本课词语介绍自己的家庭、学习／工作和爱好。',
        '回答和讨论跟课本主题有关的问题。',
        '根据要求写出并准备一段个人介绍。',
    ]):
        if sh.text == old:
            sh.text = goal_texts[i]

# Extensions: add only the explicitly requested ones; remove blank extension labels.
extensions = {
    6: '扩展：中国人常常称呼司机“师傅”。',
    7: '扩展：麦当劳、肯德基是什么意思？',
    9: '扩展：口语常用“看书”代替“阅读”。',
    19: '扩展：加倍＋动词。',
    24: '扩展用法：给＋人＋留下＋形容词＋印象。',
    26: '扩展：口语也常说“聊天”。',
    30: '扩展：口语也常说“不一样的地方”。',
    31: '扩展：名词／动词＋量，例如饭量、工作量；短语＋的量，例如我今天吃菜的量比较少。',
}
for n in range(5, 33):
    slide = prs.slides[n-1]
    ext_shapes = [sh for sh in slide.shapes if hasattr(sh, 'text') and sh.text.strip().startswith('扩展')]
    if n in extensions:
        if not ext_shapes:
            raise ValueError(f'slide {n}: extension label missing')
        ext_shapes[0].text = extensions[n]
        for sh in ext_shapes[1:]: sh.text = ''
    else:
        for sh in ext_shapes: sh.text = ''

# Vocabulary corrections.
set_shape_text(prs.slides[14], '词类：动词', '词类：动词、名词')
set_shape_text(prs.slides[14], '例句1：他很快习惯了早起。\n例句2：我还没有习惯这里的天气。', '例句1：他很快习惯了早起。\n例句2：小明有很好的生活习惯。')
set_shape_text(prs.slides[17], '例句1：我打开字幕学习发音。\n例句2：没有字幕，我听不懂这部电影。', '例句1：我打开字幕学习发音。\n例句2：没有字幕，我看不懂这部电影。')
set_shape_text(prs.slides[20], '意思：词和表达', '意思：词和短语')
set_shape_text(prs.slides[24], '词类：—', '词类：形容词')
set_shape_text(prs.slides[30], '意思：数量或分量', '意思：数量')

# Sentence-pattern pages: remove the old situation line and use the requested action.
for n in range(38, 64):
    slide = prs.slides[n-1]
    for sh in slide.shapes:
        if hasattr(sh, 'text'):
            if sh.text.startswith('情境：'):
                sh.text = ''
            elif sh.text == '完成教材中的练习。':
                sh.text = '用这个句式写出三句话'

examples = {
    38: '例句1：今年我上大学二年级。\n例句2：我的语伴是大四的学生。',
    39: '例句1：我想报考英语专业。\n例句2：我大学学习的专业是金融。',
    40: '例句1：那都是过去的事了，别说了。\n例句2：我爱哭？那是小时候的事了。',
    41: '例句1：我在书包里高兴地发现了100块人民币。\n例句2：爸爸吃惊地发现他的工作没了。',
    42: '例句1：越南的街上到处都是摩托车。\n例句2：在这里到处都是咖啡店。',
    43: '例句1：上老师的课有趣，又有很多收获。\n例句2：这家饭馆价钱便宜，东西又好吃，我们吃了很多道菜。',
    48: '例句1：周末我和同学通常去咖啡店学习。\n例句2：我通常晚上十点睡觉。',
    49: '例句1：看中文电影既可以练习听力，又可以知道有趣的事情。\n例句2：来学校上课既可以交朋友，又可以学新的东西。',
    50: '例句1：我说中文说得很流利，不过发音还不太好。\n例句2：我想转学，不过我不知道选哪个学校。',
    51: '例句1：我决定利用暑假去实习。\n例句2：我觉得英语太难了，所以我决定学汉语。',
    52: '例句1：快放假了，我得加倍努力工作。\n例句2：我们要加倍珍惜大学时光。',
    57: '例句1：大家每天都花两个小时左右学习中文。\n例句2：今天我们要写一篇100字左右的短文。',
    58: '例句1：今天太冷了，班上只有5名学生来上课。\n例句2：丽丽每个星期只上15节课。',
    59: '例句1：老师只教两门课，一门是写作课，另外一门是听说课。\n例句2：我有两个好朋友，一名是越南人，另外一名是中国人。',
    60: '例句1：写作业的时候要用上新学的词语和句式才行。\n例句2：我的妹妹考上了荣市大学中文专业。',
    61: '例句1：去中国以后，用汉语的机会多一些。\n例句2：开始工作以后，阅读的时间少了一些。',
    63: '例句1：大家好，我先说两句话。\n例句2：明天我想和朋友去图书馆借几本书。',
}
for n, val in examples.items():
    slide = prs.slides[n-1]
    old = [sh for sh in slide.shapes if hasattr(sh, 'text') and sh.text.startswith('例句')]
    if len(old) < 2: raise ValueError(f'slide {n}: example boxes missing')
    old[0].text, old[1].text = val.split('\n', 1)

# Slide 62 becomes two focused pages, one for each result complement.
src = prs.slides[61]
second = prs.slides.add_slide(src.slide_layout)
for sh in src.shapes:
    second.shapes._spTree.append(deepcopy(sh._element))
def page_text(slide, title, examples_text):
    example_lines = examples_text.split('\n', 1)
    example_shapes = [sh for sh in slide.shapes if hasattr(sh, 'text') and sh.text.startswith('例句：')]
    for sh in slide.shapes:
        if hasattr(sh, 'text'):
            if sh.text == '记得住／看得清楚': sh.text = title
    if len(example_shapes) >= 2:
        example_shapes[0].text, example_shapes[1].text = example_lines
    # Shape 7 is the original situation line; reuse its formatting for the explanation.
    blanks = [sh for sh in slide.shapes if hasattr(sh, 'text') and not sh.text.strip() and sh.top > 2.5*914400 and sh.top < 3.6*914400]
    if blanks:
        blanks[0].text = '说明：动词＋得＋结果：表示有能力做到、能够达到某种结果。否定形式：动词＋不＋结果。'
page_text(src, '记得住', '例句1：这么多生词，我记不住！\n例句2：我们一个星期只学一点儿新的句式，我记得住。')
page_text(second, '看得清楚', '例句1：你坐得很远，看得清楚吗？\n例句2：我坐在教室后面，黑板上的字我也看得清楚。')
# Move the duplicated page directly after the original.
slide_ids = prs.slides._sldIdLst
second_sldid = slide_ids[-1]
slide_ids.remove(second_sldid)
src_sldid = list(slide_ids)[61]
slide_ids.insert(list(slide_ids).index(src_sldid) + 1, second_sldid)

set_shape_text(prs.slides[67], '哪里学习汉语更有效率？', '哪里学习汉语更有效率？为什么？')

tmp = DECK.with_suffix('.tmp.pptx')
prs.save(tmp)
tmp.replace(DECK)
print('slides', len(prs.slides))
print('sha256', sha256(DECK.read_bytes()).hexdigest())
