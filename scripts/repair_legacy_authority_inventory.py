#!/usr/bin/env python3
"""Add verified legacy PPTX inventory entries without changing approval status."""
import argparse
import json
import os
import sys
from pathlib import Path

from lesson_context import resolve_lesson_context
from workflow_integrity import audit_authority_manifest, material_files, resolve_relative_path, sha256

ROOT = Path(__file__).resolve().parents[1]


def prepare(root, lesson_key, offering_id):
    context = resolve_lesson_context(root, lesson_key, offering_id)
    path = context.authority_root / 'lesson-manifest.json'
    original = path.read_bytes()
    manifest = json.loads(original)
    if manifest.get('lesson_key') != lesson_key or manifest.get('textbook_id') != context.textbook_id or manifest.get('lesson_id') != context.lesson_id:
        raise ValueError('Authority manifest identity mismatch')
    if 'files' in manifest or 'activities' in manifest.get('authority', {}):
        raise ValueError('Existing inventory or activity declaration needs manual review')
    ppt = manifest.get('authority', {}).get('pptx', {})
    entries = []
    for mode in ('online', 'face_to_face'):
        value, digest, size = ppt.get(f'{mode}_path'), ppt.get(f'{mode}_sha256'), ppt.get(f'{mode}_bytes')
        path_value, relative = resolve_relative_path(root, value, required_root=context.authority_root)
        if not path_value.is_file() or sha256(path_value) != digest or path_value.stat().st_size != size:
            raise ValueError(f'Historical {mode} bytes differ from recorded approval')
        entries.append({'path': relative, 'sha256': digest, 'bytes': size, 'status': 'historical_inventory_only'})
    actual = {p.relative_to(root).as_posix() for p in material_files(context.authority_root) if p.name != 'lesson-manifest.json'}
    if actual != {x['path'] for x in entries}:
        raise ValueError('Unexpected authority files require manual review')
    proposed = dict(manifest)
    proposed['authority'] = dict(manifest['authority'])
    proposed['authority']['activities'] = {'file_count': 0}
    proposed['files'] = entries
    if audit_authority_manifest(root, context.authority_root, proposed)['failures']:
        raise ValueError('Proposed inventory does not pass authority audit')
    return context, original, proposed


def execute(root, lesson_key, offering_id, backup):
    context, original, proposed = prepare(root, lesson_key, offering_id)
    backup_path, _ = resolve_relative_path(root, backup, required_root=root / '.agent/runs')
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    with backup_path.open('xb') as out:
        out.write(original)
        out.flush()
        os.fsync(out.fileno())
    manifest = context.authority_root / 'lesson-manifest.json'
    pending = context.authority_root / '.lesson-manifest.inventory-pending'
    if manifest.read_bytes() != original:
        raise ValueError('Manifest changed before inventory repair')
    with pending.open('x', encoding='utf-8') as out:
        json.dump(proposed, out, ensure_ascii=False, indent=2)
        out.write('\n')
        out.flush()
        os.fsync(out.fileno())
    if manifest.read_bytes() != original:
        raise ValueError('Manifest changed during inventory repair; pending file preserved')
    os.replace(pending, manifest)
    try:
        if audit_authority_manifest(root, context.authority_root, json.loads(manifest.read_text()))['failures']:
            raise RuntimeError('Inventory readback failed')
    except Exception:
        restore = context.authority_root / '.lesson-manifest.inventory-restore'
        with restore.open('xb') as out:
            out.write(original)
            out.flush()
            os.fsync(out.fileno())
        os.replace(restore, manifest)
        raise
    return {'status': 'repaired', 'backup': backup, 'files': proposed['files'], 'approval_changed': False}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--lesson-key', required=True)
    ap.add_argument('--offering-id', required=True)
    ap.add_argument('--execute', action='store_true')
    ap.add_argument('--backup')
    args = ap.parse_args()
    try:
        if args.execute:
            if not args.backup:
                raise ValueError('--backup is required for execution')
            result = execute(ROOT, args.lesson_key, args.offering_id, args.backup)
        else:
            _, _, proposed = prepare(ROOT, args.lesson_key, args.offering_id)
            result = {'status': 'ready', 'write_performed': False, 'files': proposed['files']}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, RuntimeError, KeyError) as error:
        print(json.dumps({'status': 'blocked', 'error': str(error)}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.exit(main())
