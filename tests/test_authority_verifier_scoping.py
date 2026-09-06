"""Read-only verifier integration tests; all approval/release fixtures are synthetic."""
import io
import json
import sys
import unittest
import zipfile
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import verify_lesson_authority as verifier
import test_gate_context_scoping as fixtures
from workflow_integrity import expected_release_entries, sha256, tree_hash


class AuthorityVerifierScopingTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.GateContextScopingTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root = self.fixture.root
        active = self.fixture.lessons['01']
        patcher = mock.patch.multiple(verifier, PROJECT_ROOT=self.root, CONFIG=self.fixture.config,
            AUTHORITY_ROOT=active / '20-approved', RELEASE_ROOT=active / '40-release',
            MANIFEST_PATH=active / '20-approved/lesson-manifest.json',
            LATEST_PATH=active / '40-release/latest-release.json')
        patcher.start()
        self.addCleanup(patcher.stop)
        for number in ('01', '02', '10', '12'):
            self.make_release(number)

    def make_release(self, number):
        f = self.fixture
        lesson = f.lessons[number]
        manifest_path = lesson / '20-approved/lesson-manifest.json'
        manifest = json.loads(manifest_path.read_text())
        manifest.update(lesson_id=f'lesson-{number}', textbook_id='boya-quasi-intermediate-i')
        activity = lesson / '20-approved/activities/card.docx'
        f.write(activity, 'synthetic activity')
        manifest['authority']['activities'] = {'path': f.rel(activity.parent), 'file_count': 1}
        manifest['files'].append({'path': f.rel(activity), 'sha256': sha256(activity), 'bytes': activity.stat().st_size})
        entries, failures = expected_release_entries(manifest)
        self.assertEqual(failures, [])
        release_dir = lesson / '40-release/test-release'
        package_name = f'lesson-{number}-教材包'
        package_dir = release_dir / package_name
        for item in entries:
            target = package_dir / item['release_path']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((self.root / item['source_path']).read_bytes())
        zip_path = lesson / '40-release/test-release.zip'
        with zipfile.ZipFile(zip_path, 'w') as archive:
            for path in sorted(package_dir.rglob('*')):
                if path.is_file():
                    archive.write(path, path.relative_to(release_dir).as_posix())
        manifest['release'] = {'status': 'immutable', 'latest_release_path': f.rel(release_dir),
            'latest_zip_path': f.rel(zip_path), 'tree_sha256': tree_hash(package_dir), 'zip_sha256': sha256(zip_path)}
        f.write(manifest_path, manifest)
        f.write(lesson / '40-release/latest-release.json', {
            'release_id': 'test-release', 'release_root': f.rel(release_dir), 'zip_path': f.rel(zip_path),
            'status': 'immutable', 'delivery_status': 'ready', 'copy_only': True,
            'tree_sha256': tree_hash(package_dir), 'zip_sha256': sha256(zip_path),
            'file_count': len(entries), 'activity_docx_count': 1,
            'files': [{'path': f'{package_name}/{item["release_path"]}', 'sha256': item['sha256'], 'bytes': item['bytes']} for item in entries]})

    def test_explicit_lessons_pass_without_writes_or_global_mutation(self):
        before = tree_hash(self.root)
        globals_before = (verifier.AUTHORITY_ROOT, verifier.RELEASE_ROOT, verifier.MANIFEST_PATH)
        for number in ('02', '10', '12'):
            with self.subTest(number=number):
                result = verifier.verify(self.fixture.key(number))
                self.assertEqual(result['status'], 'passed', result['failures'])
                self.assertEqual(result['delivery_status'], 'ready')
                self.assertEqual(result['checked_authority_files'], 2)
                self.assertEqual(result['release_file_count'], 2)
                self.assertIn(f'lesson-{number}/20-approved', result['manifest'])
        self.assertEqual(before, tree_hash(self.root))
        self.assertEqual(globals_before, (verifier.AUTHORITY_ROOT, verifier.RELEASE_ROOT, verifier.MANIFEST_PATH))

    def test_missing_selected_manifest_never_falls_back(self):
        (self.fixture.lessons['10'] / '20-approved/lesson-manifest.json').unlink()
        result = verifier.verify(self.fixture.key('10'))
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['checked_authority_files'], 0)
        self.assertIn('lesson-10', result['failures'][0])

    def test_wrong_identity_rejected_before_authority_audit(self):
        self.fixture.change('02', '20-approved/lesson-manifest.json', lambda x: x.update(lesson_key=self.fixture.key('01')))
        with mock.patch.object(verifier, 'audit_authority_manifest') as audit:
            result = verifier.verify(self.fixture.key('02'))
        audit.assert_not_called()
        self.assertEqual(result['status'], 'failed')

    def test_l01_corruption_does_not_poison_other_lessons(self):
        (self.fixture.lessons['01'] / '20-approved/manual.docx').write_text('corrupt')
        for number in ('02', '10', '12'):
            result = verifier.verify(self.fixture.key(number))
            self.assertEqual(result['status'], 'passed', result['failures'])

    def test_cross_lesson_release_and_symlink_rejected(self):
        foreign = self.fixture.rel(self.fixture.lessons['01'] / '40-release/test-release')
        self.fixture.change('10', '20-approved/lesson-manifest.json', lambda x: x['release'].update(latest_release_path=foreign))
        result = verifier.verify(self.fixture.key('10'))
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(any('invalid latest release path' in x for x in result['failures']))
        package = self.fixture.lessons['12'] / '40-release/test-release/lesson-12-教材包'
        package.rename(package.with_name('saved'))
        package.symlink_to(package.with_name('saved'), target_is_directory=True)
        result = verifier.verify(self.fixture.key('12'))
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(any('invalid release package directory' in x for x in result['failures']))

    def test_pending_release_is_not_delivery_ready(self):
        self.fixture.change('02', '20-approved/lesson-manifest.json', lambda x: x['release'].update(status='pending_manual_acceptance'))
        result = verifier.verify(self.fixture.key('02'))
        self.assertEqual(result['status'], 'passed', result['failures'])
        self.assertEqual(result['delivery_status'], 'blocked')
        self.assertIn('current release is pending manual acceptance', result['delivery_blockers'])

    def test_legacy_no_key_and_invalid_keys(self):
        # The shared fixture registry is intentionally minimal for resolver tests;
        # the full legacy registry validator is tested separately.
        with mock.patch.object(fixtures.gate, 'audit_lesson_identity') as identity:
            result = verifier.verify()
        identity.assert_called_once()
        self.assertEqual(result['status'], 'passed', result['failures'])
        self.assertNotIn('lesson_key', result)
        for key in ('', 'lesson-02', 'unknown:lesson-02'):
            self.assertEqual(verifier.verify(key)['status'], 'failed')
        self.assertEqual(verifier.verify(offering_id='2026-fall')['status'], 'failed')

    def test_invalid_rehearsal_schema_returns_failure(self):
        self.fixture.change('02', '20-approved/lesson-manifest.json', lambda x: x['qa'].update(rehearsal='pending'))
        result = verifier.verify(self.fixture.key('02'))
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['delivery_status'], 'blocked')
        self.assertIn('authority qa.rehearsal must be an object', result['failures'])

    def test_corrupt_release_bytes_and_zip_fail(self):
        lesson = self.fixture.lessons['10']
        (lesson / '40-release/test-release/lesson-10-教材包/02-简易教案/manual.docx').write_text('corrupt')
        (lesson / '40-release/test-release.zip').write_bytes(b'not-a-zip')
        result = verifier.verify(self.fixture.key('10'))
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(any('release file hash mismatch' in x for x in result['failures']))
        self.assertTrue(any('release ZIP is invalid' in x for x in result['failures']))

    def test_human_gates_remain_independent_from_integrity(self):
        self.fixture.change('12', '20-approved/lesson-manifest.json', lambda x: x['qa'].update(rehearsal={}))
        result = verifier.verify(self.fixture.key('12'))
        self.assertEqual(result['status'], 'passed', result['failures'])
        self.assertEqual(result['delivery_status'], 'blocked')
        self.assertEqual(len(result['delivery_blockers']), 2)

    def test_cli_and_offering_forwarding(self):
        key = self.fixture.key('12')
        with mock.patch.object(sys, 'argv', ['verify', '--lesson-key', key, '--offering-id', '2026-fall']), mock.patch('sys.stdout', new_callable=io.StringIO) as output:
            self.assertEqual(verifier.main(), 0)
        result = json.loads(output.getvalue())
        self.assertEqual(result['lesson_key'], key)
        self.assertEqual(result['offering_id'], '2026-fall')
        self.assertEqual(verifier.verify(key, 'wrong-offering')['status'], 'failed')


if __name__ == '__main__':
    unittest.main()
