from copy import deepcopy
from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import json

from pptx import Presentation
from pptx.dml.color import RGBColor

ROOT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
L1_ONLINE = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-01/20-approved/pptx/lesson-01-在线预习.pptx'
L2_ONLINE = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-02/20-approved/pptx/lesson-02-在线预习.pptx'

def set_text_preserve_style(shape, value):
    if not hasattr(shape, 'text_frame'):
        return
    runs = [run for para in shape.text_frame.paragraphs for run in para.runs]
    if runs:
        runs[0].text = value
        for run in runs[1:]:
            run.text = ''
    else:
        shape.text = value

def set_all_shape_text(slide, old, new):
    hits = 0
    for shape in slide.shapes:
        if hasattr(shape, 'text') and shape.text == old:
            set_text_preserve_style(shape, new)
            hits += 1
    return hits

def get_nonempty(slide):
    return [shape for shape in slide.shapes if hasattr(shape, 'text') and shape.text.strip()]

def replace_goals_with_l1_style(deck_path):
    prs = Presentation(deck_path)
    target = prs.slides[2]
    current = [shape.text for shape in get_nonempty(target)]
    source = Presentation(L1_ONLINE).slides[2]
    for shape in list(target.shapes):
        target.shapes._spTree.remove(shape._element)
    for shape in source.shapes:
        target.shapes._spTree.append(deepcopy(shape._element))
    copied = get_nonempty(target)
    if len(current) != len(copied):
        raise ValueError(f'{deck_path}: goals shape count changed')
    for shape, value in zip(copied, current):
        set_text_preserve_style(shape, value)
    return prs

def find_examples(value):
    result = {}
    def walk(node):
        if isinstance(node, dict):
            expr = node.get('expression')
            examples = node.get('examples')
            if expr and isinstance(examples, list) and examples:
                result[str(expr)] = [str(x) for x in examples[:2]]
            for child in node.values(): walk(child)
        elif isinstance(node, list):
            for child in node: walk(child)
    walk(value)
    return result

def update_online(lesson_number):
    root = ROOT / f'lessons/boya-quasi-intermediate-i/lesson-{lesson_number:02d}'
    deck = root / '10-design/pptx-draft/online' / f'lesson-{lesson_number:02d}-在线预习.pptx'
    source = json.loads((root / '00-source/canonical-source.json').read_text())
    prs = replace_goals_with_l1_style(deck)
    # All current online drafts use the same seven-step online-prep route.
    tmp = deck.with_suffix('.route.tmp.pptx')
    with ZipFile(deck) as zin, ZipFile(tmp, 'w', ZIP_DEFLATED) as zout, ZipFile(L1_ONLINE) as route_zip:
        route = route_zip.read('ppt/media/image2.png')
        for info in zin.infolist():
            zout.writestr(info, route if info.filename == 'ppt/media/image2.png' else zin.read(info.filename))
    tmp.replace(deck)
    prs = Presentation(deck)
    ext_count = 0
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, 'text') and shape.text.strip() == '扩展：':
                set_text_preserve_style(shape, '')
                ext_count += 1
    examples = find_examples(source)
    changed_grammar = 0
    for slide in prs.slides:
        visible = get_nonempty(slide)
        title = next((shape.text for shape in visible[3:] if shape.text not in {'教材 P'+str(lesson_number), '教材'}), '')
        # Match the actual expression title by looking for a duplicated title
        # shape and a textbook example record. No page is created if the deck
        # has no existing grammar page.
        candidate = next((shape.text for shape in visible if shape.text in examples), None)
        if not candidate:
            continue
        for shape in slide.shapes:
            if hasattr(shape, 'text'):
                if shape.text.startswith('情境：'):
                    set_text_preserve_style(shape, '')
                elif shape.text == '完成教材中的练习。':
                    set_text_preserve_style(shape, '用这个句式写出三句话')
        example_shapes = [shape for shape in slide.shapes if hasattr(shape, 'text') and shape.text.startswith('例句')]
        if len(example_shapes) >= 2:
            values = examples[candidate]
            set_text_preserve_style(example_shapes[0], '例句1：' + values[0])
            set_text_preserve_style(example_shapes[1], '例句2：' + values[1])
            changed_grammar += 1
    tmp = deck.with_suffix('.save.tmp.pptx')
    prs.save(tmp)
    tmp.replace(deck)
    return deck, ext_count, changed_grammar

def update_face(lesson_number):
    root = ROOT / f'lessons/boya-quasi-intermediate-i/lesson-{lesson_number:02d}'
    deck = root / '10-design/pptx-draft/face-to-face' / f'lesson-{lesson_number:02d}-实体课.pptx'
    online = root / '10-design/pptx-draft/online' / f'lesson-{lesson_number:02d}-在线预习.pptx'
    prs = Presentation(deck)
    online_prs = Presentation(online)
    # Face-to-face slide 3 directly uses the current online goals page.
    target = prs.slides[2]
    source = online_prs.slides[2]
    for shape in list(target.shapes):
        target.shapes._spTree.remove(shape._element)
    for shape in source.shapes:
        target.shapes._spTree.append(deepcopy(shape._element))
    # The repeated three speaking prompts use the same 5-word/3-pattern rule.
    changed_prompts = 0
    for slide in prs.slides:
        joined = '\n'.join(shape.text for shape in slide.shapes if hasattr(shape, 'text'))
        if any(key in joined for key in ('说说你对北京的印象。', '说说你在中国或本国学习汉语的情况。', '比较两地学习汉语的异同。')):
            for shape in slide.shapes:
                if hasattr(shape, 'text') and '必须使用10个课本中的词语和5个句式。' in shape.text:
                    set_text_preserve_style(shape, shape.text.replace('必须使用10个课本中的词语和5个句式。', '必须使用5个课本中的词语和3个句式。'))
                    changed_prompts += 1
    tmp = deck.with_suffix('.save.tmp.pptx')
    prs.save(tmp)
    tmp.replace(deck)
    # Face-to-face route uses Lesson 2 online's approved route image.
    tmp = deck.with_suffix('.route.tmp.pptx')
    with ZipFile(deck) as zin, ZipFile(tmp, 'w', ZIP_DEFLATED) as zout, ZipFile(L2_ONLINE) as route_zip:
        route = route_zip.read('ppt/media/image2.png')
        for info in zin.infolist():
            zout.writestr(info, route if info.filename == 'ppt/media/image2.png' else zin.read(info.filename))
    tmp.replace(deck)
    return deck, changed_prompts

for n in range(5, 11):
    online, ext_count, grammar_count = update_online(n)
    face, prompt_count = update_face(n)
    print(f'lesson-{n:02d}: extensions_removed={ext_count} grammar_pages_updated={grammar_count} face_prompts_updated={prompt_count}')
    for path in (online, face):
        manifest = path.parent / 'manifest.json'
        if manifest.exists():
            data = json.loads(manifest.read_text())
            data['sha256'] = sha256(path.read_bytes()).hexdigest()
            data['bytes'] = path.stat().st_size
            data['status'] = 'draft_common_refinement_2026-08-31'
            manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
