#!/usr/bin/env python3
"""Guarded OpenSlide approval and immutable release for registered HTML decks.

Human evidence must be recorded independently and bind the candidate digest.
No command creates approval evidence or changes historical approval statuses.
"""
from __future__ import annotations

import argparse
import ctypes
import fcntl
import hashlib
import json
import os
import re
import shutil
import sys
import uuid
import zipfile
from datetime import datetime
from pathlib import Path

import plan_classroom_release as candidate
from lesson_context import resolve_lesson_context, _safe_project_path
from workflow_integrity import audit_authority_manifest, material_files, portable_release_path_key, resolve_relative_path, sha256, symlinks_under

ROOT = Path(__file__).resolve().parents[1]
ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,79}\Z')


def rename_noreplace(source, destination):
    libc = ctypes.CDLL(None, use_errno=True)
    old, new = os.fsencode(source), os.fsencode(destination)
    if sys.platform == 'darwin':
        result = libc.renamex_np(old, new, 0x00000004)  # RENAME_EXCL
    elif sys.platform.startswith('linux'):
        result = libc.renameat2(-100, old, -100, new, 1)  # RENAME_NOREPLACE
    else:
        raise RuntimeError('Safe no-replace directory rename is unavailable on this platform')
    if result != 0:
        number = ctypes.get_errno()
        raise OSError(number, os.strerror(number), str(destination))


def sync_directory(path):
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def evidence(root, path, required_root, gate, plan, release_id=None):
    resolved, normalized = resolve_relative_path(root, path, required_root=required_root)
    record = json.loads(resolved.read_text(encoding='utf-8'))
    if not isinstance(record, dict):
        raise ValueError('Human evidence must be a JSON object')
    combined = record.get('gate') == 'classroom-package-approval'
    if combined:
        components = record.get('approved_components')
        if not isinstance(components, list) or not {'deck', 'teacher_materials'}.issubset(components):
            raise ValueError('Combined approval must explicitly cover deck and teacher materials')
        if gate == 'classroom-release' and (not isinstance(record.get('authorized_actions'), list) or 'release' not in record['authorized_actions'] or release_id is None):
            raise ValueError('Combined approval does not explicitly authorize release')
    if ((record.get('gate') != gate and not combined) or record.get('candidate_sha256') != plan['candidate_sha256']
            or record.get('deck_id') != plan['deck_id'] or record.get('offering_id') != plan['offering_id']
            or record.get('lesson_keys') != plan['lesson_keys']
            or ('class_scope' in plan and record.get('class_scope') != plan['class_scope'])
            or not isinstance(record.get('approved_by'), str) or not record['approved_by'].strip()
            or not isinstance(record.get('user_decision'), str) or not record['user_decision'].strip()):
        raise ValueError('Human evidence does not match the exact candidate and lesson identities')
    when = datetime.fromisoformat(record.get('approved_at', ''))
    if when.tzinfo is None or when.utcoffset() is None:
        raise ValueError('Human evidence timestamp must include a timezone')
    if release_id is not None and record.get('release_id') != release_id:
        raise ValueError('Release authorization must name the exact release ID')
    return resolved, normalized, sha256(resolved)


def transaction(root, lesson_key):
    lock_dir = _safe_project_path(root, '.agent/classroom-release-locks')
    lock_dir.mkdir(parents=True, exist_ok=True)
    lock = _safe_project_path(lock_dir, 'authority-release.lock').open('a+b')
    fcntl.flock(lock, fcntl.LOCK_EX)
    staging_root = _safe_project_path(root, '.agent/runs')
    staging_root.mkdir(parents=True, exist_ok=True)
    try:
        for marker in staging_root.glob('classroom-release-transaction-*/transaction.json'):
            safe, _ = resolve_relative_path(root, marker.relative_to(root).as_posix(), required_root=staging_root)
            record = json.loads(safe.read_text(encoding='utf-8'))
            if record.get('stage') == 'staged':
                raise RuntimeError(f'Unfinished transaction requires review: {marker}')
        staging = staging_root / ('classroom-release-transaction-' + uuid.uuid4().hex)
        staging.mkdir()
    except Exception:
        lock.close()
        raise
    return lock, staging


def mark_transaction(staging, stage):
    marker = staging / 'transaction.json'
    if not marker.exists():
        return
    data = json.loads(marker.read_text(encoding='utf-8'))
    data['stage'] = stage
    pending = staging / 'transaction-update.json'
    write_json(pending, data)
    os.replace(pending, marker)


def write_json(path, data):
    with path.open('x', encoding='utf-8') as out:
        json.dump(data, out, ensure_ascii=False, indent=2)
        out.write('\n')
        out.flush()
        os.fsync(out.fileno())
    sync_directory(path.parent)


def clean_manifest(root, context):
    path = _safe_project_path(context.authority_root, 'lesson-manifest.json')
    if path.exists():
        data = json.loads(path.read_text(encoding='utf-8'))
        if (data.get('lesson_key') != context.lesson_key or data.get('textbook_id') != context.textbook_id
                or data.get('lesson_id') != context.lesson_id):
            raise ValueError('Authority identity mismatch')
        failures = audit_authority_manifest(root, context.authority_root, data)['failures']
        if failures:
            raise ValueError('Authority inventory is invalid: ' + '; '.join(failures))
        return path, data, path.read_bytes()
    if context.authority_root.exists() and any(p.is_file() or p.is_symlink() for p in context.authority_root.rglob('*')):
        raise ValueError('Nonempty authority directory has no manifest')
    return path, {'schema_version': '1.0', 'manifest_type': 'lesson-authority',
                  'lesson_key': context.lesson_key, 'textbook_id': context.textbook_id,
                  'lesson_id': context.lesson_id, 'authority': {'activities': {'file_count': 0}},
                  'files': []}, None


def exact_plan(deck_id, expected):
    plan = candidate.review_plan(deck_id)
    if plan.get('status') != 'ready_for_human_review' or plan.get('candidate_sha256') != expected:
        raise ValueError('Current candidate differs from the reviewed fingerprint or has blockers: ' + '; '.join(plan.get('blockers', [])))
    return plan


def atomic_manifest(path, data, staging, prior):
    if path.is_symlink():
        raise ValueError('Authority manifest cannot be a symlink')
    if (path.read_bytes() if path.exists() else None) != prior:
        raise ValueError('Authority manifest changed during transaction')
    staged = staging / 'new-manifest.json'
    write_json(staged, data)
    path.parent.mkdir(parents=True, exist_ok=True)
    os.replace(staged, path)
    try:
        sync_directory(path.parent)
    except Exception:
        restore_manifest(path, prior, staging)
        raise


def restore_manifest(path, prior, staging):
    if prior is None:
        # Keep the failed new manifest as transaction evidence.
        rename_noreplace(path, staging / 'uncommitted-manifest.json')
    else:
        saved = staging / 'restore-manifest.json'
        saved.write_bytes(prior)
        os.replace(saved, path)
    sync_directory(path.parent)


def preserve_prior_manifest(staging, prior):
    if prior is None:
        write_json(staging / 'prior-manifest-absent.json', {'absent': True})
    else:
        with (staging / 'prior-manifest.json').open('xb') as output:
            output.write(prior)
            output.flush()
            os.fsync(output.fileno())
        sync_directory(staging)


def promote(deck_id, expected, human_evidence, teacher_evidence=None):
    plan = exact_plan(deck_id, expected)
    if plan.get('formal_blockers'):
        raise ValueError('Formal lesson gates are blocked: ' + '; '.join(plan['formal_blockers']))
    context = resolve_lesson_context(ROOT, plan['owner_lesson_key'], plan['offering_id'])
    lock, staging = transaction(ROOT, context.lesson_key)
    published = committed = False
    target = None
    try:
        plan = exact_plan(deck_id, expected)
        if plan.get('formal_blockers'):
            raise ValueError('Formal lesson gates are blocked: ' + '; '.join(plan['formal_blockers']))
        proof, _, proof_hash = evidence(ROOT, human_evidence, context.design_root, 'classroom-deck-approval', plan)
        teacher_proof, _, teacher_hash = evidence(ROOT, teacher_evidence or human_evidence, context.design_root, 'classroom-teacher-materials-approval', plan)
        path, manifest, prior = clean_manifest(ROOT, context)
        if plan.get('existing_authority_sha256') != (sha256(path) if prior is not None else None):
            raise ValueError('Authority changed after candidate verification')
        name = deck_id + '-' + expected[:16]
        if not ID.fullmatch(name):
            raise ValueError('Invalid deck identifier')
        parent = _safe_project_path(context.authority_root, 'html')
        target = _safe_project_path(parent, name)
        if target.exists():
            raise ValueError('Approved version already exists')
        payload = staging / 'payload'
        payload.mkdir()
        draft = (ROOT / plan['source']).parent
        for item in plan['files']:
            source, _ = resolve_relative_path(ROOT, (draft / item['path']).relative_to(ROOT).as_posix(), required_root=draft)
            if sha256(source) != item['sha256'] or source.stat().st_size != item['bytes']:
                raise ValueError('Candidate changed during staging')
            dest = _safe_project_path(payload, item['path'])
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            if sha256(dest) != item['sha256']:
                raise ValueError('Candidate copy verification failed')
        proof_target = payload / '_human-approval.json'
        if proof_target.exists():
            raise ValueError('Reserved approval evidence name collides with candidate file')
        shutil.copyfile(proof, proof_target)
        if sha256(proof_target) != proof_hash:
            raise ValueError('Approval evidence changed during staging')
        teacher_target = payload / '_teacher-approval.json'
        if teacher_target.exists():
            raise ValueError('Reserved teacher approval name collides with candidate file')
        shutil.copyfile(teacher_proof, teacher_target)
        if sha256(teacher_target) != teacher_hash:
            raise ValueError('Teacher approval evidence changed during staging')
        review_archive = []
        for index, item in enumerate(plan['review_evidence']):
            source, relative = resolve_relative_path(ROOT, item['path'], required_root=ROOT)
            if not source.is_file() or sha256(source) != item['sha256']:
                raise ValueError('Review evidence changed during staging')
            suffix = source.suffix if re.fullmatch(r'\.[A-Za-z0-9]{1,8}', source.suffix) else '.bin'
            archived = payload / '_review-evidence' / f'{index:03d}{suffix}'
            archived.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, archived)
            if sha256(archived) != item['sha256']:
                raise ValueError('Review evidence copy failed verification')
            review_archive.append({'source': relative, 'sha256': item['sha256'],
                                   'path': (target / archived.relative_to(payload)).relative_to(ROOT).as_posix()})
        if exact_plan(deck_id, expected).get('existing_authority_sha256') != plan.get('existing_authority_sha256'):
            raise ValueError('Authority changed during staging')
        entries = []
        for file in material_files(payload):
            final = target / file.relative_to(payload)
            entries.append({'path': final.relative_to(ROOT).as_posix(), 'sha256': sha256(file), 'bytes': file.stat().st_size})
        manifest['files'].extend(entries)
        authority = manifest.setdefault('authority', {})
        versions = authority.setdefault('classroom_html', {})
        if name in versions:
            raise ValueError('Approved version already declared')
        candidate_payload = {k: plan[k] for k in ('deck_id', 'owner_lesson_key', 'lesson_keys', 'offering_id', 'source', 'draft_manifest_sha256', 'files', 'review_evidence')}
        if 'class_scope' in plan:
            candidate_payload['class_scope'] = plan['class_scope']
        versions[name] = {'deck_id': deck_id, 'candidate_sha256': expected, 'offering_id': plan['offering_id'],
                          'lesson_keys': plan['lesson_keys'], 'entry_file': Path(plan['source']).name,
                          'files': entries, 'approval_sha256': proof_hash, 'teacher_approval_sha256': teacher_hash, 'review_evidence': plan['review_evidence'], 'review_archive': review_archive,
                          'candidate_payload': candidate_payload}
        preserve_prior_manifest(staging, prior)
        write_json(staging / 'transaction.json', {'stage': 'staged', 'lesson_key': context.lesson_key, 'operation': 'promote', 'target': str(target), 'manifest': str(path)})
        parent.mkdir(parents=True, exist_ok=True)
        rename_noreplace(payload, target)
        published = True
        sync_directory(parent)
        atomic_manifest(path, manifest, staging, prior)
        committed = True
        failures = audit_authority_manifest(ROOT, context.authority_root, json.loads(path.read_text()))['failures']
        if failures:
            raise ValueError('Authority readback failed: ' + '; '.join(failures))
        mark_transaction(staging, 'committed')
        return {'status': 'approved', 'lesson_key': context.lesson_key, 'version': name,
                'candidate_sha256': expected, 'authority_path': target.relative_to(ROOT).as_posix(),
                'transaction': staging.relative_to(ROOT).as_posix()}
    except Exception:
        if committed:
            restore_manifest(path, prior, staging)
        if published and target is not None and target.exists():
            rename_noreplace(target, staging / 'rolled-back-payload')
        mark_transaction(staging, 'rolled_back')
        raise
    finally:
        lock.close()


def release(lesson_key, offering, version, release_id, human_evidence):
    if not ID.fullmatch(release_id) or not ID.fullmatch(version):
        raise ValueError('Invalid version or release ID')
    context = resolve_lesson_context(ROOT, lesson_key, offering)
    lock, staging = transaction(ROOT, lesson_key)
    target = _safe_project_path(context.release_root, release_id)
    published = committed = False
    try:
        path, manifest, prior = clean_manifest(ROOT, context)
        if prior is None:
            raise ValueError('An approved authority manifest is required')
        version_data = manifest.get('authority', {}).get('classroom_html', {}).get(version)
        if not isinstance(version_data, dict):
            raise ValueError('Approved classroom version not found')
        candidate_payload = version_data.get('candidate_payload')
        fingerprint = hashlib.sha256(json.dumps(candidate_payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        if fingerprint != version_data.get('candidate_sha256'):
            raise ValueError('Approved candidate payload has changed')
        plan = {'candidate_sha256': version_data['candidate_sha256'], 'deck_id': version_data['deck_id'],
                'offering_id': version_data['offering_id'], 'lesson_keys': version_data['lesson_keys']}
        if 'class_scope' in candidate_payload:
            plan['class_scope'] = candidate_payload['class_scope']
        proof, _, proof_hash = evidence(ROOT, human_evidence, context.design_root, 'classroom-release', plan, release_id)
        approval = json.loads(proof.read_text())
        checks = approval.get('human_checks', {})
        if not isinstance(checks, dict):
            raise ValueError('human_checks must be an object')
        checks = {key: checks.get(key, {'status': 'not_requested'}) for key in ('teacher_rehearsal', 'audio_playback')}
        if any(not isinstance(checks[k], dict) or checks[k].get('status') not in ('passed', 'explicitly-waived', 'not_requested') for k in checks):
            raise ValueError('Human check status must be passed, explicitly-waived or not_requested')
        check_files = {}
        for key in ('teacher_rehearsal', 'audio_playback'):
            check = checks[key]
            if check['status'] == 'not_requested':
                continue
            check_path, _ = resolve_relative_path(ROOT, check.get('evidence'), required_root=context.design_root)
            if not check_path.is_file() or not check_path.read_text(encoding='utf-8').strip() or sha256(check_path) != check.get('sha256'):
                raise ValueError(f'{key} requires independent, hash-bound human evidence')
            check_files[key] = check_path
        if offering != version_data['offering_id']:
            raise ValueError('Release offering differs from approved classroom version')
        if target.exists():
            raise ValueError('Release ID already exists')
        release_payload = staging / 'release'
        package = release_payload / f'{context.lesson_id}-教材包'
        package.mkdir(parents=True)
        expected_files = []
        root_dir = context.authority_root / 'html' / version
        candidate_files = {item['path']: item for item in candidate_payload['files']}
        archived_review = version_data.get('review_archive')
        if not isinstance(archived_review, list) or len(archived_review) != len(candidate_payload['review_evidence']):
            raise ValueError('Approved review evidence inventory is incomplete')
        review_paths = set()
        for original, stored in zip(candidate_payload['review_evidence'], archived_review):
            file, relative = resolve_relative_path(ROOT, stored.get('path'), required_root=root_dir / '_review-evidence')
            if (stored.get('source') != original['path'] or stored.get('sha256') != original['sha256']
                    or not file.is_file() or sha256(file) != original['sha256'] or relative in review_paths):
                raise ValueError('Archived review evidence differs from the approved candidate')
            review_paths.add(relative)
        seen_paths = set()
        found_approval = False
        found_teacher_approval = False
        for item in version_data['files']:
            source, _ = resolve_relative_path(ROOT, item['path'], required_root=root_dir)
            if source.is_relative_to(root_dir / '_review-evidence'):
                if item['path'] not in review_paths:
                    raise ValueError('Unexpected archived review evidence')
                continue
            if source.name == '_human-approval.json':
                if found_approval or sha256(source) != version_data['approval_sha256']:
                    raise ValueError('Approved evidence changed')
                evidence(ROOT, item['path'], root_dir, 'classroom-deck-approval', plan)
                found_approval = True
                continue
            if source.name == '_teacher-approval.json':
                if found_teacher_approval or sha256(source) != version_data['teacher_approval_sha256']:
                    raise ValueError('Teacher approval evidence changed')
                evidence(ROOT, item['path'], root_dir, 'classroom-teacher-materials-approval', plan)
                found_teacher_approval = True
                continue
            relative = source.relative_to(root_dir).as_posix()
            portable, error = portable_release_path_key(relative)
            if (error or portable in seen_paths or relative not in candidate_files
                    or candidate_files[relative]['sha256'] != item['sha256']
                    or candidate_files[relative]['bytes'] != item['bytes']
                    or sha256(source) != item['sha256'] or source.stat().st_size != item['bytes']):
                raise ValueError(f'Unsafe or changed approved file: {relative}')
            seen_paths.add(portable)
            dest = _safe_project_path(package, relative)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            expected_files.append({'path': relative, 'sha256': item['sha256'], 'bytes': item['bytes']})
        if not any(x['path'] == version_data['entry_file'] for x in expected_files):
            raise ValueError('Approved entry HTML is missing')
        if not found_approval or not found_teacher_approval:
            raise ValueError('Approved deck or teacher human evidence is missing')
        if {x['path'] for x in expected_files} != set(candidate_files):
            raise ValueError('Approved release omits candidate files')
        archive_path = release_payload / f'{context.lesson_id}-教材包.zip'
        with zipfile.ZipFile(archive_path, 'x', zipfile.ZIP_DEFLATED) as z:
            for item in expected_files:
                z.write(package / item['path'], f'{package.name}/{item["path"]}')
        with zipfile.ZipFile(archive_path) as z:
            if z.testzip() or set(z.namelist()) != {f'{package.name}/{x["path"]}' for x in expected_files}:
                raise ValueError('Release ZIP contents failed verification')
            for item in expected_files:
                if hashlib.sha256(z.read(f'{package.name}/{item["path"]}')).hexdigest() != item['sha256']:
                    raise ValueError('Release ZIP byte verification failed')
        if sha256(proof) != proof_hash:
            raise ValueError('Release authorization changed during staging')
        evidence_dir = release_payload / 'human-evidence'
        evidence_dir.mkdir()
        for key, check_path in check_files.items():
            if sha256(check_path) != checks[key]['sha256']:
                raise ValueError(f'{key} evidence changed during staging')
            shutil.copyfile(check_path, evidence_dir / f'{key}.txt')
            if sha256(evidence_dir / f'{key}.txt') != checks[key]['sha256']:
                raise ValueError(f'{key} evidence copy failed verification')
        metadata = {'release_id': release_id, 'lesson_key': lesson_key, 'offering_id': offering,
                    'version': version, 'candidate_sha256': plan['candidate_sha256'], 'files': expected_files,
                    'zip_sha256': sha256(archive_path), 'release_evidence_sha256': proof_hash,
                    'human_checks': {key: {'status': checks[key]['status'], **({'sha256': checks[key]['sha256']} if key in check_files else {})} for key in checks},
                    'status': 'immutable', 'copy_only': True}
        write_json(release_payload / 'release.json', metadata)
        shutil.copyfile(proof, release_payload / 'release-evidence.json')
        for item in expected_files:
            if sha256(package / item['path']) != item['sha256']:
                raise ValueError('Release copy failed verification')
        releases = manifest.setdefault('classroom_html_releases', {})
        if release_id in releases:
            raise ValueError('Release ID already declared')
        releases[release_id] = {'version': version, 'path': target.relative_to(ROOT).as_posix(),
                                'zip_sha256': metadata['zip_sha256'], 'candidate_sha256': plan['candidate_sha256'],
                                'release_metadata_sha256': sha256(release_payload / 'release.json'),
                                'release_evidence_sha256': proof_hash}
        preserve_prior_manifest(staging, prior)
        write_json(staging / 'transaction.json', {'stage': 'staged', 'lesson_key': lesson_key, 'operation': 'release', 'target': str(target), 'manifest': str(path)})
        context.release_root.mkdir(parents=True, exist_ok=True)
        rename_noreplace(release_payload, target)
        published = True
        sync_directory(context.release_root)
        atomic_manifest(path, manifest, staging, prior)
        committed = True
        if sha256(target / archive_path.name) != metadata['zip_sha256'] or audit_authority_manifest(ROOT, context.authority_root, json.loads(path.read_text()))['failures']:
            raise ValueError('Release readback failed')
        verify_release(lesson_key, offering, release_id)
        mark_transaction(staging, 'committed')
        return {'status': 'released', 'release_id': release_id, 'path': target.relative_to(ROOT).as_posix(),
                'zip_sha256': metadata['zip_sha256'], 'transaction': staging.relative_to(ROOT).as_posix()}
    except Exception:
        if committed:
            restore_manifest(path, prior, staging)
        if published and target.exists():
            rename_noreplace(target, staging / 'rolled-back-release')
        mark_transaction(staging, 'rolled_back')
        raise
    finally:
        lock.close()


def verify_release(lesson_key, offering, release_id):
    if not ID.fullmatch(release_id):
        raise ValueError('Invalid release ID')
    context = resolve_lesson_context(ROOT, lesson_key, offering)
    _, manifest, prior = clean_manifest(ROOT, context)
    if prior is None:
        raise ValueError('Authority manifest is missing')
    pointer = manifest.get('classroom_html_releases', {}).get(release_id)
    if not isinstance(pointer, dict):
        raise ValueError('Release is not registered in authority manifest')
    target, _ = resolve_relative_path(ROOT, pointer['path'], required_root=context.release_root)
    meta_path = _safe_project_path(target, 'release.json')
    meta = json.loads(meta_path.read_text(encoding='utf-8'))
    if sha256(meta_path) != pointer.get('release_metadata_sha256'):
        raise ValueError('Release metadata hash changed')
    if (meta.get('release_id') != release_id or meta.get('lesson_key') != lesson_key
            or meta.get('offering_id') != offering or meta.get('status') != 'immutable'
            or meta.get('candidate_sha256') != pointer.get('candidate_sha256')
            or meta.get('version') != pointer.get('version')):
        raise ValueError('Release metadata identity mismatch')
    version = manifest.get('authority', {}).get('classroom_html', {}).get(meta['version'])
    if not isinstance(version, dict) or version.get('candidate_sha256') != meta['candidate_sha256']:
        raise ValueError('Release does not match an approved version')
    payload = version.get('candidate_payload')
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    if fingerprint != meta['candidate_sha256']:
        raise ValueError('Approved candidate payload has changed')
    version_root = _safe_project_path(context.authority_root, f'html/{meta["version"]}')
    approved_plan = {'candidate_sha256': version['candidate_sha256'], 'deck_id': version['deck_id'],
                     'offering_id': version['offering_id'], 'lesson_keys': version['lesson_keys']}
    if 'class_scope' in payload:
        approved_plan['class_scope'] = payload['class_scope']
    for name, field, gate in (('_human-approval.json', 'approval_sha256', 'classroom-deck-approval'),
                              ('_teacher-approval.json', 'teacher_approval_sha256', 'classroom-teacher-materials-approval')):
        proof = _safe_project_path(version_root, name)
        evidence(ROOT, proof.relative_to(ROOT).as_posix(), version_root, gate, approved_plan)
        if sha256(proof) != version.get(field):
            raise ValueError('Archived approval evidence changed')
    archived = version.get('review_archive')
    if not isinstance(archived, list) or len(archived) != len(payload['review_evidence']):
        raise ValueError('Archived review evidence is incomplete')
    for original, saved in zip(payload['review_evidence'], archived):
        file, _ = resolve_relative_path(ROOT, saved.get('path'), required_root=version_root / '_review-evidence')
        if saved.get('source') != original['path'] or saved.get('sha256') != original['sha256'] or sha256(file) != original['sha256']:
            raise ValueError('Archived review evidence changed')
    if (sha256(_safe_project_path(target, 'release-evidence.json')) != meta.get('release_evidence_sha256')
            or meta.get('release_evidence_sha256') != pointer.get('release_evidence_sha256')):
        raise ValueError('Release authorization evidence changed')
    authorization = json.loads(_safe_project_path(target, 'release-evidence.json').read_text(encoding='utf-8'))
    evidence(ROOT, (target / 'release-evidence.json').relative_to(ROOT).as_posix(), target,
             'classroom-release', approved_plan, release_id)
    if (authorization.get('gate') not in ('classroom-release', 'classroom-package-approval') or authorization.get('release_id') != release_id
            or (authorization.get('gate') == 'classroom-package-approval' and 'release' not in authorization.get('authorized_actions', []))
            or authorization.get('candidate_sha256') != meta['candidate_sha256']
            or authorization.get('lesson_keys') != version.get('lesson_keys')
            or authorization.get('offering_id') != offering):
        raise ValueError('Release authorization identity mismatch')
    for key in ('teacher_rehearsal', 'audio_playback'):
        check = meta.get('human_checks', {}).get(key, {})
        original_check = authorization.get('human_checks', {}).get(key, {'status': 'not_requested'})
        if check.get('status') == 'not_requested' and original_check.get('status') == 'not_requested':
            continue
        if (check.get('status') not in ('passed', 'explicitly-waived')
                or check.get('status') != original_check.get('status')
                or check.get('sha256') != original_check.get('sha256')
                or sha256(_safe_project_path(target, f'human-evidence/{key}.txt')) != check.get('sha256')):
            raise ValueError(f'{key} evidence changed or is missing')
    package = _safe_project_path(target, f'{context.lesson_id}-教材包')
    if symlinks_under(target):
        raise ValueError('Release contains a symlink')
    archive = _safe_project_path(target, f'{context.lesson_id}-教材包.zip')
    if sha256(archive) != meta.get('zip_sha256') or meta['zip_sha256'] != pointer.get('zip_sha256'):
        raise ValueError('Release ZIP hash changed')
    expected = {item['path']: item for item in payload['files']}
    actual = {item.relative_to(package).as_posix(): item for item in material_files(package)}
    if set(expected) != set(actual):
        raise ValueError('Release package contents differ from approved candidate')
    permitted = {f'{package.name}/{name}' for name in expected} | {archive.name, 'release.json', 'release-evidence.json'}
    permitted |= {f'human-evidence/{key}.txt' for key in ('teacher_rehearsal', 'audio_playback') if meta['human_checks'][key]['status'] != 'not_requested'}
    if {item.relative_to(target).as_posix() for item in material_files(target)} != permitted:
        raise ValueError('Release directory contains unexpected or missing files')
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        if z.testzip() or len(names) != len(set(names)) or set(names) != {f'{package.name}/{x}' for x in expected}:
            raise ValueError('Release ZIP contents differ from approved candidate')
        for relative, item in expected.items():
            if sha256(actual[relative]) != item['sha256'] or hashlib.sha256(z.read(f'{package.name}/{relative}')).hexdigest() != item['sha256']:
                raise ValueError(f'Release file changed: {relative}')
    return {'status': 'verified', 'release_id': release_id, 'path': pointer['path'], 'write_performed': False}


def inspect_transactions(lesson_key, offering):
    resolve_lesson_context(ROOT, lesson_key, offering)
    records = []
    for marker in (ROOT / '.agent/runs').glob('classroom-release-transaction-*/transaction.json'):
        safe, relative = resolve_relative_path(ROOT, marker.relative_to(ROOT).as_posix(), required_root=ROOT / '.agent/runs')
        data = json.loads(safe.read_text(encoding='utf-8'))
        if data.get('lesson_key') == lesson_key and data.get('stage') == 'staged':
            records.append({'marker': relative, 'operation': data.get('operation'), 'target': data.get('target'),
                            'manifest': data.get('manifest'), 'prior_snapshot': str(marker.parent / 'prior-manifest.json')})
    return {'status': 'review' if records else 'clear', 'transactions': records, 'write_performed': False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    s = p.add_subparsers(dest='operation', required=True)
    a = s.add_parser('promote')
    a.add_argument('--deck-id', required=True)
    a.add_argument('--candidate-sha256', required=True)
    a.add_argument('--evidence', required=True)
    a.add_argument('--teacher-evidence', help='Separate teacher approval; omit only for an explicit combined package approval')
    b = s.add_parser('release')
    for arg in ('lesson-key', 'offering-id', 'version', 'release-id', 'evidence'):
        b.add_argument('--' + arg, required=True)
    c = s.add_parser('verify')
    for arg in ('lesson-key', 'offering-id', 'release-id'):
        c.add_argument('--' + arg, required=True)
    d = s.add_parser('inspect')
    d.add_argument('--lesson-key', required=True)
    d.add_argument('--offering-id', required=True)
    args = p.parse_args()
    try:
        if args.operation == 'promote':
            result = promote(args.deck_id, args.candidate_sha256, args.evidence, args.teacher_evidence)
        elif args.operation == 'release':
            result = release(args.lesson_key, args.offering_id, args.version, args.release_id, args.evidence)
        elif args.operation == 'verify':
            result = verify_release(args.lesson_key, args.offering_id, args.release_id)
        else:
            result = inspect_transactions(args.lesson_key, args.offering_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, TypeError, OSError, RuntimeError, KeyError, AttributeError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
        print(json.dumps({'status': 'blocked', 'error': str(exc)}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.exit(main())
