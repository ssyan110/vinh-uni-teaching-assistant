"""Read the named textbook sources; write only this supplemental app's data."""
import argparse
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
BOOK = 'boya-quasi-intermediate-i'
parser = argparse.ArgumentParser()
parser.add_argument('--source-root', type=Path, required=True)
args = parser.parse_args()
root = args.source_root.resolve(strict=True)
pack = dict(schema_version='1.0.0', pack_id=BOOK+'-nine-grid', class_id=BOOK,
            class_name='博雅汉语听说：准中级加速篇 I', content_revision=2,
            chinese_variant='simplified', textbook_id=BOOK, lessons=[], characters=[],
            vocabulary=[], grammar=[], sentence_patterns=[], sentences=[], exercises=[])
snapshots = []

def append_sentence_patterns(pack, sections, lesson_key, source_file):
    """Flatten the source's common-expression inventory into sentence-pattern prompts."""
    sequence = 0
    def walk(node, topic='', printed_pages=None):
        nonlocal sequence
        if isinstance(node, dict):
            topic = node.get('topic', topic)
            printed_pages = node.get('printed_pages', printed_pages or [])
            expression = node.get('expression')
            if isinstance(expression, str) and expression.strip():
                sequence += 1
                pack['sentence_patterns'].append(dict(
                    item_id=f'{lesson_key}:sentence-pattern:{sequence:02}',
                    pattern=expression.strip(), introduced_lesson_id=lesson_key,
                    topic=topic, printed_pages=printed_pages, source_file=source_file))
            for key in ('items', 'groups'):
                if key in node:
                    walk(node[key], topic, printed_pages)
        elif isinstance(node, list):
            for item in node:
                if isinstance(item, str) and item.strip():
                    sequence += 1
                    pack['sentence_patterns'].append(dict(
                        item_id=f'{lesson_key}:sentence-pattern:{sequence:02}',
                        pattern=item.strip(), introduced_lesson_id=lesson_key,
                        topic=topic, printed_pages=printed_pages or [], source_file=source_file))
                else:
                    walk(item, topic, printed_pages)
    for section in sections:
        walk(section)
for n in range(1, 13):
    key = f'{BOOK}:lesson-{n:02}'
    relative = f'lessons/{BOOK}/lesson-{n:02}/00-source/' + ('source-extraction-draft.json' if n == 1 else 'canonical-source.json')
    path = (root / relative).resolve(strict=True)
    assert path.is_relative_to(root)
    raw = path.read_bytes()
    source = json.loads(raw)
    assert source['lesson_number'] == n
    assert source.get('textbook_id', BOOK) == BOOK
    sections = source['sections']
    vocab = next(s for s in sections if s['id'] == 'vocabulary')
    assert vocab['entries'], f'{key}: missing vocabulary'
    snapshot = dict(lesson_key=key, title=source['title'], source_file=relative,
                    source_sha256=hashlib.sha256(raw).hexdigest(),
                    source_status=source.get('status', source.get('content_inventory', {}).get('status')),
                    vocabulary=vocab,
                    expressions=[s for s in sections if s['id'].startswith('common_expressions')])
    snapshots.append(snapshot)
    append_sentence_patterns(pack, snapshot['expressions'], key, relative)
    pack['lessons'].append(dict(lesson_id=key, lesson_key=key, textbook_id=BOOK,
                               lesson_name=f'第{n}课：{source["title"]}', order=n))
    for category in ['entries', 'proper_nouns', 'idioms']:
        for i, entry in enumerate(vocab.get(category, [])):
            word, pinyin = (entry['word'], entry.get('pinyin', '')) if isinstance(entry, dict) else entry[:2]
            pack['vocabulary'].append(dict(item_id=f'{key}:{category}:{i+1}', word=word, pinyin=pinyin,
                introduced_lesson_id=key, textbook_id=BOOK, source_file=relative,
                source_pointer=f'/sections/{sections.index(vocab)}/{category}/{i}',
                printed_pages=vocab['printed_pages'], vocabulary_category=category))
    approved = f'lessons/{BOOK}/lesson-{n:02}/20-approved/pptx/lesson-{n:02}-在线预习.pptx'
    draft = f'lessons/{BOOK}/lesson-{n:02}/10-design/pptx-draft/online/lesson-{n:02}-在线预习.pptx'
    pptx_relative = approved if (root / approved).is_file() else draft
    pptx_path = (root / pptx_relative).resolve(strict=True)
    assert pptx_path.is_relative_to(root)
    snapshot['pptx_file'] = pptx_relative
    snapshot['pptx_sha256'] = hashlib.sha256(pptx_path.read_bytes()).hexdigest()
    snapshot['pptx_status'] = 'approved_location' if pptx_relative == approved else 'draft_location'
    snapshot['pptx_examples'] = []
    seen_examples = {}
    ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
    with zipfile.ZipFile(pptx_path) as archive:
        slides = sorted((name for name in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', name)), key=lambda name: int(re.search(r'slide(\d+)', name)[1]))
        for slide in slides:
            slide_number = int(re.search(r'slide(\d+)', slide)[1])
            for paragraph_index, paragraph in enumerate(ET.fromstring(archive.read(slide)).findall('.//a:p', ns)):
                text = ''.join(node.text or '' for node in paragraph.findall('.//a:t', ns))
                match = re.fullmatch(r'\s*例句\s*[一二三四五六七八九十\d]*\s*[：:]\s*(.+)', text)
                if not match:
                    continue
                sentence = match[1]
                ref = dict(slide=slide_number, xml=slide, paragraph_index=paragraph_index, raw_paragraph=text)
                if sentence in seen_examples:
                    seen_examples[sentence]['source_refs'].append(ref)
                    continue
                record = dict(item_id=f'{key}:pptx-example:{slide_number}:{paragraph_index}',
                    introduced_lesson_id=key, textbook_id=BOOK, function_kind='pattern-make',
                    prompt=sentence, instruction='先读出例句并解释意思，再用相同的词语或句式说一个自己的句子。教师确认后占格。',
                    source_file=pptx_relative, source_refs=[ref],
                    adaptation='read_pptx_example_then_make_sentence; teacher_judged')
                seen_examples[sentence] = record
                snapshot['pptx_examples'].append(record)
                pack['exercises'].append(record)
    assert any(x['introduced_lesson_id'] == key for x in pack['exercises'])
(APP/'docs/source-snapshot.json').write_text(json.dumps(snapshots, ensure_ascii=False, indent=2)+'\n')
(APP/'public/content/class-content.json').write_text(json.dumps(pack, ensure_ascii=False, indent=2)+'\n')
for s in snapshots:
    v=s['vocabulary']
    print(s['lesson_key'],s['title'],{k:len(v.get(k,[])) for k in ['entries','proper_nouns','idioms']})
print('Occurrences:',len(pack['vocabulary']),'Unique:',len({x['word'].strip() for x in pack['vocabulary']}),'Prompts:',len(pack['exercises']))
