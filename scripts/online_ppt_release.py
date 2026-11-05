#!/usr/bin/env python3
"""Guarded, offering-scoped online PPTX approval and immutable delivery.

All decisions require real user evidence. Plan and verify are read-only.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import shutil
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image
import production_gate
import classroom_release as tx
from lesson_context import resolve_lesson_context, _safe_project_path
from verify_pptx_audio_policy import verify as verify_audio_policy
from workflow_integrity import audit_authority_manifest, material_files, resolve_relative_path, sha256, symlinks_under

ROOT = Path(__file__).resolve().parents[1]
ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,79}\Z')
P = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'


def _scoped(root, value, boundary):
    path, name = resolve_relative_path(root, value, required_root=boundary)
    if not path.is_file():
        raise ValueError(f'Required file missing: {name}')
    return path, name


def _review_input(context, lesson_key, value):
    textbook_id = lesson_key.split(':', 1)[0]
    if not ID.fullmatch(textbook_id):
        raise ValueError('Invalid textbook identity')
    textbook_source = _safe_project_path(ROOT, f'textbooks/{textbook_id}/source')
    for boundary in (context.lesson_root, textbook_source):
        try:
            return _scoped(ROOT, value, boundary)
        except ValueError:
            pass
    raise ValueError('Review evidence must belong to this lesson or its textbook source')


def inspect_pptx(path, spec):
    with zipfile.ZipFile(path) as package:
        names = package.namelist()
        if len(names) != len(set(names)) or package.testzip():
            raise ValueError('PPTX ZIP contains duplicate or corrupt entries')
        if '[Content_Types].xml' not in names or 'ppt/presentation.xml' not in names:
            raise ValueError('PPTX package metadata is missing')
        slide_paths = sorted((n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
                             key=lambda n: int(re.search(r'slide(\d+)', n).group(1)))
        presentation = ET.fromstring(package.read('ppt/presentation.xml'))
        size = presentation.find(f'{P}sldSz')
        if size is None or not size.get('cx') or not size.get('cy') or abs(int(size.get('cx')) / int(size.get('cy')) - 16 / 9) > .01:
            raise ValueError('PPTX must use a 16:9 slide size')
        slide_ids = presentation.findall(f'.//{P}sldId')
        if not slide_paths or len(slide_paths) != len(slide_ids):
            raise ValueError('PPTX slide inventory does not match presentation order')
        expected_slides = spec.get('slides') if isinstance(spec, dict) else None
        if not isinstance(expected_slides, list) or len(expected_slides) != len(slide_paths):
            raise ValueError('Approved slide specification does not match PPTX slide count')
        for number, name in enumerate(slide_paths):
            slide = ET.fromstring(package.read(name))
            if not any((node.text or '').strip() for node in slide.iter(f'{A}t')) and not list(slide.iter(f'{P}pic')):
                raise ValueError(f'Empty slide: {name}')
            actual = ''.join(node.text or '' for node in slide.iter(f'{A}t')).replace('\n', '')
            elements = expected_slides[number].get('elements', [])
            expected = ''.join((item['text'] if item['type'] == 'text' else ''.join(x for row in item['cells'] for x in row)).replace('\n', '')
                               for item in elements if item.get('type') in ('text', 'table'))
            if actual != expected:
                raise ValueError(f'PPTX slide {number + 1} text differs from approved copy')
            for label in expected_slides[number].get('audio', []):
                if not isinstance(label, str) or not re.fullmatch(r'Audio [0-9]+-[0-9]+', label) or label not in actual:
                    raise ValueError(f'PPTX slide {number + 1} has an invalid or missing audio label')
        for name in names:
            if name.endswith('.rels'):
                rels = ET.fromstring(package.read(name))
                for rel in rels:
                    if rel.get('TargetMode') == 'External' and rel.get('Type', '').endswith('/image'):
                        raise ValueError('External image relationship is not allowed')
        failures = verify_audio_policy(path)
        if failures:
            raise ValueError('PPTX audio policy failed: ' + '; '.join(failures))
        return len(slide_paths)


def plan(lesson_key, offering_id, artifact_id, class_scope, approval_record, pptx, qa_report):
    out = {'command': 'plan', 'status': 'blocked', 'write_performed': False,
           'approval_granted': False, 'blockers': []}
    try:
        if not ID.fullmatch(offering_id or '') or not ID.fullmatch(artifact_id or '') or not class_scope or not class_scope.strip():
            raise ValueError('Explicit valid offering, artifact ID and class scope are required')
        context = resolve_lesson_context(ROOT, lesson_key, offering_id)
        output_root = _safe_project_path(context.design_root, f'pptx-draft/online/{offering_id}/{artifact_id}')
        gate = production_gate.check_content_approval(lesson_key, offering_id, approval_record, 'online', artifact_id, class_scope)
        if gate['status'] != 'ready':
            raise ValueError('Content approval gate: ' + '; '.join(gate['blockers']))
        build_path, build_name = _scoped(ROOT, (output_root / 'build-manifest.json').relative_to(ROOT).as_posix(), output_root)
        build = json.loads(build_path.read_text(encoding='utf-8'))
        if (not isinstance(build, dict) or any(build.get(k) != v for k, v in {'lesson_key': lesson_key, 'offering_id': offering_id,
                'artifact_id': artifact_id, 'class_scope': class_scope, 'approval_record': approval_record}.items())):
            raise ValueError('Build manifest identity or approved input differs from requested version')
        approval_path, approval_name = _scoped(ROOT, approval_record, context.design_root / 'approvals')
        approval = json.loads(approval_path.read_text(encoding='utf-8'))
        review, review_name = _scoped(ROOT, approval.get('review_path'), context.design_root)
        if build.get('review_path') != review_name or build.get('review_sha256') != sha256(review):
            raise ValueError('Build manifest review copy differs from approved input')
        spec = json.loads(review.read_text(encoding='utf-8'))
        if not isinstance(spec, dict) or any(spec.get(k) != v for k, v in {'lesson_key': lesson_key, 'offering_id': offering_id, 'artifact_id': artifact_id, 'class_scope': class_scope}.items()):
            raise ValueError('Approved slide specification identity mismatch')
        deck, deck_name = _scoped(ROOT, pptx, output_root)
        if deck.name != f'{context.lesson_id}-在线预习.pptx':
            raise ValueError('Online PPTX must use the canonical lesson filename')
        if build.get('pptx', {}).get('path') != deck_name or build.get('pptx', {}).get('sha256') != sha256(deck):
            raise ValueError('Built PPTX changed after the generator finished')
        slide_count = inspect_pptx(deck, spec)
        if build.get('slides') != slide_count:
            raise ValueError('Build manifest slide count differs from the actual PPTX')
        resources = build.get('resources')
        if not isinstance(resources, list):
            raise ValueError('Build manifest resources are invalid')
        declared = {}
        for item in resources:
            if not isinstance(item, dict) or not isinstance(item.get('path'), str) or item['path'] in declared:
                raise ValueError('Build manifest contains invalid or duplicate resources')
            declared[item['path']] = item.get('sha256')
        expected_resources = {}
        for slide in spec['slides']:
            for item in slide.get('elements', []):
                if item.get('type') == 'image':
                    source, name = _scoped(ROOT, item.get('path'), context.design_root)
                    expected_resources[name] = sha256(source)
        if declared != expected_resources:
            raise ValueError('Build images differ from approved slide specification')
        with zipfile.ZipFile(deck) as package:
            media_hashes = set()
            for name in package.namelist():
                if not name.startswith('ppt/media/') or name.endswith('/'):
                    continue
                data = package.read(name)
                if Path(name).suffix.lower() in ('.png', '.jpg', '.jpeg'):
                    with Image.open(io.BytesIO(data)) as embedded:
                        embedded.verify()
                media_hashes.add(hashlib.sha256(data).hexdigest())
            for item in resources:
                source, _ = _scoped(ROOT, item.get('path'), context.design_root)
                if sha256(source) != item.get('sha256') or item.get('sha256') not in media_hashes:
                    raise ValueError('Approved image changed or is not embedded in PPTX')
        qa, qa_name = _scoped(ROOT, qa_report, output_root)
        report = json.loads(qa.read_text(encoding='utf-8'))
        if (not isinstance(report, dict) or report.get('schema_version') != 'online-pptx-qa-v1'
                or report.get('status') != 'passed' or report.get('pptx_sha256') != sha256(deck)
                or report.get('lesson_key') != lesson_key or report.get('offering_id') != offering_id
                or report.get('artifact_id') != artifact_id or report.get('class_scope') != class_scope
                or report.get('slide_count') != slide_count or report.get('issues') != []
                or report.get('content_checked') is not True or report.get('visual_checked') is not True):
            raise ValueError('QA report is incomplete, not passed or does not match the exact PPTX')
        pages = report.get('pages')
        if not isinstance(pages, list) or len(pages) != slide_count:
            raise ValueError('QA must include every rendered slide')
        references = [{'path': qa_name, 'sha256': sha256(qa)}, {'path': build_name, 'sha256': sha256(build_path)}]
        references.extend({'path': name, 'sha256': digest} for name, digest in sorted(declared.items()))
        app_check = report.get('application_check')
        if (not isinstance(app_check, dict) or app_check.get('status') != 'passed'
                or not isinstance(app_check.get('application'), str) or not app_check['application'].strip()
                or not isinstance(app_check.get('evidence'), dict)):
            raise ValueError('Actual application open and edit check evidence is required')
        app_proof, app_name = _scoped(ROOT, app_check['evidence'].get('path'), context.design_root)
        if not app_proof.stat().st_size or sha256(app_proof) != app_check['evidence'].get('sha256'):
            raise ValueError('Application open and edit evidence is missing or changed')
        references.append({'path': app_name, 'sha256': sha256(app_proof)})
        labels = {label for slide in spec['slides'] for label in slide.get('audio', [])}
        audio_qa = report.get('audio', [])
        if not isinstance(audio_qa, list) or {a.get('label') for a in audio_qa if isinstance(a, dict)} != labels or len(audio_qa) != len(labels):
            raise ValueError('Audio QA must cover the exact labels in the approved slide specification')
        for item in audio_qa:
            if (not isinstance(item, dict) or any(item.get(field) is not True for field in
                    ('source_verified', 'decode_verified', 'semantic_verified', 'playback_verified'))
                    or not isinstance(item.get('playback_method'), str) or not item['playback_method'].strip()):
                raise ValueError('Audio source, decoding, semantics, actual playback and usable method must each be verified')
            source = item.get('source')
            if not isinstance(source, dict) or source.get('kind') not in ('local', 'url'):
                raise ValueError('Audio source must identify a local file or URL')
            if source['kind'] == 'local':
                audio_file, audio_name = _review_input(context, lesson_key, source.get('path'))
                if sha256(audio_file) != source.get('sha256'):
                    raise ValueError('Audio source file changed')
                references.append({'path': audio_name, 'sha256': sha256(audio_file)})
            elif not isinstance(source.get('url'), str) or not source['url'].startswith(('https://', 'http://')):
                raise ValueError('Audio source URL is invalid')
            evidence = item.get('playback_evidence')
            if not isinstance(evidence, dict):
                raise ValueError('Audio actual playback evidence is missing')
            evidence_path, evidence_name = _scoped(ROOT, evidence.get('path'), context.design_root)
            if not evidence_path.stat().st_size or sha256(evidence_path) != evidence.get('sha256'):
                raise ValueError('Audio actual playback evidence changed or is empty')
            references.append({'path': evidence_name, 'sha256': sha256(evidence_path)})
            semantic = item.get('semantic_evidence')
            if spec.get('layout_reference') or semantic is not None:
                if not isinstance(semantic, dict):
                    raise ValueError('Audio semantic comparison evidence is required for the current native-reference flow')
                semantic_path, semantic_name = _scoped(ROOT, semantic.get('path'), context.design_root)
                if not semantic_path.stat().st_size or sha256(semantic_path) != semantic.get('sha256'):
                    raise ValueError('Audio semantic comparison evidence changed or is empty')
                references.append({'path': semantic_name, 'sha256': sha256(semantic_path)})
        seen = set()
        for idx, item in enumerate(pages, 1):
            if not isinstance(item, dict) or item.get('index') != idx or item.get('issues') != []:
                raise ValueError(f'QA page {idx} is missing or has issues')
            image, image_name = _scoped(ROOT, item.get('image'), output_root)
            if image_name in seen or sha256(image) != item.get('sha256'):
                raise ValueError(f'QA image {idx} is duplicate or changed')
            seen.add(image_name)
            with Image.open(image) as rendered:
                if rendered.format != 'PNG' or rendered.width < 960 or rendered.height < 540:
                    raise ValueError(f'QA image {idx} is too small or is not PNG')
                rendered.load()
                if all(lo == hi for lo, hi in rendered.convert('RGB').getextrema()):
                    raise ValueError(f'QA image {idx} is blank')
            references.append({'path': image_name, 'sha256': sha256(image)})
        references.append({'path': approval_name, 'sha256': sha256(approval_path)})
        proof, proof_name = _scoped(ROOT, approval.get('evidence'), context.design_root)
        if sha256(proof) != approval.get('evidence_sha256'):
            raise ValueError('Content approval evidence changed')
        references.append({'path': proof_name, 'sha256': sha256(proof)})
        for item in approval['artifacts']:
            item_path, item_name = _scoped(ROOT, item.get('path'), context.lesson_root)
            if sha256(item_path) != item.get('sha256'):
                raise ValueError('Approved input changed')
            references.append({'path': item_name, 'sha256': sha256(item_path)})
        payload = {'lesson_key': lesson_key, 'offering_id': offering_id, 'artifact_id': artifact_id,
                   'class_scope': class_scope, 'scope': 'online', 'pptx_path': deck_name,
                   'pptx_sha256': sha256(deck), 'pptx_bytes': deck.stat().st_size,
                   'slide_count': slide_count, 'approval_record': approval_name, 'qa_report': qa_name,
                   'review_evidence': references}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        manifest_path = context.authority_root / 'lesson-manifest.json'
        existing = sha256(manifest_path) if manifest_path.exists() else None
        if manifest_path.exists():
            _, _, _ = tx.clean_manifest(ROOT, context)
        elif context.authority_root.exists() and any(p.is_file() or p.is_symlink() for p in context.authority_root.rglob('*')):
            raise ValueError('Existing authority contains files but has no manifest')
        out.update({'status': 'ready_for_human_review', 'candidate_sha256': digest,
                    'candidate_payload': payload, 'existing_authority_sha256': existing})
    except (ValueError, TypeError, KeyError, AttributeError, OSError, RuntimeError, ET.ParseError, zipfile.BadZipFile) as exc:
        out['blockers'].append(str(exc))
    return out


def validate_decision(item, payload, digest, release_id=None):
    if not isinstance(item, dict) or item.get('gate') not in ('online-package-approval', 'online-release'):
        raise ValueError('Online human approval evidence is required')
    for field in ('lesson_key', 'offering_id', 'artifact_id', 'class_scope'):
        if item.get(field) != payload[field]:
            raise ValueError('Online human approval identity does not match candidate')
    if (item.get('candidate_sha256') != digest or not isinstance(item.get('approved_by'), str) or not item['approved_by'].strip()
            or not isinstance(item.get('user_decision'), str) or not item['user_decision'].strip()):
        raise ValueError('Human decision must explicitly bind the candidate')
    stamp = datetime.fromisoformat(item.get('approved_at') or '')
    if stamp.tzinfo is None or stamp.utcoffset() is None:
        raise ValueError('Approval timestamp must include timezone')
    if release_id is None:
        if item['gate'] != 'online-package-approval' or not isinstance(item.get('approved_components'), list) or 'pptx' not in item['approved_components']:
            raise ValueError('PPTX approval must explicitly include the PPTX')
    elif item.get('release_id') != release_id or not isinstance(item.get('authorized_actions'), list) or 'release' not in item['authorized_actions']:
        raise ValueError('Explicit authorization of this exact release ID is required')


def human_evidence(context, value, payload, digest, release_id=None):
    path, _ = _scoped(ROOT, value, context.design_root)
    validate_decision(json.loads(path.read_text(encoding='utf-8')), payload, digest, release_id)
    return path, sha256(path)


def promote(lesson_key, offering_id, artifact_id, class_scope, approval_record, pptx, qa_report, expected, evidence):
    args = (lesson_key, offering_id, artifact_id, class_scope, approval_record, pptx, qa_report)
    first = plan(*args)
    if first.get('status') != 'ready_for_human_review' or first.get('candidate_sha256') != expected:
        raise ValueError('Candidate is blocked or changed: ' + '; '.join(first['blockers']))
    context = resolve_lesson_context(ROOT, lesson_key, offering_id)
    lock, staging = tx.transaction(ROOT, lesson_key)
    published = committed = False
    target = None
    try:
        current = plan(*args)
        if current.get('status') != 'ready_for_human_review' or current.get('candidate_sha256') != expected:
            raise ValueError('Candidate changed after review')
        payload = current['candidate_payload']
        proof, proof_hash = human_evidence(context, evidence, payload, expected)
        path, manifest, prior = tx.clean_manifest(ROOT, context)
        if current.get('existing_authority_sha256') != (sha256(path) if prior is not None else None):
            raise ValueError('Authority changed after candidate review')
        parent = _safe_project_path(context.authority_root, f'pptx/online/{offering_id}/{artifact_id}')
        target = _safe_project_path(parent, expected)
        if target.exists():
            raise ValueError('Approved version already exists')
        stage = staging / 'payload'
        stage.mkdir()
        deck, _ = _scoped(ROOT, payload['pptx_path'], context.design_root)
        shutil.copyfile(deck, stage / deck.name)
        if sha256(stage / deck.name) != payload['pptx_sha256']:
            raise ValueError('PPTX changed during copy')
        shutil.copyfile(proof, stage / '_human-approval.json')
        if sha256(stage / '_human-approval.json') != proof_hash:
            raise ValueError('Approval evidence changed during copy')
        archived = []
        for index, item in enumerate(payload['review_evidence']):
            source, _ = _review_input(context, lesson_key, item['path'])
            if sha256(source) != item['sha256']:
                raise ValueError('Review input changed during copy')
            suffix = source.suffix if re.fullmatch(r'\.[A-Za-z0-9]{1,8}', source.suffix) else '.bin'
            dest = stage / '_review-evidence' / f'{index:03d}{suffix}'
            dest.parent.mkdir(exist_ok=True)
            shutil.copyfile(source, dest)
            if sha256(dest) != item['sha256']:
                raise ValueError('Review input copy changed')
            archived.append({'source': item['path'], 'sha256': item['sha256'],
                             'path': (target / dest.relative_to(stage)).relative_to(ROOT).as_posix()})
        check = plan(*args)
        if check.get('status') != 'ready_for_human_review' or check.get('candidate_sha256') != expected or check.get('existing_authority_sha256') != current.get('existing_authority_sha256'):
            raise ValueError('Candidate or authority changed during staging')
        entries = [{'path': (target / p.relative_to(stage)).relative_to(ROOT).as_posix(),
                    'sha256': sha256(p), 'bytes': p.stat().st_size} for p in material_files(stage)]
        manifest['files'].extend(entries)
        versions = manifest.setdefault('authority', {}).setdefault('online_pptx', {})
        if expected in versions:
            raise ValueError('Online version already declared')
        versions[expected] = {'candidate_sha256': expected, 'candidate_payload': payload,
                              'files': entries, 'review_archive': archived, 'approval_sha256': proof_hash,
                              'offering_id': offering_id, 'artifact_id': artifact_id, 'class_scope': class_scope}
        tx.preserve_prior_manifest(staging, prior)
        tx.write_json(staging / 'transaction.json', {'stage': 'staged', 'lesson_key': lesson_key,
            'operation': 'online-promote', 'target': str(target), 'manifest': str(path)})
        parent.mkdir(parents=True, exist_ok=True)
        tx.rename_noreplace(stage, target)
        published = True
        tx.sync_directory(parent)
        tx.atomic_manifest(path, manifest, staging, prior)
        committed = True
        failures = audit_authority_manifest(ROOT, context.authority_root, json.loads(path.read_text()))['failures']
        if failures:
            raise ValueError('Online authority readback failed: ' + '; '.join(failures))
        tx.mark_transaction(staging, 'committed')
        return {'status': 'approved', 'candidate_sha256': expected, 'authority_path': target.relative_to(ROOT).as_posix(), 'write_performed': True}
    except Exception:
        if committed:
            tx.restore_manifest(path, prior, staging)
        if published and target is not None and target.exists():
            tx.rename_noreplace(target, staging / 'rolled-back-payload')
        tx.mark_transaction(staging, 'rolled_back')
        raise
    finally:
        lock.close()


def _approved(context, manifest, digest):
    version = manifest.get('authority', {}).get('online_pptx', {}).get(digest)
    if not isinstance(version, dict):
        raise ValueError('Approved online version is missing')
    payload = version['candidate_payload']
    actual = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    if actual != digest or version.get('candidate_sha256') != digest:
        raise ValueError('Approved online candidate metadata changed')
    target = _safe_project_path(context.authority_root, f'pptx/online/{payload["offering_id"]}/{payload["artifact_id"]}/{digest}')
    deck = _safe_project_path(target, Path(payload['pptx_path']).name)
    if sha256(deck) != payload['pptx_sha256'] or deck.stat().st_size != payload['pptx_bytes']:
        raise ValueError('Approved PPTX changed')
    proof = _safe_project_path(target, '_human-approval.json')
    if sha256(proof) != version.get('approval_sha256'):
        raise ValueError('Archived PPTX approval evidence changed')
    validate_decision(json.loads(proof.read_text(encoding='utf-8')), payload, digest)
    archived = version.get('review_archive')
    if not isinstance(archived, list) or len(archived) != len(payload['review_evidence']):
        raise ValueError('Archived review evidence is incomplete')
    for expected, item in zip(payload['review_evidence'], archived):
        file, _ = _scoped(ROOT, item.get('path'), target / '_review-evidence')
        if item.get('source') != expected['path'] or item.get('sha256') != expected['sha256'] or sha256(file) != expected['sha256']:
            raise ValueError('Archived review evidence changed')
    return payload, deck


def release(lesson_key, offering_id, digest, release_id, evidence):
    if not re.fullmatch(r'[0-9a-f]{64}', digest or '') or not ID.fullmatch(release_id or ''):
        raise ValueError('Invalid candidate or release ID')
    context = resolve_lesson_context(ROOT, lesson_key, offering_id)
    lock, staging = tx.transaction(ROOT, lesson_key)
    target = _safe_project_path(context.release_root, release_id)
    published = committed = False
    try:
        path, manifest, prior = tx.clean_manifest(ROOT, context)
        if prior is None:
            raise ValueError('Approved authority is missing')
        payload, deck = _approved(context, manifest, digest)
        if payload['offering_id'] != offering_id or payload['lesson_key'] != lesson_key:
            raise ValueError('Approved version belongs to a different lesson or offering')
        proof, proof_hash = human_evidence(context, evidence, payload, digest, release_id)
        if target.exists():
            raise ValueError('Release ID already exists')
        output = staging / 'release'
        package = output / f'{context.lesson_id}-在线预习'
        package.mkdir(parents=True)
        shutil.copyfile(deck, package / deck.name)
        if sha256(package / deck.name) != payload['pptx_sha256']:
            raise ValueError('Release copy differs from approved PPTX')
        archive = output / f'{context.lesson_id}-在线预习.zip'
        with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED) as z:
            z.write(package / deck.name, f'{package.name}/{deck.name}')
        with zipfile.ZipFile(archive) as z:
            if z.testzip() or z.namelist() != [f'{package.name}/{deck.name}'] or hashlib.sha256(z.read(z.namelist()[0])).hexdigest() != payload['pptx_sha256']:
                raise ValueError('Online release ZIP verification failed')
        shutil.copyfile(proof, output / 'release-evidence.json')
        if sha256(output / 'release-evidence.json') != proof_hash:
            raise ValueError('Release evidence changed')
        meta = {'schema_version': 'online-pptx-release-v1', 'status': 'immutable', 'copy_only': True,
                'lesson_key': lesson_key, 'offering_id': offering_id, 'release_id': release_id,
                'candidate_sha256': digest, 'artifact_id': payload['artifact_id'], 'class_scope': payload['class_scope'],
                'pptx_filename': deck.name, 'pptx_sha256': payload['pptx_sha256'],
                'zip_sha256': sha256(archive), 'release_evidence_sha256': proof_hash}
        tx.write_json(output / 'release.json', meta)
        releases = manifest.setdefault('online_pptx_releases', {})
        if release_id in releases:
            raise ValueError('Release ID already declared')
        releases[release_id] = {'candidate_sha256': digest, 'offering_id': offering_id,
            'path': target.relative_to(ROOT).as_posix(), 'zip_sha256': meta['zip_sha256'],
            'release_metadata_sha256': sha256(output / 'release.json'), 'release_evidence_sha256': proof_hash}
        tx.preserve_prior_manifest(staging, prior)
        tx.write_json(staging / 'transaction.json', {'stage': 'staged', 'lesson_key': lesson_key,
            'operation': 'online-release', 'target': str(target), 'manifest': str(path)})
        context.release_root.mkdir(parents=True, exist_ok=True)
        tx.rename_noreplace(output, target)
        published = True
        tx.sync_directory(context.release_root)
        tx.atomic_manifest(path, manifest, staging, prior)
        committed = True
        verify(lesson_key, offering_id, release_id)
        tx.mark_transaction(staging, 'committed')
        return {'status': 'released', 'release_id': release_id, 'path': target.relative_to(ROOT).as_posix(), 'zip_sha256': meta['zip_sha256'], 'write_performed': True}
    except Exception:
        if committed:
            tx.restore_manifest(path, prior, staging)
        if published and target.exists():
            tx.rename_noreplace(target, staging / 'rolled-back-release')
        tx.mark_transaction(staging, 'rolled_back')
        raise
    finally:
        lock.close()


def verify(lesson_key, offering_id, release_id):
    if not ID.fullmatch(release_id or ''):
        raise ValueError('Invalid release ID')
    context = resolve_lesson_context(ROOT, lesson_key, offering_id)
    _, manifest, prior = tx.clean_manifest(ROOT, context)
    if prior is None:
        raise ValueError('Authority manifest missing')
    pointer = manifest.get('online_pptx_releases', {}).get(release_id)
    if not isinstance(pointer, dict) or pointer.get('offering_id') != offering_id:
        raise ValueError('Online release is not registered for this offering')
    payload, _ = _approved(context, manifest, pointer['candidate_sha256'])
    target, _ = resolve_relative_path(ROOT, pointer['path'], required_root=context.release_root)
    if symlinks_under(target):
        raise ValueError('Release contains a symlink')
    metadata = _safe_project_path(target, 'release.json')
    if sha256(metadata) != pointer.get('release_metadata_sha256'):
        raise ValueError('Release metadata changed')
    meta = json.loads(metadata.read_text(encoding='utf-8'))
    if (meta.get('status') != 'immutable' or meta.get('lesson_key') != lesson_key or meta.get('offering_id') != offering_id
            or meta.get('release_id') != release_id or meta.get('candidate_sha256') != pointer['candidate_sha256']
            or meta.get('pptx_sha256') != payload['pptx_sha256']):
        raise ValueError('Release metadata identity mismatch')
    proof = _safe_project_path(target, 'release-evidence.json')
    if sha256(proof) != pointer.get('release_evidence_sha256') or sha256(proof) != meta.get('release_evidence_sha256'):
        raise ValueError('Release evidence changed')
    validate_decision(json.loads(proof.read_text(encoding='utf-8')), payload, pointer['candidate_sha256'], release_id)
    package = _safe_project_path(target, f'{context.lesson_id}-在线预习')
    deck = _safe_project_path(package, meta['pptx_filename'])
    archive = _safe_project_path(target, f'{context.lesson_id}-在线预习.zip')
    if sha256(deck) != payload['pptx_sha256'] or sha256(archive) != pointer.get('zip_sha256'):
        raise ValueError('Release PPTX or ZIP changed')
    actual = {p.relative_to(target).as_posix() for p in material_files(target)}
    expected = {'release.json', 'release-evidence.json', archive.name, f'{package.name}/{deck.name}'}
    if actual != expected:
        raise ValueError('Release contains unexpected or missing files')
    with zipfile.ZipFile(archive) as z:
        if z.testzip() or z.namelist() != [f'{package.name}/{deck.name}'] or hashlib.sha256(z.read(z.namelist()[0])).hexdigest() != payload['pptx_sha256']:
            raise ValueError('Release ZIP failed content verification')
    return {'status': 'verified', 'release_id': release_id, 'path': pointer['path'], 'write_performed': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='operation', required=True)
    for command in ('plan', 'promote'):
        p = sub.add_parser(command)
        for field in ('lesson-key', 'offering-id', 'artifact-id', 'class-scope', 'approval-record', 'pptx', 'qa-report'):
            p.add_argument('--' + field, required=True)
        if command == 'promote':
            p.add_argument('--candidate-sha256', required=True)
            p.add_argument('--evidence', required=True)
    r = sub.add_parser('release')
    for field in ('lesson-key', 'offering-id', 'candidate-sha256', 'release-id', 'evidence'):
        r.add_argument('--' + field, required=True)
    v = sub.add_parser('verify')
    for field in ('lesson-key', 'offering-id', 'release-id'):
        v.add_argument('--' + field, required=True)
    args = parser.parse_args()
    try:
        if args.operation in ('plan', 'promote'):
            values = (args.lesson_key, args.offering_id, args.artifact_id, args.class_scope, args.approval_record, args.pptx, args.qa_report)
            result = plan(*values) if args.operation == 'plan' else promote(*values, args.candidate_sha256, args.evidence)
        elif args.operation == 'release':
            result = release(args.lesson_key, args.offering_id, args.candidate_sha256, args.release_id, args.evidence)
        else:
            result = verify(args.lesson_key, args.offering_id, args.release_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get('status') != 'blocked' else 1
    except (ValueError, TypeError, KeyError, AttributeError, OSError, RuntimeError, ET.ParseError, zipfile.BadZipFile) as exc:
        print(json.dumps({'status': 'blocked', 'error': str(exc)}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.exit(main())
