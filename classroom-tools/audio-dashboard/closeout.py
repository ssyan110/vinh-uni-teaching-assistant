"""Read-only assessment checks; public output deliberately contains no answers."""
import csv
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent


def safe(root, path):
    target = (root / path).resolve()
    if not target.is_relative_to(root.resolve()) or target == root.resolve():
        raise ValueError('路径超出项目范围')
    return target


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def teacher_answers(text):
    result = {}
    current_number = None
    for line in text.splitlines():
        numbered = re.match(r'(\d+)\. ', line)
        if numbered:
            current_number = numbered[1]
        if line.startswith('答案：') and current_number:
            line = f'|{current_number}|{line[3:]}|'
        match = re.match(r'\|\s*(\d+)\s*\|([^|]+)\|', line)
        if not match:
            match = re.match(r'## 第(\d+)题｜答案([^｜]+)｜', line)
        if not match:
            match = re.match(r'(\d+)\. \*\*([^*]+)\*\*', line)
        if match:
            number, answer = match.groups()
            if int(number) in result:
                raise ValueError('教师答案卷有重复题号')
            result[int(number)] = answer.strip()
    return result


def check_exam(root, exam, player_tracks=None):
    report = {'id': exam['exam_id'], 'label': exam.get('dashboard_label', exam['exam_id']), 'checks': []}
    checks = report['checks']

    def add(label, status, detail, action=''):
        checks.append(dict(label=label, status=status, detail=detail, action=action))

    try:
        folder = safe(root, exam['directory'])
        sync = read(folder / 'form-sync.json') if (folder / 'form-sync.json').is_file() else {}
        if not isinstance(sync, dict):
            raise ValueError('同步记录必须是对象')
        source = safe(root, folder / sync.get('version_directory', ''))
        bank_path = source / 'items.json'
        bank = read(bank_path)
        if not isinstance(bank, dict):
            raise ValueError('题库必须是对象')
        items = bank['items']
        if not isinstance(items, list) or not items or not all(isinstance(q, dict) for q in items):
            raise ValueError('题库必须包含非空题目清单')
        report['source'] = str(source.relative_to(root))
        report['input_sha256'] = digest(bank_path)
        numbers = [q.get('number', i) for i, q in enumerate(items, 1)]
        identity_ok = bank.get('exam_id', bank.get('assessment_id')) == exam['exam_id']
        ids = [q.get('id', n) for q, n in zip(items, numbers)]
        points = [q.get('points') for q in items]
        numeric = all(isinstance(p, (int, float)) and not isinstance(p, bool) and math.isfinite(p) and p > 0 for p in points)
        total = sum(points) if numeric else None
        report.update(question_count=len(items), points=total)
        valid = (identity_ok and numbers == list(range(1, len(items)+1)) and len(set(ids)) == len(items)
                 and len(items) == exam.get('question_count', len(items)) and numeric
                 and total == exam.get('points', total))
        add('题号、身份与分值', 'pass' if valid else 'mismatch',
            f'{len(items)}题；总分{total if total is not None else "无法计算"}。',
            '' if valid else '核对现行题库的测验身份、连续题号、重复 ID、题数与总分。')
        invalid = []
        for n, q in zip(numbers, items):
            options = q.get('options')
            answer = q.get('answer')
            if options:
                values = list(options.values()) if isinstance(options, dict) else options
                index = q.get('answer_index')
                if index is None and isinstance(answer, str) and re.fullmatch('[A-Z]', answer):
                    index = ord(answer)-65
                if (not isinstance(values, list) or not isinstance(index, int) or isinstance(index, bool)
                        or not 0 <= index < len(values) or len(set(values)) != len(values)
                        or (q.get('answer_text') and q['answer_text'] not in [values[index], answer])):
                    invalid.append(n)
                elif answer not in [chr(65+index), values[index]]:
                    invalid.append(n)
            elif not answer:
                invalid.append(n)
        add('题库答案键', 'mismatch' if invalid else 'pass',
            '需核对题号：'+ '、'.join(map(str, invalid)) if invalid else '每题有答案；选择题答案与选项位置一致。',
            '打开题库核对这些题目的答案与选项。' if invalid else '')
        teacher = source / 'teacher-v3-synced.md'
        if not teacher.is_file():
            teacher = source / 'teacher.md'
        if teacher.is_file():
            parsed = teacher_answers(teacher.read_text())
            wrong = []
            for n, q in zip(numbers, items):
                actual = parsed.get(n, '')
                expected = str(q.get('answer', ''))
                if q.get('options'):
                    match = re.match(r'^([A-Z])(?:$|[^A-Za-z])', actual)
                    if not match or match[1] != expected:
                        wrong.append(n)
                    elif q.get('answer_text') and len(actual) > 1 and q['answer_text'] not in actual:
                        wrong.append(n)
                elif actual != expected:
                    wrong.append(n)
            extra = sorted(set(parsed)-set(numbers))
            add('教师答案卷', 'mismatch' if wrong or extra else 'pass',
                ('需核对题号：'+ '、'.join(map(str, wrong+extra))) if wrong or extra else '逐题答案与题库一致。',
                '打开教师答案卷，核对缺少或不一致的题号；支持表格及现行题号标题格式。' if wrong or extra else '')
        else:
            add('教师答案卷', 'unknown', '现行目录没有教师答案卷。', '补齐现行教师答案卷后重新检查。')
        section_path = source / 'form-sections.json'
        if not section_path.is_file() and exam['exam_id'] == 'W04-DIALOGUE-L05L10-20261011':
            section_path = root / 'classroom-tools/audio-dashboard/form-sections.json'
        section_doc = read(section_path)
        sections = section_doc['sections']
        audio = read(source / 'audio-manifest.json')
        if (not isinstance(audio, list) or not isinstance(sections, list)
                or not all(isinstance(a, dict) for a in audio+sections)):
            raise ValueError('题组或音频清单格式错误')
        audio_by_id = {a['audio_id']: a for a in audio}
        coverage, mapping_issues = [], []
        for section in sections:
            legacy_questions = section.get('questions', [])
            start = section.get('question_start', legacy_questions[0] if legacy_questions else None)
            end = section.get('question_end', legacy_questions[-1] if legacy_questions else None)
            if not isinstance(start, int) or not isinstance(end, int) or not 1 <= start <= end <= len(items):
                raise ValueError('题组题号范围无效')
            group = items[start-1:end]
            coverage.extend(range(start, end+1))
            expected_audio = list(dict.fromkeys(q.get('audio_id') for q in group))
            if len(expected_audio) != 1 or section.get('audio_ids') != expected_audio:
                mapping_issues.append(f'第{start}—{end}题')
        expected_ids = list(dict.fromkeys(q.get('audio_id') for q in items))
        mapping_ok = (not mapping_issues and coverage == numbers and len(audio_by_id) == len(audio)
                      and expected_ids == [a['audio_id'] for a in audio]
                      and len(sections) == len(audio) and len(audio) == exam.get('audio_count', len(audio))
                      and section_doc.get('assessment_id', section_doc.get('exam_id')) == exam['exam_id'])
        for a in audio:
            expected = [q.get('id', n) for q, n in zip(items, numbers) if q.get('audio_id') == a['audio_id']]
            if a.get('question_ids') != expected:
                mapping_ok = False
        add('题组与音频对应', 'pass' if mapping_ok else 'mismatch',
            f'{len(sections)}个题组；{len(audio)}段音频。'+('需核对：'+ '、'.join(mapping_issues) if mapping_issues else ''),
            '' if mapping_ok else '核对题组顺序、连续题号、每组单一音频及音频清单中的题目 ID。')
        bad_audio, audio_paths = [], {}
        for a in audio:
            candidates = [safe(root, source / a['file']), safe(root, a['file'])]
            if a.get('student_audio_path'):
                candidates.append(safe(root, source / a['student_audio_path']))
            path = next((p for p in candidates if p.is_file()), None)
            audio_paths[a['audio_id']] = path
            if not path or not a.get('sha256') or digest(path) != a['sha256']:
                bad_audio.append(a['audio_id'])
        add('音频文件', 'mismatch' if bad_audio else 'pass',
            '缺失或版本不符：'+ '、'.join(bad_audio) if bad_audio else '文件存在，SHA-256 与现行音频清单一致。',
            '恢复本卷对应音频并重新检查。' if bad_audio else '')
        if player_tracks is not None:
            okay = [t['id'] for t in player_tracks] == expected_ids
            for t in player_tracks:
                target = safe(root, root / 'classroom-tools/audio-dashboard' / t['file']) if t.get('file') else None
                okay = okay and target == audio_paths.get(t['id']) and target is not None and target.is_file()
            okay = okay and not bad_audio
            add('播放台顺序', 'pass' if okay else 'mismatch', '播放台与现行题组顺序一致。' if okay else '播放台顺序或文件入口与题组不符。', '' if okay else '重建播放台并核对音频入口。')
        score_path = source / 'score-sheet.csv'
        if score_path.is_file():
            with score_path.open(encoding='utf-8-sig') as f:
                headers = next(csv.reader(f), [])
            expected_variants = [
                [f'Q{n}' for n in numbers],
                [f'题{n}（{q["points"]}分）' for n,q in zip(numbers,items)],
                [f'{q.get("id", n)}/{q["points"]}' for n,q in zip(numbers,items)],
            ]
            question_headers = [h for h in headers if re.fullmatch(
                r'Q\d+|题\d+[（(].+[）)]|[A-Za-z0-9_-]+/\d+(?:\.\d+)?', h)]
            matched = question_headers in expected_variants
            total_headers = [h for h in headers if re.search(r'(?:总分|total)', h, re.I)]
            total_matches = [re.fullmatch(r'(?:total(?:_out_of)?_|总分/|总分（)(\d+(?:\.\d+)?)(?:分）)?', h, re.I)
                             for h in total_headers]
            total_ok = len(total_matches) == 1 and total_matches[0] is not None and float(total_matches[0][1]) == total
            known = bool(question_headers) and bool(total_matches) and all(total_matches)
            score_status = 'pass' if matched and total_ok else 'mismatch' if known else 'unknown'
            add('本地成绩表列', score_status,
                '题目列顺序及总分列与题库一致；未检查学生成绩。' if score_status == 'pass' else '成绩表列未能完整匹配题号与总分。',
                '' if score_status == 'pass' else '核对成绩表是否有多余、重复或缺少的题目列，以及总分列；汇总格式需人工核对。')
        else:
            add('本地成绩表列', 'unknown', '现行目录没有 score-sheet.csv。', '通过本卷成绩入口核对线上成绩表；本页未读取线上单元格。')
        hashes = sync.get('verification', {}).get('input_hashes', {})
        recorded = sync.get('items_sha256') or sync.get('question_bank_sha256') or hashes.get('items_sha256')
        section_hash = hashes.get('sections_sha256')
        stale = bool(recorded and recorded != digest(bank_path)) or bool(section_hash and section_hash != digest(section_path))
        stale = stale or sync.get('previous_readback_stale') is True
        stale = stale or sync.get('exam_id', sync.get('assessment_id', exam['exam_id'])) != exam['exam_id']
        stale = stale or sync.get('form_id', exam.get('form_id')) != exam.get('form_id')
        evidence = [sync.get(k) for k in ['form_evidence', 'sheet_evidence', 'verification_evidence'] if sync.get(k)]
        existing = bool(sync.get('form_evidence') and sync.get('sheet_evidence'))
        existing = existing and all(safe(root, p).is_file() for p in evidence)
        successful_sync = sync.get('status') in ['SYNCED_VERIFIED', 'SYNCED_VERIFIED_UNPUBLISHED', 'CONTENT_SYNCED_VERIFIED_UNPUBLISHED_BACKEND_PENDING']
        existing = existing and successful_sync
        evidence_reason = '缺少同时覆盖 Form 与 Sheets 的可核对读回记录。'
        if sync.get('verification_evidence'):
            combined_path = safe(root, sync['verification_evidence'])
            if combined_path.is_file():
                combined = read(combined_path)
                if isinstance(combined, dict):
                    counts = [combined.get('form_readback_mismatches'), combined.get('sheet_readback_mismatches')]
                    identity_matches = combined.get('exam_id') == exam['exam_id']
                    hash_matches = combined.get('items_sha256') == digest(bank_path)
                    revision = sync.get('form_revision') or exam.get('form_revision')
                    revision_matches = isinstance(revision, str) and bool(revision) and combined.get('form_revision') == revision
                    existing = successful_sync and identity_matches and hash_matches and revision_matches and all(type(n) is int and n == 0 for n in counts)
                    if not identity_matches or not hash_matches or not revision_matches:
                        evidence_reason = '合并读回记录的测验身份、题库哈希或 Form revision 与现行登记不符。'
                    elif not all(type(n) is int and n == 0 for n in counts):
                        evidence_reason = '合并读回记录未同时确认 Form 与 Sheets 的不一致数为零。'
                else:
                    existing = False
                    evidence_reason = '合并读回记录格式无法核对。'
        verification = sync.get('verification', {})
        if not existing and verification.get('independent_form_evidence'):
            independent_path = safe(root, verification['independent_form_evidence'])
            if independent_path.is_file():
                proof = read(independent_path)
                if isinstance(proof, dict):
                    gaps = []
                    if proof.get('exam_id') != exam['exam_id']:
                        gaps.append('独立 Form 记录未绑定本卷身份')
                    if proof.get('canonical_sha256') != digest(bank_path):
                        gaps.append('独立 Form 记录的 canonical_sha256 与现行题库不同')
                    audio_proof = verification.get('independent_audio_library_evidence')
                    if audio_proof and safe(root, audio_proof).is_file():
                        gaps.append('独立音频库记录不能代替 Sheets 题库逐题读回')
                    evidence_reason = '；'.join(gaps) + '。' if gaps else '现有独立证明没有可核对的 Sheets 逐题读回结果。'
        if not recorded:
            evidence_reason = '同步记录未保存现行题库哈希。' + evidence_reason
        saved_at = sync.get('checked_at') or sync.get('synced_at') or sync.get('verified_at') or '未记录时间'
        add('Form／Sheets 读回记录', 'stale' if stale else 'recorded' if recorded and existing else 'unknown',
            ('记录已过期，输入文件已改变。' if stale else '题库与保存的读回记录匹配；线上现况未检查。' if recorded and existing else evidence_reason)+f' 记录时间：{saved_at}。',
            '重新从 Form 和 Sheets 逐题读回；同时记录题库及题组哈希。'+(' 现有记录未绑定题组文件。' if not section_hash else ''))
        backend = exam.get('response_backend_connected')
        add('作答后台', 'pending' if backend is False else 'recorded' if backend is True else 'unknown',
            '登记为尚未连接作答后台。' if backend is False else '登记为已连接；本页未检查线上连接。' if backend is True else '登记资料未明确记录后台连接状态。',
            '在表单核对作答保存位置与本卷成绩 sheet。')
        explicitly_pending = any(a.get('teacher_listening_accepted') is False or a.get('classroom_speaker_acceptance') is False for a in audio)
        explicitly_pending = explicitly_pending or any('listening' in p or 'speaker' in p or 'audio_playback' in p for p in exam.get('pending', []))
        add('教师亲听与教室播放', 'pending' if explicitly_pending else 'unknown',
            '本卷登记仍有亲听或教室播放待完成项。' if explicitly_pending else '本页未核实教师亲听及教室播放证据。',
            '按本卷清单核对实际播放、教师亲听和教室音箱记录；文件检查不能代替验收。')
    except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError) as error:
        add('输入资料', 'mismatch', f'无法完成检查：{type(error).__name__}。', '检查登记目录、现行 JSON 结构及所需文件后重新生成。')
    report['issue_count'] = sum(c['status'] in ['mismatch', 'stale'] for c in checks)
    return report


def build_closeouts(root=ROOT, out=OUT, books=None):
    payload = dict(generated_at=datetime.now(timezone.utc).isoformat(), exams=[])
    try:
        management = read(root / 'lessons/boya-elementary-i/assessment-management.json')
        exams = management['exams']
        if not isinstance(exams, list) or not all(isinstance(e, dict) and isinstance(e.get('exam_id'), str) for e in exams):
            raise ValueError('测验登记格式错误')
        tracks = {s['id']: s['tracks'] for b in (books or []) for s in b['sets']}
        payload['exams'] = [check_exam(root, exam, tracks.get(exam['exam_id'])) for exam in exams
                            if not exam.get('superseded_by_review') and 'SUPERSEDED' not in exam.get('status', '')]
    except (OSError, ValueError, TypeError, KeyError):
        payload['error'] = '无法读取现行测验登记。请检查 assessment-management.json 后重新构建。'
    cache = out / 'closeout-data.js'
    cache.write_text('window.ASSESSMENT_CLOSEOUT = '+json.dumps(payload, ensure_ascii=False)+';\n')
    page = out / 'closeout.html'
    if page.is_file():
        page.write_text(re.sub(r'closeout-data\.js(?:\?v=[^\"]*)?', 'closeout-data.js?v='+digest(cache)[:12], page.read_text(), count=1))
    return payload


if __name__ == '__main__':
    result = build_closeouts()
    print(json.dumps({e['id']: e['issue_count'] for e in result['exams']}))
