"""Derive the player catalog from current exam, weekly maps and lesson manifests."""
import csv
import hashlib
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import qrcode

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
registry = json.loads((ROOT / 'course/lesson-registry.json').read_text())
books = {b['textbook_id']: {'id': b['textbook_id'], 'title': b['title'], 'sets': []} for b in registry['textbooks']}

def track(path, audio_id, lesson, title, **extra):
    target = (ROOT / path).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError(f'Audio escapes project: {path}')
    return dict(id=audio_id, lesson=lesson, title=title, file=os.path.relpath(target, OUT) if target.is_file() else None, **extra)

management = json.loads((ROOT / 'lessons/boya-elementary-i/assessment-management.json').read_text())
books['boya-elementary-i']['management_url'] = management['url'] + '#gid=' + str(management['index_sheet']['sheet_id'])
exam = next(e for e in management['exams'] if e['exam_id'] == management['current_review_exam_id'])
folder = ROOT / exam['directory']
manifest = json.loads((folder / 'audio-manifest.json').read_text())
tracks = [track(str(Path(exam['directory']) / t['file']), t['audio_id'], int(t['audio_id'].split('-')[0]), t['title'], questions=t['question_range'], duration=t['duration_seconds']) for t in manifest]
assert len(tracks) == 15 and all(t['file'] for t in tracks)
assert all(hashlib.sha256((folder / t['file']).read_bytes()).hexdigest() == t['sha256'] for t in manifest)
assert sorted(q for t in manifest for q in t['question_ids']) == list(range(1, 51))
sections = json.loads((OUT / 'form-sections.json').read_text())
assert sections['assessment_id'] == exam['exam_id'] and sections['form_id'] == exam['form_id']
assert [audio_id for s in sections['sections'] for audio_id in s['audio_ids']] == [t['id'] for t in tracks]
for t in tracks:
    section = next(s for s in sections['sections'] if t['id'] in s['audio_ids'])
    t['section_id'] = section['id']
    t['section_title'] = section['title']
books['boya-elementary-i']['sets'].append(dict(id=exam['exam_id'], week='04', label='Week 4 · 第5–10课综合测验', status='测验内容已批准 · 15段对话 · 50题', tracks=tracks, dashboard=os.path.relpath(folder / 'dashboard.html', OUT)))
books['boya-elementary-i']['sets'][0]['tools'] = [
    dict(label='本卷成绩', url=management['url'] + '#gid=' + str(exam['grade_sheet_id']) if exam.get('grade_sheet_id') else f'https://docs.google.com/spreadsheets/d/{exam["response_spreadsheet_id"]}/edit#gid={exam["response_sheet_id"]}'),
    dict(label='题库／答案', url=management['url'] + '#gid=' + str(exam.get('paper_sheet_id', exam['question_bank_sheet_id'])) + ('&fvid=' + str(exam['paper_filter_view_id']) if exam.get('paper_filter_view_id') else '')),
    dict(label='音频管理表', url=management['url'] + '#gid=' + str(exam['audio_sheet_id'])),
    dict(label='评分／表单回应', url=exam['form_edit_url'] + '#responses'),
    dict(label='表单设置', url=exam['form_edit_url'] + '#settings'),
]
entry = json.loads((OUT / 'form-entry.json').read_text())
assert entry['assessment_id'] == exam['exam_id'] and entry['formId'] == exam['form_id']
url = entry['responderUri']
parsed = urlparse(url)
assert parsed.scheme == 'https' and parsed.netloc == 'docs.google.com' and parsed.path.startswith('/forms/d/e/') and parsed.path.endswith('/viewform')
state = entry.get('publishSettings', {}).get('publishState', {})
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=4)
qr.add_data(url)
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save(OUT / 'w04-student-qr.png')
books['boya-elementary-i']['sets'][0]['exam'] = dict(title=entry['title'], url=url, qr='w04-student-qr.png', open=state.get('isPublished') is True and state.get('isAcceptingResponses') is True, checked_at=entry['checked_at'])
# Registered drafts have the same question-group mapping as the future Form,
# but never expose a student entry before publication and synchronization.
for draft in management['exams']:
    if not draft.get('dashboard_draft'):
        continue
    draft_dir = ROOT / draft['directory']
    draft_bank = json.loads((draft_dir / 'items.json').read_text())
    draft_audio = json.loads((draft_dir / 'audio-manifest.json').read_text())
    draft_sections = json.loads((draft_dir / 'form-sections.json').read_text())['sections']
    assert draft_bank['exam_id'] == draft['exam_id']
    assert len(draft_bank['items']) == draft['question_count']
    assert sum(q['points'] for q in draft_bank['items']) == draft['points']
    assert len(draft_audio) == len(draft_sections) == draft['audio_count']
    draft_tracks, covered = [], []
    for section, source_track in zip(draft_sections, draft_audio):
        assert section['audio_ids'] == [source_track['audio_id']]
        questions = draft_bank['items'][section['question_start']-1:section['question_end']]
        assert all(q['audio_id'] == source_track['audio_id'] for q in questions)
        assert [q['id'] for q in questions] == source_track['question_ids']
        covered.extend(q['id'] for q in questions)
        audio_file = draft_dir / source_track['file']
        assert hashlib.sha256(audio_file.read_bytes()).hexdigest() == source_track['sha256']
        lesson_numbers = sorted({int(key.rsplit('-', 1)[1]) for q in questions for key in q['lesson_keys']})
        assert lesson_numbers
        lesson = lesson_numbers[0]
        draft_tracks.append(track(str(audio_file.relative_to(ROOT)), source_track['audio_id'], lesson,
            '第'+source_track['question_range']+'题', questions=source_track['question_range'],
            duration=source_track['duration_seconds'], lessons=lesson_numbers, section_id=section['id'],
            section_title=section['title'], section_question_ids=source_track['question_ids']))
    assert covered == [q['id'] for q in draft_bank['items']]
    draft_tools = [dict(label='教师答案（审阅稿）', url=os.path.relpath(draft_dir / 'teacher.md', OUT))]
    if draft.get('paper_filter_view_id'):
        draft_tools.append(dict(label='本卷题库', url=management['url'] + '#gid=' + str(draft['paper_sheet_id']) + '&fvid=' + str(draft['paper_filter_view_id'])))
    if draft.get('form_edit_url'):
        draft_tools.append(dict(label='表单草稿', url=draft['form_edit_url']))
    source_label = (f'{draft["textbook_audio_count"]}段课本原音＋{draft["tocfl_audio_count"]}段TOCFL官方音频'
                    if draft.get('tocfl_audio_count') else f'{draft["audio_count"]}段课本原音')
    books['boya-elementary-i']['sets'].append(dict(id=draft['exam_id'], week=str(draft['week']).zfill(2),
        label=draft['dashboard_label'], status=f'审阅稿 · 未发布 · {draft["question_count"]}题 · {draft["points"]}分 · {source_label} · 每段播放两遍',
        tracks=draft_tracks, tools=draft_tools))
superseded_dirs = {ROOT / directory for e in management['exams'] for directory in e.get('superseded_directories', [])}
for p in sorted((ROOT / 'course/offerings/2026-fall').glob('*/weekly-assessment-review/**/audio-map.csv')):
    if p.parent in superseded_dirs:
        continue
    week = next(part[1:] for part in p.parts if re.fullmatch(r'w\d{2}', part))
    if week == '04':
        continue
    registered = next((e for e in management['exams'] if ROOT / e['directory'] == p.parent and e.get('form_id')), None)
    if registered:
        sync_path = p.parent / 'form-sync.json'
        sync = json.loads(sync_path.read_text()) if sync_path.is_file() else {}
        source_dir = p.parent / sync.get('version_directory', '')
        if not (source_dir / 'audio-manifest.json').is_file():
            source_dir = p.parent
        bank = json.loads((source_dir / 'items.json').read_text())['items']
        audio_manifest = json.loads((source_dir / 'audio-manifest.json').read_text())
        manifest_tracks = {t['audio_id']: t for t in audio_manifest}
        form_sections = json.loads((source_dir / 'form-sections.json').read_text())['sections']
        item_numbers = {item['id']: int(item['id'].rsplit('-', 1)[1]) for item in bank}
        assert sorted(item_numbers.values()) == list(range(1, 26))
        items_by_number = {item_numbers[item['id']]: item for item in bank}
        audio_ids = list(dict.fromkeys(item['audio_id'] for item in bank))
        assert set(audio_ids) == set(manifest_tracks) and len(manifest_tracks) == 15
        assert len(form_sections) == 15
        section_for_question = {}
        for section in form_sections:
            questions = list(range(section['question_start'], section['question_end'] + 1))
            assert questions and all(q not in section_for_question for q in questions)
            expected_audio_ids = list(dict.fromkeys(items_by_number[q]['audio_id'] for q in questions))
            assert section['audio_ids'] == expected_audio_ids, f'Section audio mapping mismatch: {section["id"]}'
            for question in questions:
                section_for_question[question] = section
        assert sorted(section_for_question) == list(range(1, 26))

        base_tracks = {}
        for audio_id in audio_ids:
            source_track = manifest_tracks[audio_id]
            question_ids = source_track['question_ids']
            numbers = [item_numbers[qid] for qid in question_ids]
            expected_question_ids = [item['id'] for item in bank if item['audio_id'] == audio_id]
            assert question_ids == expected_question_ids
            audio_file = (source_dir / source_track['file']).resolve()
            if not audio_file.is_file():
                audio_file = (ROOT / source_track['file']).resolve()
            assert audio_file.is_relative_to(ROOT) and audio_file.is_file(), f'Missing W05 audio: {source_track["file"]}'
            assert hashlib.sha256(audio_file.read_bytes()).hexdigest() == source_track['sha256'], f'Audio hash mismatch: {audio_id}'
            base_tracks[audio_id] = dict(file=str(audio_file.relative_to(ROOT)),
                                         duration=float(source_track['duration_seconds']))

        entries = []
        for section in form_sections:
            questions = list(range(section['question_start'], section['question_end'] + 1))
            for audio_id in section['audio_ids']:
                section_items = [items_by_number[q] for q in questions if items_by_number[q]['audio_id'] == audio_id]
                question_ids = [item['id'] for item in section_items]
                numbers = [item_numbers[qid] for qid in question_ids]
                question_range = str(numbers[0]) if len(numbers) == 1 else str(numbers[0])+'–'+str(numbers[-1])
                lesson_numbers = sorted({int(key.rsplit('-', 1)[1]) for item in section_items
                                         for key in item.get('lesson_keys', [])})
                assert lesson_numbers and set(lesson_numbers) <= {11, 12}
                assert all(section_for_question[item_numbers[qid]]['id'] == section['id'] for qid in question_ids)
                entries.append(track(base_tracks[audio_id]['file'], audio_id, lesson_numbers[0],
                                     '第'+question_range+'题', questions=question_range,
                                     duration=base_tracks[audio_id]['duration'], lessons=lesson_numbers,
                                     section_id=section['id'], section_title=section['title'],
                                     section_question_ids=question_ids))
        reference_coverage = {question_id: 0 for question_id in item_numbers}
        for entry in entries:
            for question_id in entry['section_question_ids']:
                reference_coverage[question_id] += 1
        assert all(count == 1 for count in reference_coverage.values())
        assert len(entries) == 15 and len({entry['id'] for entry in entries}) == 15
        assert all(t['file'] for t in entries)
        ent = json.loads((p.parent / 'form-entry.json').read_text())
        assert ent['formId'] == registered['form_id']
        assert len(bank) == 25 and sum(q.get('points', 0) for q in bank) == 100
        qr_name = f'w{week}-student-qr.png'
        qrcode.make(ent['responderUri']).save(OUT / qr_name)
        published = ent['publishSettings']['publishState']
        current_input_hashes = {
            'items_sha256': hashlib.sha256((source_dir / 'items.json').read_bytes()).hexdigest(),
            'sections_sha256': hashlib.sha256((source_dir / 'form-sections.json').read_bytes()).hexdigest(),
        }
        verified_input_hashes = sync.get('verification', {}).get('input_hashes', {})
        form_sync_verified = (sync.get('version') == json.loads((source_dir / 'items.json').read_text()).get('version')
                              and sync.get('status') == 'SYNCED_VERIFIED'
                              and all(verified_input_hashes.get(key) == value
                                      for key, value in current_input_hashes.items()))
        tools = [dict(label='本卷成绩', url=management['url'] + '#gid=' + str(registered['grade_sheet_id']) if registered.get('grade_sheet_id') else f'https://docs.google.com/spreadsheets/d/{registered["response_spreadsheet_id"]}/edit#gid={registered["response_sheet_id"]}'),
                 dict(label='题库／答案', url=management['url']+f'#gid={registered["paper_sheet_id"]}&fvid={registered["paper_filter_view_id"]}'),
                 dict(label='音频管理表', url=management['url']+f'#gid={registered["audio_sheet_id"]}'),
                 dict(label='评分／表单回应', url=registered['form_edit_url']+'#responses'),
                 dict(label='表单设置', url=registered['form_edit_url']+'#settings')]
        books['boya-elementary-i']['sets'].append(dict(id=registered['exam_id'], week=week,
            label=f'Week {int(week)} · 第11–12课听力测验',
            status=f'25题 · {registered["points"]}分 · 6段课本原音 + 9段TOCFL官方音频 · 每段手动播放两遍',
            tracks=entries, tools=tools,
            exam=dict(title=ent['title'], url=ent['responderUri'], qr=qr_name,
                      open=form_sync_verified and published.get('isPublished') is True and published.get('isAcceptingResponses') is True,
                      sync_verified=form_sync_verified,
                      sync_message='' if form_sync_verified else '第3版表单内容尚未逐项读回；暂不显示学生作答入口。',
                      checked_at=ent['checked_at'])))
        books['boya-elementary-i']['default_set'] = registered['exam_id']
        continue
    entries = []
    for row in csv.DictReader(p.open(encoding='utf-8-sig')):
        audio_id = row.get('audio_id', '')
        path = row.get('audio_path') or row.get('file') or row.get('path') or row.get('file_path') or row.get('source_path')
        match = re.search(r'E(\d+)', row.get('source_audio_id') or audio_id)
        if path and match:
            entries.append(track(path, audio_id, int(match[1]), audio_id))
    if entries:
        books['boya-elementary-i']['sets'].append(dict(id=str(p.relative_to(ROOT)), week=week, label=f'Week {int(week)} · '+ ('阶段检查' if p.parent.name == 'stage' else '周测音频'), status='审阅音频 · 尚未登记课堂验收', tracks=entries))
# Week allocations come from the active offering, never from bare lesson numbers.
offering = json.loads((ROOT / 'course/offerings/2026-fall/offering.json').read_text())
weeks = {}
for b in offering['textbooks']:
    for w in b.get('class_scope', {}).get('teaching_plan', {}).get('weeks', []):
        for key in w['lesson_keys']:
            weeks.setdefault(key, []).append(str(w['week']).zfill(2))
for book_id, book in books.items():
    entries = []
    for p in sorted((ROOT / 'lessons' / book_id).glob('lesson-*/00-source/audio-manifest.json')):
        d = json.loads(p.read_text())
        lesson = int(p.parents[1].name.split('-')[1])
        for t in d.get('tracks', []):
            path = t.get('path') or t.get('file')
            if path:
                entries.append(track(path, t.get('label') or t.get('id'), lesson, t.get('scope') or t.get('content_scope') or t.get('use') or f'Audio {t.get("label", t.get("id", ""))}'))
    if entries:
        book['sets'].append(dict(id='source', week='all', label='全部课次 · 教材原音', status='教材原音 · 按课次选择', tracks=entries))
        for week in sorted({w for key, values in weeks.items() if key.startswith(book_id+':') for w in values}):
            subset = [t for t in entries if week in weeks.get(f'{book_id}:lesson-{t["lesson"]:02}', [])]
            if subset:
                book['sets'].append(dict(id='source-w'+week, week=week, label=f'Week {int(week)} · 教材原音', status='按当前学期课表编排', tracks=subset))
books['boya-elementary-i']['sets'].sort(key=lambda s: int(s['week']) if s['week'].isdigit() else 999)
(OUT / 'catalog.js').write_text('window.AUDIO_CATALOG = '+json.dumps(list(books.values()), ensure_ascii=False)+';\n')
print(json.dumps({b['id']: len(b['sets']) for b in books.values()}))
