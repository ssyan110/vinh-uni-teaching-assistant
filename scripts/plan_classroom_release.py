#!/usr/bin/env python3
"""Read-only, hash-bound review plan for one registered OpenSlide classroom deck.

A plan is not a human approval, authority promotion or release. It inventories
all packaged inputs and invokes the existing live visual/identity verifier.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

import sync_open_slide_workspace as sync
from lesson_context import LessonContextError, resolve_lesson_context
from workflow_integrity import audit_authority_manifest, portable_release_path_key, resolve_relative_path, sha256

ROOT = Path(__file__).resolve().parents[1]


class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.in_style = False
        self.css = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'base':
            raise ValueError('HTML base element is unsupported in a self-contained package')
        if tag in {'img', 'script', 'audio', 'video', 'source', 'track', 'iframe', 'embed'} and attrs.get('src'):
            self.refs.append(attrs['src'])
        if tag == 'link' and attrs.get('href'):
            self.refs.append(attrs['href'])
        if attrs.get('style'):
            self.css.append(attrs['style'])
        if tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            self.css.append(data)


def checked_record(directory: Path, record: dict) -> tuple[str, Path, str]:
    value, expected = record.get('path'), record.get('sha256')
    if not isinstance(value, str) or not value or not re.fullmatch(r'[0-9a-f]{64}', str(expected)):
        raise ValueError('Every package input must declare a relative path and SHA-256')
    raw = Path(value)
    if raw.is_absolute() or raw.as_posix() != value or any(part in ('.', '..') for part in raw.parts):
        raise ValueError(f'Unsafe package input: {value}')
    project_relative = (directory / raw).relative_to(ROOT).as_posix()
    path, _ = resolve_relative_path(ROOT, project_relative, required_root=directory)
    if not path.is_file() or sha256(path) != expected:
        raise ValueError(f'Package input missing or hash changed: {value}')
    return value, path, expected


def local_resource_refs(html: str) -> set[str]:
    parser = ResourceParser()
    parser.feed(html)
    parser.close()
    css = '\n'.join(parser.css)
    if re.search(r'@import\b', css, re.I):
        raise ValueError('CSS imports are not supported in a self-contained package')
    parser.refs.extend(re.findall(r'url\(\s*["\']?([^"\')]+)', css, re.I))
    refs = set()
    for ref in parser.refs:
        ref = ref.strip()
        if ref.startswith('data:') or ref.startswith('#'):
            continue
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or ref.startswith('/'):
            raise ValueError(f'External or non-canonical resource is not allowed: {ref}')
        raw = Path(ref)
        if raw.as_posix() != ref or any(part in ('.', '..') for part in raw.parts) or '%' in ref:
            raise ValueError(f'Non-canonical resource is not allowed: {ref}')
        refs.add(ref)
    return refs


def review_plan(deck_id: str) -> dict:
    blockers = []
    plan = {'command': 'review-plan', 'deck_id': deck_id, 'status': 'blocked',
            'write_performed': False, 'approval_granted': False, 'release_supported': False,
            'files': [], 'blockers': blockers}
    try:
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text(encoding='utf-8'))
        matches = [d for d in registry.get('html_decks', []) if d.get('id') == deck_id]
        if len(matches) != 1:
            raise ValueError('Deck ID must match exactly one registered HTML deck')
        deck = matches[0]
        owner, offering = deck.get('lesson_key'), deck.get('offering_id')
        if not isinstance(offering, str) or not offering:
            raise ValueError('Registered deck must specify offering_id')
        context = resolve_lesson_context(ROOT, owner, offering)
        source, _ = resolve_relative_path(ROOT, deck.get('source'), required_root=context.design_root / 'open-slide-draft')
        profile = deck.get('visual_check')
        if not isinstance(profile, dict):
            raise ValueError('Current visual check profile required; legacy exemptions cannot be promoted')
        manifest_path, _ = resolve_relative_path(ROOT, profile.get('draft_manifest'), required_root=source.parent)
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        if manifest.get('deck_id') != deck_id:
            raise ValueError('Draft manifest deck ID differs from registry')
        if manifest.get('entry_file') != source.name:
            raise ValueError('Draft entry must name the registered deck')
        records = [{'path': manifest['entry_file'], 'sha256': manifest.get('entry_sha256')}]
        assets = manifest.get('assets')
        if not isinstance(assets, list):
            raise ValueError('Draft manifest must list all assets')
        records += assets
        for key in ('teacher_guide', 'teacher_quick_guide', 'oral_observation'):
            item = manifest.get(key)
            if item is not None:
                if not isinstance(item, dict):
                    raise ValueError(f'Invalid teacher material: {key}')
                records.append(item)
        if not manifest.get('teacher_guide'):
            raise ValueError('Teacher reading material must be declared')
        files = {}
        portable_paths = set()
        for record in records:
            if not isinstance(record, dict):
                raise ValueError('Invalid package file record')
            relative, path, digest = checked_record(source.parent, record)
            if relative in files:
                raise ValueError(f'Duplicate package path: {relative}')
            portable, error = portable_release_path_key(relative)
            if error or portable in portable_paths:
                raise ValueError(f'Non-portable or colliding package path: {relative}')
            portable_paths.add(portable)
            files[relative] = {'path': relative, 'sha256': digest, 'bytes': path.stat().st_size}
        undeclared = local_resource_refs(source.read_text(encoding='utf-8')) - set(files)
        if undeclared:
            raise ValueError(f'HTML references undeclared assets: {sorted(undeclared)}')
        result = sync.check_visual_profile(deck, source)
        node = shutil.which('node')
        if not node:
            raise ValueError('Node is required for offline browser verification')
        offline_checker = ROOT / 'scripts/check_classroom_offline.cjs'
        offline = subprocess.run([node, str(offline_checker), str(source)], cwd=ROOT,
                                 capture_output=True, text=True, timeout=90)
        if offline.returncode:
            raise ValueError('Offline classroom verification failed: ' + (offline.stderr or offline.stdout).strip())
        offline_result = json.loads(offline.stdout)
        if offline_result.get('status') != 'passed' or offline_result.get('pages') != manifest.get('slide_count'):
            raise ValueError('Offline browser page count or status does not match the draft')
        evidence = []
        evidence.append({'path': offline_checker.relative_to(ROOT).as_posix(), 'sha256': sha256(offline_checker)})
        formal_blockers = []
        for value in (profile.get('content_contract'), profile.get('rendered_layout_report')):
            path, relative = resolve_relative_path(ROOT, value, required_root=source.parent)
            if not path.is_file():
                raise ValueError(f'Review evidence missing: {relative}')
            evidence.append({'path': relative, 'sha256': sha256(path)})
            if value == profile.get('rendered_layout_report'):
                report = json.loads(path.read_text(encoding='utf-8'))
                for page in report.get('pages', []):
                    screenshot = page.get('screenshot', {})
                    image_path, image_relative = resolve_relative_path(ROOT, (path.parent / screenshot.get('file', '')).relative_to(ROOT).as_posix(), required_root=path.parent)
                    if not image_path.is_file() or sha256(image_path) != screenshot.get('sha256'):
                        raise ValueError('Rendered screenshot is missing or changed')
                    evidence.append({'path': image_relative, 'sha256': sha256(image_path)})
        approval_records = deck.get('approval_records')
        source_reports = deck.get('source_check_reports', {})
        for key in manifest['lesson_keys']:
            lesson = resolve_lesson_context(ROOT, key, offering)
            value = (approval_records[key] if approval_records is not None else
                     (lesson.design_root / 'storyboard' / f'{lesson.lesson_id}-content-approval.json').relative_to(ROOT).as_posix())
            path, relative = resolve_relative_path(ROOT, value, required_root=lesson.design_root)
            if not path.is_file():
                raise ValueError(f'Content approval missing: {relative}')
            evidence.append({'path': relative, 'sha256': sha256(path)})
            content_record = json.loads(path.read_text(encoding='utf-8'))
            approval_file, approval_relative = resolve_relative_path(ROOT, content_record.get('evidence'), required_root=lesson.design_root)
            if not approval_file.is_file() or sha256(approval_file) != content_record.get('evidence_sha256'):
                raise ValueError(f'{key}: content approval evidence is missing or changed')
            evidence.append({'path': approval_relative, 'sha256': sha256(approval_file)})
            # Freeze the exact reviewed source, used-source check and copy; historical
            # approvals retain their original scope and are never rewritten.
            for item in content_record.get('artifacts', []):
                bound, bound_relative = resolve_relative_path(ROOT, item.get('path'), required_root=lesson.lesson_root)
                if not bound.is_file() or sha256(bound) != item.get('sha256'):
                    raise ValueError(f'{key}: approved input is missing or changed')
                evidence.append({'path': bound_relative, 'sha256': sha256(bound)})
            if approval_records is None:
                report = source_reports.get(key) if isinstance(source_reports, dict) else None
                try:
                    check, check_relative = resolve_relative_path(ROOT, report.get('path'), required_root=lesson.design_root)
                    if not check.is_file() or not check.read_text(encoding='utf-8').strip() or sha256(check) != report.get('sha256'):
                        raise ValueError('source check is missing or changed')
                    evidence.append({'path': check_relative, 'sha256': sha256(check)})
                except (AttributeError, ValueError, OSError) as error:
                    formal_blockers.append(f'{key}: check the sources actually used before formal approval: {error}')
        plan.update({'owner_lesson_key': owner, 'lesson_keys': manifest.get('lesson_keys'),
                     'offering_id': offering, 'source': deck['source'],
                     'draft_manifest': profile['draft_manifest'],
                     'draft_manifest_sha256': sha256(manifest_path),
                     'visual_check': result, 'files': [files[k] for k in sorted(files)],
                     'review_evidence': evidence, 'formal_blockers': formal_blockers})
        if approval_records is not None:
            plan['class_scope'] = deck['class_scope']
        authority_path = context.authority_root / 'lesson-manifest.json'
        if authority_path.exists():
            safe, _ = resolve_relative_path(ROOT, authority_path.relative_to(ROOT).as_posix(), required_root=context.authority_root)
            authority = json.loads(safe.read_text(encoding='utf-8'))
            failures = audit_authority_manifest(ROOT, context.authority_root, authority)['failures']
            if failures:
                blockers.extend(f'Existing authority: {failure}' for failure in failures)
            plan['existing_authority_sha256'] = sha256(safe)
        elif context.authority_root.exists() and any(p.is_file() or p.is_symlink() for p in context.authority_root.rglob('*')):
            blockers.append('Existing authority contains files but has no manifest')
        payload = {k: plan[k] for k in ('deck_id', 'owner_lesson_key', 'lesson_keys', 'offering_id', 'source', 'draft_manifest_sha256', 'files', 'review_evidence')}
        if 'class_scope' in plan:
            payload['class_scope'] = plan['class_scope']
        plan['candidate_sha256'] = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        plan['status'] = 'blocked' if blockers else 'ready_for_human_review'
        plan['release_supported'] = not blockers
        plan['formal_readiness'] = 'blocked' if formal_blockers else 'requires-independent-human-approval'
    except (ValueError, TypeError, KeyError, AttributeError, OSError, json.JSONDecodeError, LessonContextError, subprocess.TimeoutExpired) as error:
        blockers.append(str(error))
    return plan


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deck-id', required=True)
    result = review_plan(parser.parse_args().deck_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'ready_for_human_review' else 1


if __name__ == '__main__':
    sys.exit(main())
