"""Isolated synthetic lifecycle tests; no real lesson is approved or released."""
import hashlib
import base64
import json
import subprocess
import sys
from types import SimpleNamespace
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import classroom_release as lifecycle
import repair_legacy_authority_inventory as repair
import build_dashboard
from workflow_integrity import sha256, audit_authority_manifest
REAL_REVIEW_PLAN = lifecycle.candidate.review_plan


class ClassroomLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.root = ROOT / '.agent/runs/openslide-release-implementation-20261027/staging' / ('fixture-' + uuid.uuid4().hex)
        self.root.mkdir(parents=True)
        (self.root / '.agent/runs').mkdir(parents=True)
        (self.root / 'course').mkdir()
        (self.root / 'project.config.json').write_text(json.dumps({'lesson_registry': 'course/lesson-registry.json'}))
        self.key = 'synthetic-book:lesson-01'
        self.lesson = self.root / 'lessons/synthetic-book/lesson-01'
        self.draft = self.lesson / '10-design/open-slide-draft/week'
        self.draft.mkdir(parents=True)
        (self.root / 'course/lesson-registry.json').write_text(json.dumps({'lessons': [{'lesson_key': self.key, 'textbook_id': 'synthetic-book', 'lesson_id': 'lesson-01', 'lesson_path': 'lessons/synthetic-book/lesson-01', 'offering_ids': ['test-offering']}]}))
        self.html = self.draft / 'lesson-01.html'
        self.html.write_text('<html><body><section class="os-page"><img src="assets/a.png"></section><script>window.__classroomDeck={go:i=>{},index:()=>0};</script></body></html>')
        (self.draft / 'assets').mkdir()
        (self.draft / 'assets/a.png').write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='))
        (self.draft / 'teacher.md').write_text('teacher')
        files = [{'path': p.relative_to(self.draft).as_posix(), 'sha256': sha256(p), 'bytes': p.stat().st_size} for p in (self.html, self.draft / 'assets/a.png', self.draft / 'teacher.md')]
        review = self.draft / 'review-evidence.txt'
        review.write_text('synthetic review')
        payload = {'deck_id': 'synthetic-deck', 'owner_lesson_key': self.key, 'lesson_keys': [self.key], 'offering_id': 'test-offering', 'source': self.html.relative_to(self.root).as_posix(), 'draft_manifest_sha256': 'a' * 64, 'files': files, 'review_evidence': [{'path': review.relative_to(self.root).as_posix(), 'sha256': sha256(review)}]}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
        self.plan = {**payload, 'candidate_sha256': digest, 'status': 'ready_for_human_review', 'blockers': []}
        self.proof = self.lesson / '10-design/approval.json'
        self.proof.write_text(json.dumps({'gate': 'classroom-deck-approval', 'candidate_sha256': digest, 'deck_id': 'synthetic-deck', 'offering_id': 'test-offering', 'lesson_keys': [self.key], 'approved_by': 'synthetic user', 'approved_at': '2026-10-27T12:00:00+07:00', 'user_decision': 'synthetic exact approval'}))
        self.proof_rel = self.proof.relative_to(self.root).as_posix()
        self.teacher_proof = self.lesson / '10-design/teacher-approval.json'
        teacher_record = json.loads(self.proof.read_text())
        teacher_record['gate'] = 'classroom-teacher-materials-approval'
        teacher_record['user_decision'] = 'synthetic teacher materials approval'
        self.teacher_proof.write_text(json.dumps(teacher_record))
        self.teacher_proof_rel = self.teacher_proof.relative_to(self.root).as_posix()
        def current(_):
            result = dict(self.plan)
            manifest = self.lesson / '20-approved/lesson-manifest.json'
            if manifest.exists():
                result['existing_authority_sha256'] = sha256(manifest)
            return result
        self.patches = [patch.object(lifecycle, 'ROOT', self.root), patch.object(lifecycle.candidate, 'review_plan', side_effect=current)]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)

    def promote(self):
        return lifecycle.promote('synthetic-deck', self.plan['candidate_sha256'], self.proof_rel, self.teacher_proof_rel)

    def release_proof(self, release_id='r1'):
        path = self.lesson / '10-design/release-approval.json'
        waiver = self.lesson / '10-design/human-waiver.txt'
        waiver.write_text('Synthetic user explicitly waived both checks')
        check = {'status': 'explicitly-waived', 'evidence': waiver.relative_to(self.root).as_posix(), 'sha256': sha256(waiver)}
        path.write_text(json.dumps({'gate': 'classroom-release', 'candidate_sha256': self.plan['candidate_sha256'], 'deck_id': 'synthetic-deck', 'offering_id': 'test-offering', 'lesson_keys': [self.key], 'approved_by': 'synthetic user', 'approved_at': '2026-10-27T12:00:00+07:00', 'user_decision': 'synthetic release decision', 'release_id': release_id, 'human_checks': {'teacher_rehearsal': check, 'audio_playback': check}}))
        return path.relative_to(self.root).as_posix()

    def test_full_approval_release_and_tamper_detection(self):
        promoted = self.promote()
        self.assertEqual((self.root / promoted['authority_path'] / '_review-evidence/000.txt').read_text(), 'synthetic review')
        manifest = json.loads((self.lesson / '20-approved/lesson-manifest.json').read_text())
        self.assertEqual(audit_authority_manifest(self.root, self.lesson / '20-approved', manifest)['failures'], [])
        released = lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.release_proof())
        self.assertEqual(released['status'], 'released')
        self.assertEqual(lifecycle.verify_release(self.key, 'test-offering', 'r1')['status'], 'verified')
        with patch.object(build_dashboard, 'PROJECT_ROOT', self.root), patch.object(build_dashboard, 'verify_classroom_release', side_effect=lifecycle.verify_release):
            updated_manifest = json.loads((self.lesson / '20-approved/lesson-manifest.json').read_text())
            groups = build_dashboard.build_file_groups(self.lesson, updated_manifest)
            classroom_group = next(group for group in groups if group['id'] == 'classroom-html-release')
            self.assertTrue(any(item['path'].endswith('lesson-01-教材包.zip') for item in classroom_group['files']))
        package = self.root / released['path'] / 'lesson-01-教材包'
        offline = subprocess.run(['node', str(ROOT / 'scripts/check_classroom_offline.cjs'), str(package / 'lesson-01.html')], cwd=ROOT, capture_output=True, text=True, timeout=30)
        self.assertEqual(offline.returncode, 0, offline.stderr)
        self.assertEqual(json.loads(offline.stdout)['pages'], 1)
        with self.assertRaisesRegex(ValueError, 'already exists'):
            lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.release_proof())
        (package / 'assets/a.png').write_bytes(b'tampered')
        with self.assertRaisesRegex(ValueError, 'changed'):
            lifecycle.verify_release(self.key, 'test-offering', 'r1')
        with patch.object(build_dashboard, 'PROJECT_ROOT', self.root), patch.object(build_dashboard, 'verify_classroom_release', side_effect=lifecycle.verify_release):
            groups = build_dashboard.build_file_groups(self.lesson, updated_manifest)
            classroom_group = next(group for group in groups if group['id'] == 'classroom-html-release')
            self.assertTrue(any('需复核' in item['label'] for item in classroom_group['files']))
            self.assertFalse(any(item['path'].endswith('.zip') for item in classroom_group['files']))

    def test_no_approval_and_changed_candidate_are_blocked(self):
        with self.assertRaises(ValueError):
            lifecycle.promote('synthetic-deck', '0' * 64, self.proof_rel, self.teacher_proof_rel)
        self.proof.write_text('{}')
        with self.assertRaises(ValueError):
            self.promote()
        self.assertFalse((self.lesson / '20-approved').exists())

    def test_pending_source_or_teaching_approval_blocks_formal_promotion(self):
        self.plan['formal_blockers'] = ['source verification pending']
        with self.assertRaisesRegex(ValueError, 'source verification pending'):
            self.promote()
        self.assertFalse((self.lesson / '20-approved').exists())

    def test_teacher_approval_is_independent(self):
        with self.assertRaisesRegex(ValueError, 'exact candidate'):
            lifecycle.promote('synthetic-deck', self.plan['candidate_sha256'], self.proof_rel, self.proof_rel)
        self.assertFalse((self.lesson / '20-approved').exists())

    def test_stale_source_blocks_before_authority(self):
        self.html.write_text('changed')
        with self.assertRaisesRegex(ValueError, 'changed'):
            self.promote()
        self.assertFalse((self.lesson / '20-approved/lesson-manifest.json').exists())

    def test_failure_after_publish_rolls_back_and_preserves_evidence(self):
        with patch.object(lifecycle, 'atomic_manifest', side_effect=OSError('synthetic failure')):
            with self.assertRaisesRegex(OSError, 'synthetic failure'):
                self.promote()
        self.assertFalse((self.lesson / '20-approved/lesson-manifest.json').exists())
        self.assertFalse(any((self.lesson / '20-approved/html').iterdir()))
        self.assertTrue(any((self.root / '.agent/runs').glob('classroom-release-transaction-*/rolled-back-payload')))
        self.assertEqual(self.promote()['status'], 'approved')

    def test_release_without_requested_human_checks_records_not_requested(self):
        promoted = self.promote()
        proof = self.release_proof()
        path = self.root / proof
        record = json.loads(path.read_text())
        record.pop('human_checks')
        path.write_text(json.dumps(record))
        released = lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', proof)
        metadata = json.loads((self.root / released['path'] / 'release.json').read_text())
        self.assertEqual(metadata['human_checks']['teacher_rehearsal']['status'], 'not_requested')
        self.assertEqual(metadata['human_checks']['audio_playback']['status'], 'not_requested')
        self.assertEqual(lifecycle.verify_release(self.key, 'test-offering', 'r1')['status'], 'verified')

    def test_one_explicit_decision_can_cover_package_and_release(self):
        record = json.loads(self.proof.read_text())
        record.update(gate='classroom-package-approval', approved_components=['deck', 'teacher_materials'],
                      authorized_actions=['release'], release_id='r1')
        self.proof.write_text(json.dumps(record))
        promoted = lifecycle.promote('synthetic-deck', self.plan['candidate_sha256'], self.proof_rel)
        result = lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.proof_rel)
        self.assertEqual(lifecycle.verify_release(self.key, 'test-offering', 'r1')['status'], 'verified')
        self.assertEqual(result['status'], 'released')

    def test_release_requires_exact_id_and_rejects_changed_review_archive(self):
        promoted = self.promote()
        with self.assertRaisesRegex(ValueError, 'exact release ID'):
            lifecycle.release(self.key, 'test-offering', promoted['version'], 'other', self.release_proof('r1'))
        archived = self.root / promoted['authority_path'] / '_review-evidence/000.txt'
        archived.write_text('tampered review')
        with self.assertRaisesRegex(ValueError, 'Authority inventory is invalid'):
            lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.release_proof('r1'))
        self.assertFalse((self.lesson / '40-release/r1').exists())

    def test_approved_metadata_tampering_blocks_release(self):
        promoted = self.promote()
        manifest_path = self.lesson / '20-approved/lesson-manifest.json'
        manifest = json.loads(manifest_path.read_text())
        manifest['authority']['classroom_html'][promoted['version']]['candidate_payload']['source'] = 'altered.html'
        manifest_path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, 'candidate payload has changed'):
            lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.release_proof())
        self.assertFalse((self.lesson / '40-release/r1').exists())

    def test_release_commit_failure_restores_authority(self):
        promoted = self.promote()
        manifest = self.lesson / '20-approved/lesson-manifest.json'
        before = manifest.read_bytes()
        with patch.object(lifecycle, 'verify_release', side_effect=ValueError('synthetic readback failure')):
            with self.assertRaisesRegex(ValueError, 'readback'):
                lifecycle.release(self.key, 'test-offering', promoted['version'], 'r1', self.release_proof())
        self.assertEqual(manifest.read_bytes(), before)
        self.assertFalse((self.lesson / '40-release/r1').exists())
        self.assertTrue(any((self.root / '.agent/runs').glob('classroom-release-transaction-*/rolled-back-release')))

    def test_manifest_fsync_failure_after_replace_restores_prior_state(self):
        real_sync = lifecycle.sync_directory
        failed = False
        def fail_once(directory):
            nonlocal failed
            if Path(directory) == self.lesson / '20-approved' and (self.lesson / '20-approved/lesson-manifest.json').exists() and not failed:
                failed = True
                raise OSError('synthetic fsync failure')
            return real_sync(directory)
        with patch.object(lifecycle, 'sync_directory', side_effect=fail_once):
            with self.assertRaisesRegex(OSError, 'fsync failure'):
                self.promote()
        self.assertFalse((self.lesson / '20-approved/lesson-manifest.json').exists())
        self.assertFalse(any((self.lesson / '20-approved/html').iterdir()))

    def test_unfinished_transaction_blocks_new_work_without_deleting_it(self):
        pending = self.root / '.agent/runs/classroom-release-transaction-synthetic'
        pending.mkdir()
        (pending / 'transaction.json').write_text(json.dumps({'stage': 'staged', 'lesson_key': self.key, 'operation': 'promote', 'target': 'synthetic', 'manifest': 'synthetic'}))
        self.assertEqual(lifecycle.inspect_transactions(self.key, 'test-offering')['status'], 'review')
        with self.assertRaisesRegex(RuntimeError, 'Unfinished transaction'):
            self.promote()
        self.assertTrue((pending / 'transaction.json').is_file())

    def test_legacy_repair_preserves_historical_fields_and_files(self):
        authority = self.lesson / '20-approved'
        authority.mkdir()
        (authority / 'pptx').mkdir()
        online, physical = authority / 'pptx/online.pptx', authority / 'pptx/physical.pptx'
        online.write_bytes(b'old online')
        physical.write_bytes(b'old physical')
        ppt = {'online_path': online.relative_to(self.root).as_posix(), 'online_sha256': sha256(online), 'online_bytes': online.stat().st_size,
               'face_to_face_path': physical.relative_to(self.root).as_posix(), 'face_to_face_sha256': sha256(physical), 'face_to_face_bytes': physical.stat().st_size}
        old = {'lesson_key': self.key, 'textbook_id': 'synthetic-book', 'lesson_id': 'lesson-01', 'authority_status': 'old approved', 'authority': {'pptx': ppt}, 'release': {'status': 'pending'}}
        path = authority / 'lesson-manifest.json'
        path.write_text(json.dumps(old))
        old_bytes = path.read_bytes()
        backup = '.agent/runs/old-authority.json'
        result = repair.execute(self.root, self.key, 'test-offering', backup)
        self.assertEqual(result['status'], 'repaired')
        self.assertEqual((self.root / backup).read_bytes(), old_bytes)
        updated = json.loads(path.read_text())
        updated.pop('files')
        updated['authority'].pop('activities')
        self.assertEqual(updated, old)
        self.assertEqual(online.read_bytes(), b'old online')
        self.assertEqual(physical.read_bytes(), b'old physical')

    def test_offline_checker_blocks_network_requests(self):
        self.html.write_text('<html><body><section class="os-page"></section><script>fetch("https://example.com/a").catch(()=>{});window.__classroomDeck={go:i=>{},index:()=>0};</script></body></html>')
        result = subprocess.run(['node', str(ROOT / 'scripts/check_classroom_offline.cjs'), str(self.html)], cwd=ROOT, capture_output=True, text=True, timeout=30)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Network request', result.stderr)

    def test_real_plan_checks_used_sources_without_old_design_gate(self):
        (self.root / 'scripts').mkdir()
        (self.root / 'scripts/check_classroom_offline.cjs').write_text('synthetic checker')
        source_root = self.lesson / '00-source'
        source_root.mkdir()
        canonical = source_root / 'canonical-source.json'
        canonical.write_text('{}')
        human = self.lesson / '10-design/source-human.txt'
        human.write_text('Synthetic source and teaching design approvals')
        human_rel = human.relative_to(self.root).as_posix()
        source = {'lesson_key': self.key, 'source_status': 'verified', 'source_qa_status': 'passed',
                  'approved': True, 'approved_by': ['synthetic user'], 'approved_at': '2026-10-27',
                  'canonical_source_sha256': sha256(canonical), 'approval_evidence': human_rel, 'approval_evidence_sha256': sha256(human)}
        (source_root / 'source-manifest.json').write_text(json.dumps(source))
        teaching_dir = self.lesson / '10-design/teaching-design'
        teaching_dir.mkdir()
        teaching = {'lesson_key': self.key, 'status': 'approved_by_adam_synthetic', 'approval_evidence': human_rel, 'approval_evidence_sha256': sha256(human)}
        (teaching_dir / 'manifest.json').write_text(json.dumps(teaching))
        storyboard = self.lesson / '10-design/storyboard'
        storyboard.mkdir()
        (storyboard / 'lesson-01-content-approval.json').write_text(json.dumps({'evidence': human_rel, 'evidence_sha256': sha256(human), 'artifacts': [{'path': canonical.relative_to(self.root).as_posix(), 'sha256': sha256(canonical)}]}))
        (self.draft / 'contract.json').write_text('{}')
        (self.draft / 'report.json').write_text('{}')
        def record(path):
            return {'path': path.relative_to(self.draft).as_posix(), 'sha256': sha256(path)}
        manifest = {'deck_id': 'synthetic-deck', 'entry_file': self.html.name, 'entry_sha256': sha256(self.html),
                    'offering_id': 'test-offering', 'lesson_keys': [self.key], 'slide_count': 1,
                    'assets': [record(self.draft / 'assets/a.png')], 'teacher_guide': record(self.draft / 'teacher.md')}
        manifest_path = self.draft / 'draft.json'
        manifest_path.write_text(json.dumps(manifest))
        profile = {'draft_manifest': manifest_path.relative_to(self.root).as_posix(),
                   'content_contract': (self.draft / 'contract.json').relative_to(self.root).as_posix(),
                   'rendered_layout_report': (self.draft / 'report.json').relative_to(self.root).as_posix()}
        source_report = self.lesson / '10-design/source-check.txt'
        source_report.write_text('Synthetic actual source portions checked')
        deck = {'id': 'synthetic-deck', 'lesson_key': self.key, 'offering_id': 'test-offering', 'source': self.html.relative_to(self.root).as_posix(), 'visual_check': profile, 'source_check_reports': {self.key: {'path': source_report.relative_to(self.root).as_posix(), 'sha256': sha256(source_report)}}}
        (self.root / 'course/open-slide-workspace.json').write_text(json.dumps({'html_decks': [deck]}))
        fake_browser = SimpleNamespace(returncode=0, stdout='{"status":"passed","pages":1}', stderr='')
        with patch.object(lifecycle.candidate, 'ROOT', self.root), patch.object(lifecycle.candidate.sync, 'check_visual_profile', return_value='passed'), patch.object(lifecycle.candidate.subprocess, 'run', return_value=fake_browser):
            ready = REAL_REVIEW_PLAN('synthetic-deck')
            self.assertEqual(ready.get('formal_readiness'), 'requires-independent-human-approval', ready)
            source_report.write_text('Changed after check')
            blocked = REAL_REVIEW_PLAN('synthetic-deck')
            self.assertEqual(blocked['formal_readiness'], 'blocked')
            self.assertTrue(any('sources actually used' in value for value in blocked['formal_blockers']))


if __name__ == '__main__':
    unittest.main()
