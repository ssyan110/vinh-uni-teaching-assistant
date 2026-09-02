from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import json

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR


ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
DECK = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-05/10-design/pptx-draft/online/lesson-05-在线预习.pptx'

VOCAB = {
    5: ('合唱', '动词', 'hát hợp xướng; hát đồng ca',
        '我们每周五一起合唱。', '这次合唱很好听。'),
    6: ('迷', '名词', 'người hâm mộ; người mê',
        '我是一个电影迷。', '他是一个足球迷。'),
    7: ('吹', '动词', 'thổi; chơi nhạc cụ hơi',
        '弟弟会吹笛子。', '他正在吹笛子。'),
    8: ('笛子', '名词', 'sáo trúc',
        '她会吹笛子。', '这支笛子的声音很美。'),
    9: ('乐器', '名词', 'nhạc cụ',
        '你会什么乐器？', '我想学一种乐器。'),
    11: ('享受', '动词', 'tận hưởng',
        '我喜欢安静地享受音乐。', '周末我享受一个人的时间。'),
    12: ('火', '形容词、名词', 'nổi tiếng; hot; lửa',
        '最近这首歌很火。', '这家咖啡店在网上很火。'),
    13: ('有神', '形容词', 'sáng ngời; có thần thái',
        '她的眼睛又大又有神。', '老师的眼睛看起来很有神。'),
    14: ('从小', '副词', 'từ nhỏ',
        '我从小喜欢听音乐。', '他从小就学习钢琴。'),
    15: ('积极', '形容词、副词', 'tích cực',
        '她积极参加学校活动。', '我们要积极学习汉语。'),
    17: ('深奥', '形容词', 'thâm sâu; khó hiểu',
        '这本书的内容很深奥。', '这个理论太深奥了。'),
    18: ('中等', '形容词', 'trung bình',
        '我的英语水平是中等。', '他买了一件中等大小的衣服。'),
    19: ('个子', '名词', 'vóc dáng; chiều cao',
        '她个子很高。', '我弟弟个子很矮。'),
    20: ('欣赏', '动词', 'thưởng thức; đánh giá cao',
        '我喜欢欣赏古典音乐。', '我们一起欣赏这首乐曲。'),
    21: ('民族', '名词', 'dân tộc',
        '越南有很多民族。', '这首歌有浓厚的民族特色。'),
    23: ('鼓励', '动词', 'động viên; khuyến khích',
        '老师鼓励我报名HSK 6考试。', '爸爸鼓励我坚持下去。'),
    24: ('耐心', '形容词、名词', 'kiên nhẫn',
        '老师很有耐心。', '学汉语需要耐心。'),
    25: ('亲切', '形容词', 'thân thiện; gần gũi',
        '老师对学生很亲切。', '她的笑容让人觉得亲切。'),
    26: ('理论', '名词', 'lý thuyết',
        '我们先学习音乐理论。', '这个理论不难懂。'),
    27: ('影响', '动词、名词', 'ảnh hưởng; tác động',
        '天气影响心情。', '学习对成绩有影响。'),
    29: ('古典', '形容词', 'cổ điển',
        '我喜欢古典音乐。', '她常听古典乐曲。'),
    30: ('着迷', '动词', 'say mê; bị cuốn hút',
        '他对中国文化很着迷。', '这部电影让我着迷。'),
    31: ('乐曲', '名词', 'bản nhạc; khúc nhạc',
        '这首乐曲很优美。', '我正在欣赏一首乐曲。'),
    32: ('感情', '名词', 'tình cảm',
        '这首歌表达了真挚的感情。', '音乐可以表达人的感情。'),
    34: ('《茉莉花》', '专有名词', 'bài Hoa nhài',
        '我喜欢听《茉莉花》。', '《茉莉花》是一首有名的歌。'),
    35: ('《康定情歌》', '专有名词', 'bài Tình ca Khang Định',
        '我第一次听《康定情歌》。', '《康定情歌》很受大家欢迎。'),
}

EXTENSIONS = {
    6: '扩展用法：名词＋迷，例如：电影迷、足球迷。',
    12: '扩展：还有“很热门”的意思，例如：最近这部电影很火，你看了吗？',
    15: '扩展：反义词是“消极”，例如：他最近很消极，不知道怎么了。',
    17: '扩展：就是很难懂、不容易理解的意思。',
    19: '扩展：常用短语：个子很高、个子很矮。',
    23: '扩展：鼓励＋人＋做某件事情，例如：老师鼓励我报名HSK 6考试。',
    24: '扩展：词类也可以是名词。',
    27: '扩展用法：A影响B，例如：天气影响心情。\n对……有影响，例如：学习对成绩有影响。',
    29: '扩展：反义词是“现代”，例如：我喜欢现代音乐，但我朋友喜欢古典音乐。',
    30: '扩展用法：对……着迷；为……着迷；让／使……着迷。',
}


def set_text_preserve_style(shape, value: str) -> None:
    runs = [run for para in shape.text_frame.paragraphs for run in para.runs]
    if runs:
        runs[0].text = value
        for run in runs[1:]:
            run.text = ''
    else:
        shape.text = value


def shapes_with_text(slide):
    return [shape for shape in slide.shapes if hasattr(shape, 'text')]


def find_shape(slide, starts_with: str):
    for shape in shapes_with_text(slide):
        if shape.text.startswith(starts_with):
            return shape
    raise ValueError(f'找不到文字框：{starts_with}')


def set_font_size(shape, pt: int) -> None:
    for para in shape.text_frame.paragraphs:
        for run in para.runs:
            run.font.size = pt * 12700


def add_youtube_button(slide, label: str, url: str) -> None:
    # Use a fresh button only on the two requested song pages.
    for shape in shapes_with_text(slide):
        if shape.text == label:
            return
    button = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, 6.72 * 914400, 5.05 * 914400, 5.55 * 914400, 0.48 * 914400)
    button.fill.solid()
    button.fill.fore_color.rgb = RGBColor(77, 117, 145)
    button.line.color.rgb = RGBColor(77, 117, 145)
    tf = button.text_frame
    tf.clear()
    tf.margin_left = int(0.08 * 914400)
    tf.margin_right = int(0.08 * 914400)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para = tf.paragraphs[0]
    para.alignment = PP_ALIGN.CENTER
    run = para.add_run()
    run.text = label
    run.font.name = 'KaiTi'
    run.font.size = int(20 * 12700)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.hyperlink.address = url


def main():
    if not DECK.is_file():
        raise FileNotFoundError(DECK)
    before = Presentation(DECK)
    goals_before = [shape.text for shape in shapes_with_text(before.slides[2])]
    prs = before

    for slide_no, (word, pos, vi, ex1, ex2) in VOCAB.items():
        slide = prs.slides[slide_no - 1]
        if find_shape(slide, word).text != word:
            raise ValueError(f'第{slide_no}页词语身份不符')
        find_shape(slide, '词类：').text and set_text_preserve_style(find_shape(slide, '词类：'), f'词类：{pos}')
        set_text_preserve_style(find_shape(slide, '意思：'), f'意思：{vi}')
        example = find_shape(slide, '例句1：')
        if slide_no == 30:
            set_text_preserve_style(example, f'例句1：{ex1}\n例句2：{ex2}\n扩展例句：大家为她的歌声着迷。')
        else:
            set_text_preserve_style(example, f'例句1：{ex1}\n例句2：{ex2}')
        if slide_no in EXTENSIONS:
            ext = next((s for s in shapes_with_text(slide) if abs(s.top / 914400 - 5.33) < 0.03 and abs(s.left / 914400 - 1.1) < 0.03), None)
            if ext is None:
                raise ValueError(f'第{slide_no}页找不到扩展框')
            set_text_preserve_style(ext, EXTENSIONS[slide_no])
            set_font_size(ext, 20)

    # The requested "消极" contrast belongs to 积极 (page 15), not 从小 (page 14).
    wrong_ext = next((s for s in shapes_with_text(prs.slides[13]) if abs(s.top / 914400 - 5.33) < 0.03 and abs(s.left / 914400 - 1.1) < 0.03), None)
    if wrong_ext is None:
        raise ValueError('第14页找不到扩展框')
    set_text_preserve_style(wrong_ext, '')

    slide65 = prs.slides[64]
    title65 = next((s for s in shapes_with_text(slide65) if s.text in {'我学习中文的经历', '我和音乐'}), None)
    prompt65 = next((s for s in shapes_with_text(slide65) if s.text.startswith(('请用三到五句', '请介绍你喜欢的音乐'))), None)
    rule65 = next((s for s in shapes_with_text(slide65) if s.text.startswith(('必须使用', '请说三到五句'))), None)
    if not all((title65, prompt65, rule65)):
        raise ValueError('第65页找不到音乐介绍内容框')
    set_text_preserve_style(title65, '我和音乐')
    set_text_preserve_style(prompt65, '请介绍你喜欢的音乐。')
    set_text_preserve_style(rule65, '请说三到五句。')

    slide68 = prs.slides[67]
    title68 = next((s for s in shapes_with_text(slide68) if s.text in {'我的个人介绍', '介绍我喜欢的一个人'}), None)
    intro68 = next((s for s in shapes_with_text(slide68) if s.text.startswith(('按照三段', '介绍一个你喜欢的人'))), None)
    if not title68 or not intro68:
        raise ValueError('第68页找不到个人介绍内容框')
    set_text_preserve_style(title68, '介绍我喜欢的一个人')
    set_text_preserve_style(intro68, '介绍一个你喜欢的人：喜欢谁、为什么喜欢，并介绍一下这个人。')
    intro68.width = int(11.2 * 914400)
    for shape in shapes_with_text(slide68):
        if shape.text == '北京印象': set_text_preserve_style(shape, '喜欢谁')
        elif shape.text == '你对北京有什么印象？': set_text_preserve_style(shape, '你喜欢谁？')
        elif shape.text == '中文学习': set_text_preserve_style(shape, '为什么喜欢')
        elif shape.text == '你在哪里学习汉语？': set_text_preserve_style(shape, '你为什么喜欢他／她？')
        elif shape.text == '学习比较': set_text_preserve_style(shape, '介绍这个人')
        elif shape.text == '哪里学习汉语更有效率？': set_text_preserve_style(shape, '请介绍一下这个人。')
        elif shape.text.startswith('至少使用课本'): set_text_preserve_style(shape, '说10到12句，至少100个字。')

    add_youtube_button(prs.slides[33], '点击听《茉莉花》', 'https://www.youtube.com/watch?v=Os4dV1OIWZY&list=RDOs4dV1OIWZY&start_radio=1')
    add_youtube_button(prs.slides[34], '点击听《康定情歌》', 'https://www.youtube.com/watch?v=tf2albPYUEk&list=RDtf2albPYUEk&start_radio=1')

    # Protect the user's manually edited learning goals and ensure no other slide lost text.
    after_goals = [shape.text for shape in shapes_with_text(prs.slides[2])]
    if goals_before != after_goals:
        raise AssertionError('第3页学习目标发生变化，停止写入')

    tmp = DECK.with_suffix('.user-update.tmp.pptx')
    prs.save(tmp)
    tmp.replace(DECK)

    manifest = DECK.parent / 'manifest.json'
    if manifest.is_file():
        data = json.loads(manifest.read_text())
        data['sha256'] = sha256(DECK.read_bytes()).hexdigest()
        data['bytes'] = DECK.stat().st_size
        data['status'] = 'draft_user_refinement_2026-09-01'
        manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'updated {DECK}')
    print(f'sha256 {sha256(DECK.read_bytes()).hexdigest()}')


if __name__ == '__main__':
    main()
