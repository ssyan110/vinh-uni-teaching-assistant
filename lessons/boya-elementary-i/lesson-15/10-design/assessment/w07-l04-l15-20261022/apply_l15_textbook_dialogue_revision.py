from pathlib import Path
import csv, hashlib, json, shutil, subprocess

ROOT = Path(__file__).resolve().parent
PROJECT = Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant')
SOURCE_DIR = Path('/Users/ssyan110/Desktop/Work/teaching/vinh-university/00_上課教材/一年级/博雅汉语听说_初级起步篇I/博雅汉语听说初级起步篇1 MP3/第15课')
AUDIO_ID = 'BOYA-L15-15-11'
SOURCE_AUDIO = SOURCE_DIR / '15-11.mp3'
MP3 = ROOT / 'audio' / f'{AUDIO_ID}.mp3'
WAV = ROOT / 'audio-single' / f'{AUDIO_ID}.wav'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write_json(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

if not SOURCE_AUDIO.is_file():
    raise FileNotFoundError(SOURCE_AUDIO)
MP3.parent.mkdir(parents=True, exist_ok=True)
WAV.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE_AUDIO, MP3)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(MP3), '-vn', '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', str(WAV)], check=True)
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(WAV)]))
duration = float(probe['format']['duration'])
subprocess.run(['ffmpeg', '-v', 'error', '-i', str(WAV), '-f', 'null', '-'], check=True, capture_output=True)

bank = json.loads((ROOT / 'items.json').read_text())
old_items = {i['number']: i for i in bank['items']}
assert old_items[12]['audio_id'] == 'TOCFL-A4-Q20' and old_items[13]['audio_id'] == 'TOCFL-A4-Q21'
base_id = 'W07-L04L15-02'
replacements = [
    {
        'id': f'{base_id}-12', 'question_id': f'{base_id}-12', 'number': 12, 'type': 'mc', 'points': 2,
        'prompt': '男的为什么找老师？',
        'options': ['请假', '学新课有问题', '问老师看什么书'],
        'answer': 'A', 'answer_index': 0, 'answer_text': '请假', 'audio_id': AUDIO_ID,
        'lesson_keys': ['boya-elementary-i:lesson-15'], 'focus': '请假请求与原因',
        'evidence': '教材第15课听力练习15-11，第1题；教材印出的标准选项为A「请假」。',
        'source_type': 'boya_textbook_original_dialogue_question', 'source_lesson': 15,
        'source_textbook_printed_page': 126, 'source_textbook_exercise': '15-11',
        'source_textbook_audio': '15-11.mp3', 'version': 2, 'play_count': 2,
        'replaces_question_id': old_items[12]['question_id']
    },
    {
        'id': f'{base_id}-13', 'question_id': f'{base_id}-13', 'number': 13, 'type': 'mc', 'points': 2,
        'prompt': '男的明天去干什么？',
        'options': ['去买新书', '去机场接妈妈', '去办公室找老师'],
        'answer': 'B', 'answer_index': 1, 'answer_text': '去机场接妈妈', 'audio_id': AUDIO_ID,
        'lesson_keys': ['boya-elementary-i:lesson-15'], 'focus': '机场接人与明天安排',
        'evidence': '教材第15课听力练习15-11，第2题；教材印出的标准选项为B「去机场接妈妈」。',
        'source_type': 'boya_textbook_original_dialogue_question', 'source_lesson': 15,
        'source_textbook_printed_page': 126, 'source_textbook_exercise': '15-11',
        'source_textbook_audio': '15-11.mp3', 'version': 2, 'play_count': 2,
        'replaces_question_id': old_items[13]['question_id']
    }
]
items = [replacements[0] if i['number'] == 12 else replacements[1] if i['number'] == 13 else i for i in bank['items']]
assert len(items) == 50 and [i['number'] for i in items] == list(range(1, 51))
bank.update({
    'version': 2,
    'status': 'UNPUBLISHED_DRAFT_PENDING_EXTERNAL_SYNC_AND_TEACHER_REVIEW',
    'question_count': 50, 'points': 100, 'points_per_question': 2,
    'textbook_question_count': 2, 'tocfl_question_count': 48, 'hsk_question_count': 0,
    'question_group_count': 49, 'audio_count': 49,
    'revision_basis': '2026-10-23 user request: add Lesson 15 textbook short-dialogue listening and retain a complete 50-item review practice. Replace original W07 questions 12-13 with textbook exercise 15-11 questions 1-2; keep unpublished.',
    'audio_playback_policy': 'Each audio group is played twice. Lesson 15 questions 12-13 share the complete publisher track 15-11.',
    'items': items
})
write_json('items.json', bank)

old_audio = json.loads((ROOT / 'audio-manifest.json').read_text())
old_audio = [a for a in old_audio if a['audio_id'] not in {'TOCFL-A4-Q20', 'TOCFL-A4-Q21'}]
new_audio = {
    'audio_id': AUDIO_ID,
    'file': f'audio-single/{WAV.name}',
    'source_file': f'audio/{MP3.name}',
    'source_origin': str(SOURCE_AUDIO),
    'source_url': None,
    'source_status': 'publisher textbook audio track 15-11; original MP3 copied without speech edits',
    'source_segments': [{'start_seconds': 0.0, 'end_seconds': duration}],
    'source_sha256': sha(MP3), 'sha256': sha(WAV), 'duration_seconds': duration,
    'question_ids': [r['question_id'] for r in replacements], 'question_range': '12–13', 'play_count': 2,
    'title': '第15课短对话｜请假与机场接人',
    'section_title': '第12–13题｜第15课课本原音｜Audio 15-11',
    'source_lesson_key': 'boya-elementary-i:lesson-15', 'source_textbook_printed_page': 126,
    'source_textbook_exercise': '15-11',
    'semantic_status': 'textbook track number matched; teacher full listening and question-to-audio semantic review pending',
    'technical_decode': 'pass', 'teacher_listening_accepted': False, 'classroom_speaker_acceptance': False,
    'script': '教材P126听力练习15-11；完整出版社原音。教师答案依据为教材印出的两道问题及标准选项。',
    'clip_policy': 'complete_original_publisher_track_no_trim_no_resynthesis', 'speech_modified': False
}
old_audio.append(new_audio)
old_audio.sort(key=lambda a: min(int(n) for n in a['question_range'].split('–')))
write_json('audio-manifest.json', old_audio)
with (ROOT / 'audio-map.csv').open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['audio_id', 'audio_path', 'question_range', 'play_count', 'duration_seconds', 'sha256', 'source_type'])
    for a in old_audio:
        kind = '博雅第15课出版社原音' if a['audio_id'] == AUDIO_ID else 'TOCFL官方原音单遍剪辑'
        w.writerow([a['audio_id'], str((ROOT / a['file']).relative_to(PROJECT)), a['question_range'], 2, f"{a['duration_seconds']:.6f}", a['sha256'], kind])

sections = []
for a in old_audio:
    first, *rest = a['question_range'].split('–')
    last = rest[0] if rest else first
    sections.append({
        'id': f"w07-v2-g{first}-{last}", 'title': a['section_title'],
        'question_start': int(first), 'question_end': int(last), 'audio_ids': [a['audio_id']],
        'description': '先看本题图片或选项，再听录音，选出一个正确答案。每段录音播放两遍。'
    })
write_json('form-sections.json', {'assessment_id': bank['exam_id'], 'version': 2, 'status': 'PREPARED_NOT_SYNCED', 'sections': sections})

student = ['# 一年级 W07｜第4—15课累计听力练习（审阅稿）', '', '共50题，每题2分，满分100分。先看本题图片或选项，再听录音，选出一个正确答案。每段录音播放两遍。', '']
teacher = ['# W07 第4—15课累计听力练习｜教师答案（审阅稿）', '', '共50题，每题2分，满分100分。第1—48题为TOCFL Band A官方原题，第12—13题替换为博雅《初级起步篇 I》第15课听力练习15-11的两题；整段出版社原音播放两遍。答案、原音来源和题号见逐题记录。', '', '本稿为未发布审阅稿。题目／音频技术检查不代表任课教师已逐段亲听或课堂音箱已验收。', '']
for i in items:
    student += [f"## {i['number']}. {i['prompt']}", '']
    if i.get('option_image'):
        student += [f"![本题图片]({(PROJECT / i['option_image']).as_posix()})", '']
    student += [f'{chr(65+j)}. {o}' for j, o in enumerate(i['options'])] + ['']
    if i['number'] in (12, 13):
        teacher += [f"## 第{i['number']}题｜答案{i['answer']}｜2分", f"- 答案内容：{i['answer_text']}", f"- 依据：{i['evidence']}", '- 来源：博雅《初级起步篇 I》第15课，教材印刷页126，听力练习15-11。', '- 音频：出版社原音15-11；第12—13题共用整段音轨，播放两遍。', f"- 对应内容：第15课；{i['focus']}。", '']
    else:
        teacher += [f"## 第{i['number']}题｜答案{i['answer']}｜2分", f"- 答案内容：{i['answer_text']}", f"- 依据：{i['evidence']}", f"- 来源：TOCFL Band A 第{i['source_volume']}辑原第{i['source_question']}题；题本PDF第{i['source_pdf_page']}页；脚本PDF第{'、'.join(map(str, i['source_script_pdf_pages']))}页。", f"- 音频：{i['audio_id']}；播放两遍。", f"- 对应内容：第{'、'.join(x[-2:] for x in i['lesson_keys'])}课；{i['focus']}。", '']
(ROOT / 'student.md').write_text('\n'.join(student))
(ROOT / 'teacher.md').write_text('\n'.join(teacher))

coverage = ['lesson_key,question_numbers,coverage_limit']
for lesson in bank['lesson_keys']:
    nums = '，'.join(str(i['number']) for i in items if lesson in i.get('lesson_keys', []))
    limit = '第15课直接使用教材听力练习15-11的两道题；其余内容为主题抽样，不代表词语语法全覆盖' if lesson.endswith('lesson-15') else ('身份辨认关联；未直接抽查姓名姓氏音节或国籍' if lesson.endswith(('lesson-04','lesson-05')) else '按相关交际主题抽样，不代表词语语法全覆盖')
    coverage.append(f'{lesson},{nums},{limit}')
(ROOT / 'topic-coverage.csv').write_text('\n'.join(coverage) + '\n')

qa = {
    'exam_id': bank['exam_id'], 'version': 2, 'question_count': 50, 'points': 100, 'points_per_question': 2,
    'textbook_question_count': 2, 'tocfl_question_count': 48, 'hsk_question_count': 0,
    'audio_count': len(old_audio), 'question_group_count': len(sections),
    'lesson15_track': {'audio_id': AUDIO_ID, 'source_track': '15-11.mp3', 'question_numbers': [12, 13], 'sha256_source': sha(MP3), 'sha256_playback_wav': sha(WAV), 'duration_seconds': duration, 'source_copy_identical': sha(MP3) == sha(SOURCE_AUDIO), 'technical_decode': 'pass', 'publisher_speech_modified': False, 'teacher_full_listening': 'pending', 'classroom_speaker_acceptance': 'pending'},
    'numbering_contiguous': [i['number'] for i in items] == list(range(1, 51)),
    'answer_alignment': 'Questions 12-13 use the printed textbook question/standard options on p126; answers A/B.',
    'remote_sync': 'pending; previous v1 readback is stale for v2',
    'content_approved': False, 'publication_authorized': False
}
write_json('content-qa.json', qa)
(ROOT / 'scope.md').write_text('''# W07 第4—15课累计听力练习审阅稿 v2

本卷50题，每题2分，共100分。范围为第4—15课相关听力主题；其中48题采用TOCFL Band A官方原题和原音，另加入博雅《初级起步篇 I》第15课教材P126听力练习15-11的两题。第12—13题共用出版社原音15-11，按一个连续题组播放两遍。未加入HSK题。

第12题询问男士为什么找老师，答案为请假；第13题询问男士明天去做什么，答案为去机场接妈妈。题干、选项与答案依据来自教材该练习；完整出版社音轨来自用户指定的第15课MP3文件夹，原始MP3保存在本目录audio中，未剪辑、未合成。

其余TOCFL题保留原图、选项顺序和答案位置。课程相关主题是抽样，部分TOCFL原题仍需教师亲听确认难度。来源筛选记录见fit-review-hsk-tocfl-20261023.md。

当前是未发布审阅稿。教师完整听音、教室音箱验收、Google Form／Sheets v2读回及发布授权均未完成；v1线上读回不能视为v2同步证据。
''')
(ROOT / 'qa.md').write_text(f'''# W07 本地内容与音频核验 v2

- 50题，每题2分，共100分；48题TOCFL官方题，2题取自第15课教材听力练习15-11；无HSK题。
- 49段音频／题组：47段单题TOCFL音频及1段出版社原音15-11覆盖第12—13题。课本音轨约{duration:.2f}秒，MP3源文件与用户提供原文件SHA-256一致；PCM WAV可完整解码。
- 第12题答案A「请假」，第13题答案B「去机场接妈妈」，与教材P126印刷选项一致。两题共享音轨和同一个Form Section。
- 音轨15-11未剪辑、未合成；技术解码通过。任课教师完整亲听、语义对应确认和课堂音箱验收仍待完成。
- Google Form、Google Sheets和dashboard的v2修改／读回仍待执行；原v1读回证据已失效。未批准内容，未发布，student_ready=false。
''')

src = json.loads((ROOT / 'source-manifest.json').read_text())
src['selection'] = '48 TOCFL Band A original items plus textbook dialogue questions 12-13 from Lesson 15 exercise 15-11.'
src['question_source_ids'] = [i['audio_id'] for i in items if i['source_type'] == 'tocfl_official_original_question']
src['textbook_source'] = {'lesson_key': 'boya-elementary-i:lesson-15', 'textbook_printed_page': 126, 'exercise': '15-11', 'source_inventory': 'textbooks/boya-elementary-i/source/source-inventory.json', 'audio_original_user_path': str(SOURCE_AUDIO), 'audio_local_copy': f'audio/{MP3.name}', 'audio_sha256': sha(MP3), 'publisher_original_unmodified': True, 'teacher_full_listening': 'pending'}
src['human_gates'] = {'content_review': 'pending', 'teacher_full_listening': 'pending', 'classroom_speaker_acceptance': 'pending', 'external_form_sheet_sync': 'pending', 'publication': 'not_authorized'}
write_json('source-manifest.json', src)

sync = json.loads((ROOT / 'form-sync.json').read_text())
sync.update({'status': 'PENDING_RESYNC', 'question_version': 2, 'question_count': 50, 'points': 100, 'publication_authorized': False, 'content_approved': False, 'previous_readback_stale': True, 'previous_readback_revision': sync.get('form_revision'), 'pending': ['Form v2 update/readback', 'Sheets v2 question/group/audio rows update/readback', 'audio dashboard v2 rebuild and playback check', 'teacher full listening', 'classroom speaker acceptance', 'publication authorization']})
write_json('form-sync.json', sync)

management_path = PROJECT / 'lessons/boya-elementary-i/assessment-management.json'
management = json.loads(management_path.read_text())
exam = next(e for e in management['exams'] if e['exam_id'] == bank['exam_id'])
exam.update({'status': 'DRAFT_V2_LOCAL_PENDING_SYNC_UNPUBLISHED', 'question_count': 50, 'choice_count': 50, 'fill_count': 0, 'points': 100, 'points_per_question': 2, 'question_version': 2, 'audio_count': len(old_audio), 'question_group_count': len(sections), 'student_ready': False, 'publication_authorized': False, 'textbook_question_count': 2, 'tocfl_question_count': 48, 'textbook_audio_count': 1, 'tocfl_audio_count': 48, 'audio_type': 'mixed-textbook-and-tocfl-originals', 'content_approved': False, 'question_bank_sha256': sha(ROOT / 'items.json'), 'scope_decision': '2026-10-23 user requested Lesson 15 textbook dialogue listening in complete 50-question practice; Q12-13 replaced with publisher track 15-11 textbook questions; local v2 only, pending external sync, remains unpublished.', 'sync_verification_evidence': None, 'dashboard_browser_load_start_replay_verified': 0, 'pending': ['teacher_content_and_full_listening', 'classroom_speaker_acceptance', 'external_form_and_sheet_v2_sync', 'publication_authorization']})
management_path.write_text(json.dumps(management, ensure_ascii=False, indent=2) + '\n')

print(json.dumps({'questions': len(items), 'points': sum(i['points'] for i in items), 'audio_tracks': len(old_audio), 'sections': len(sections), 'textbook_questions': bank['textbook_question_count'], 'textbook_audio_duration': duration, 'source_sha256': sha(MP3), 'playback_sha256': sha(WAV)}, ensure_ascii=False))
