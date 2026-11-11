#!/usr/bin/env python3
"""Rebuild one registered single-audio assessment playlist into a review candidate."""
import argparse
import json
import os
import sys
from pathlib import Path

DASHBOARD = Path(__file__).resolve().parent
ROOT = DASHBOARD.parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from assessment_audio_gate import registered_exam
from workflow_integrity import resolve_relative_path, sha256


def candidate(exam_id, offering, version_directory):
    register, exam = registered_exam(ROOT, exam_id, offering)
    base, _ = resolve_relative_path(ROOT, exam['directory'])
    owner, _ = resolve_relative_path(ROOT, version_directory, required_root=base)
    def load(name):
        path, _ = resolve_relative_path(ROOT, (owner / name).relative_to(ROOT).as_posix(), required_root=owner)
        return json.loads(path.read_bytes())
    bank, groups, audio = load('items.json'), load('form-sections.json'), load('audio-manifest.json')
    version = exam['question_version']
    if (bank.get('exam_id') != exam_id or bank.get('offering_id') != offering or bank.get('cohort') != register['cohort']
            or groups.get('assessment_id') != exam_id or str(bank.get('version')) != str(version)
            or str(groups.get('version', version)) != str(version)):
        raise ValueError('Exam, class, offering or current version differs from the register')
    questions = bank['items']
    if len(questions) != exam['question_count'] or len({q['id'] for q in questions}) != len(questions):
        raise ValueError('Question count or identity differs')
    clips = {c['audio_id']: c for c in audio}
    if len(clips) != len(audio) or len(clips) != exam['audio_count']:
        raise ValueError('Audio count or identity differs')
    tracks, mapped, seen = [], [], set()
    for section in groups['sections']:
        ids = section['audio_ids']
        if len(ids) != 1 or ids[0] in seen or ids[0] not in clips:
            raise ValueError('This builder requires one distinct registered audio per section')
        aid = ids[0]
        seen.add(aid)
        clip = clips[aid]
        start, end = section['question_start'], section['question_end']
        if not 1 <= start <= end <= len(questions):
            raise ValueError('Invalid section question range')
        rows = questions[start - 1:end]
        qids = [q['id'] for q in rows]
        if clip['question_ids'] != qids or any(q['audio_id'] != aid or q.get('number', i) != i for i, q in enumerate(rows, start)):
            raise ValueError('Section, questions and audio disagree')
        mapped.extend(qids)
        source = Path(clip['file'])
        relative = source if source.is_relative_to(owner.relative_to(ROOT)) else owner.relative_to(ROOT) / source
        file, _ = resolve_relative_path(ROOT, str(relative), required_root=owner)
        if sha256(file) != clip['sha256']:
            raise ValueError('Audio bytes changed: ' + aid)
        keys = {key for q in rows for key in q['lesson_keys']}
        if not keys or not keys.issubset(exam['lesson_keys']):
            raise ValueError('Question lesson outside registered scope')
        lessons = sorted(int(key.rsplit('-', 1)[-1]) for key in keys)
        span = str(start) if start == end else f'{start}–{end}'
        tracks.append(dict(id=aid, lesson=str(lessons[0]), lessons=lessons, title=f'第{span}题',
                           file=os.path.relpath(file, DASHBOARD), questions=span, duration=str(clip['duration_seconds']),
                           section_id=section['id'], section_title=section['title'], section_question_ids=qids))
    if mapped != [q['id'] for q in questions] or seen != set(clips):
        raise ValueError('Section coverage is incomplete, reordered or overlapping')
    prefix = 'window.AUDIO_CATALOG = '
    live = (DASHBOARD / 'catalog.js').read_text().strip()
    if not live.startswith(prefix) or not live.endswith(';'):
        raise ValueError('Unrecognized catalog format')
    books = json.loads(live[len(prefix):-1])
    matches = [s for b in books if b['id'] == register['textbook_id'] for s in b['sets'] if s['id'] == exam_id]
    if len(matches) != 1:
        raise ValueError('Select one existing playlist in its textbook')
    matches[0]['tracks'] = tracks
    return prefix + json.dumps(books, ensure_ascii=False) + ';\n', len(tracks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('exam-id', 'offering-id', 'version-directory'):
        parser.add_argument('--' + key, required=True)
    parser.add_argument('--output', help='Optional new catalog.js under .agent/runs/<run>/staging')
    args = parser.parse_args()
    try:
        content, count = candidate(args.exam_id, args.offering_id, args.version_directory)
        if args.output:
            target, name = resolve_relative_path(ROOT, args.output)
            parts = Path(name).parts
            if len(parts) < 5 or parts[:2] != ('.agent', 'runs') or parts[3] != 'staging' or parts[-1] != 'catalog.js':
                raise ValueError('Supply a new run-staged catalog.js')
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('x', encoding='utf-8') as f:
                f.write(content)
        print(json.dumps(dict(exam_id=args.exam_id, tracks=count, output=args.output, live_catalog_written=False)))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.error(str(exc))


if __name__ == '__main__':
    main()
