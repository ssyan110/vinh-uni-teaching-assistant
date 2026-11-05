"""Read-only ChatGPT evidence prerequisite for classroom activity design."""
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import hashlib
import json
import re
from workflow_integrity import resolve_relative_path


def check_classroom_research(root, record_path, lesson_key, offering_id, artifact_id, class_scope):
    blockers = []
    try:
        root = Path(root).resolve()
        if not record_path:
            raise ValueError('ChatGPT research record is required before classroom activity review or production')
        if not isinstance(lesson_key, str) or len(lesson_key.split(':')) != 2 or any('/' in x or x in ('', '.', '..') for x in lesson_key.split(':')):
            raise ValueError('explicit safe textbook:lesson key is required')
        if not all(isinstance(x, str) and x.strip() for x in (offering_id, artifact_id, class_scope)):
            raise ValueError('offering, artifact and class scope are required')
        design = root / 'lessons' / lesson_key.split(':')[0] / lesson_key.split(':')[1] / '10-design'
        # A shared combined-lesson packet is allowed only within its named owner's design root.
        path, _ = resolve_relative_path(root, str(record_path), required_root=root / 'lessons' / lesson_key.split(':')[0])
        relative = path.relative_to(root / 'lessons' / lesson_key.split(':')[0])
        if len(relative.parts) < 3 or relative.parts[1] != '10-design':
            raise ValueError('research record must be inside a covered lesson 10-design')
        design = root / 'lessons' / lesson_key.split(':')[0] / relative.parts[0] / '10-design'
        record = json.loads(path.read_text(encoding='utf-8'))
        if lesson_key.split(':')[0] + ':' + relative.parts[0] not in record.get('lesson_keys', []):
            raise ValueError('research owner lesson is not in covered scope')
        if record.get('provider') != 'ChatGPT' or record.get('status') != 'captured':
            raise ValueError('record must identify actual ChatGPT research with status captured')
        if lesson_key not in record.get('lesson_keys', []) or any(record.get(k) != v for k, v in (
            ('offering_id', offering_id), ('artifact_id', artifact_id), ('class_scope', class_scope))):
            raise ValueError('ChatGPT research scope does not match the requested class/lessons/artifact')
        url = urlparse(record.get('conversation_url', ''))
        if url.scheme != 'https' or url.hostname != 'chatgpt.com' or not re.fullmatch(r'/c/[A-Za-z0-9-]+', url.path) or url.username or url.password or url.query or url.fragment:
            raise ValueError('actual ChatGPT conversation URL is required')
        captured = datetime.fromisoformat(record['captured_at'])
        adapted = datetime.fromisoformat(record['adapted_at'])
        if captured.tzinfo is None or adapted.tzinfo is None or captured > adapted:
            raise ValueError('timezone-aware research capture must precede activity adaptation')
        evidence_paths = set()
        for field in ('prompt', 'response', 'sources', 'adaptation', 'review'):
            item = record[field]
            evidence, _ = resolve_relative_path(root, item['path'], required_root=design)
            if evidence in evidence_paths:
                raise ValueError('prompt, response, source check, adaptation and review must be distinct files')
            evidence_paths.add(evidence)
            if not evidence.is_file() or not evidence.read_text(encoding='utf-8').strip():
                raise ValueError(f'{field} evidence is missing or empty')
            if hashlib.sha256(evidence.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError(f'{field} evidence hash changed')
        if record.get('sources_verified') is not True:
            raise ValueError('research source verification has not been recorded')
    except (ValueError, TypeError, KeyError, IndexError, AttributeError, OSError) as error:
        blockers.append(f'classroom ChatGPT research: {error}')
    return {'status': 'blocked' if blockers else 'ready', 'blockers': blockers,
            'write_performed': False, 'evidence_authenticity': 'requires actual observed ChatGPT session; hashes establish integrity only'}
