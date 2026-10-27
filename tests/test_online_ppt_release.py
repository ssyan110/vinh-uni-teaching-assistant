"""Synthetic online delivery lifecycle; never uses real lesson approvals."""
import json
import subprocess
import sys
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import online_ppt_release as release
import build_dashboard
import production_gate
from workflow_integrity import sha256, audit_authority_manifest


class OnlinePPTReleaseTests(unittest.TestCase):
    def setUp(self):
        self.root = ROOT / '.agent/runs/online-release-test-fixtures' / uuid.uuid4().hex
        self.root.mkdir(parents=True)
        (self.root / '.agent/runs').mkdir(parents=True)
        (self.root / 'course').mkdir()
        self.key = 'test-book:lesson-01'
        self.lesson = self.root / 'lessons/test-book/lesson-01'
        self.lesson.mkdir(parents=True)
        self.design = self.lesson / '10-design'
        self.design.mkdir()
        (self.lesson / '00-source').mkdir()
        (self.root / 'project.config.json').write_text(json.dumps({'lesson_registry': 'course/lesson-registry.json'}))
        (self.root / 'course/lesson-registry.json').write_text(json.dumps({'lessons': [{'lesson_key': self.key, 'textbook_id': 'test-book', 'lesson_id': 'lesson-01', 'lesson_path': 'lessons/test-book/lesson-01', 'offering_ids': ['term-a', 'term-b']}]}))
        for target in (release, production_gate):
            p = patch.object(target, 'ROOT' if target is release else 'PROJECT_ROOT', self.root)
            p.start()
            self.addCleanup(p.stop)
        self.fixtures = {term: self.make_version(term) for term in ('term-a', 'term-b')}

    def rel(self, path):
        return path.relative_to(self.root).as_posix()

    def make_version(self, term):
        artifact, scope = 'lesson-01-v1', 'year1-class-a'
        output = self.design / 'pptx-draft/online' / term / artifact
        output.mkdir(parents=True)
        source = self.lesson / '00-source' / f'{term}-source.json'
        source.write_text('{"synthetic":true}')
        review = self.design / f'{term}-review.json'
        spec = {'lesson_key': self.key, 'offering_id': term, 'artifact_id': artifact, 'class_scope': scope,
                'slides': [{'kind': 'cover', 'elements': [{'type': 'text', 'text': '第一课'}]},
                           {'kind': 'learning_flow', 'elements': [{'type': 'text', 'text': '学习流程'}]}]}
        review.write_text(json.dumps(spec, ensure_ascii=False))
        source_check = self.design / f'{term}-source-check.txt'
        source_check.write_text('Synthetic checked source')
        evidence = self.design / f'{term}-content-decision.txt'
        evidence.write_text('Synthetic user approved this specific copy')
        approvals = self.design / 'approvals' / term
        approvals.mkdir(parents=True)
        approval = approvals / f'{artifact}.json'
        record = {'status': 'approved', 'gate': 'artifact-content', 'lesson_key': self.key, 'offering_id': term,
                  'artifact_scope': 'online', 'artifact_id': artifact, 'class_scope': scope, 'approved_by': 'synthetic',
                  'approved_at': '2026-10-27T10:00:00+07:00', 'source_path': self.rel(source),
                  'review_path': self.rel(review), 'source_check_path': self.rel(source_check),
                  'artifacts': [{'path': self.rel(p), 'sha256': sha256(p)} for p in (source, review, source_check)],
                  'evidence': self.rel(evidence), 'evidence_sha256': sha256(evidence)}
        approval.write_text(json.dumps(record))
        pptx = output / 'lesson-01-在线预习.pptx'
        script = "const P=require('pptxgenjs');const p=new P();p.layout='LAYOUT_WIDE';for(const t of ['第一课','学习流程'])p.addSlide().addText(t,{x:1,y:1,w:6,h:1,fontSize:30});p.writeFile({fileName:process.argv[1]});"
        subprocess.run(['node', '-e', script, str(pptx)], cwd=ROOT, check=True, capture_output=True)
        build = {'lesson_key': self.key, 'offering_id': term, 'class_scope': scope, 'artifact_id': artifact,
                 'approval_record': self.rel(approval), 'review_path': self.rel(review), 'review_sha256': sha256(review),
                 'slides': 2, 'pptx': {'path': self.rel(pptx), 'sha256': sha256(pptx)}, 'resources': [],
                 'status': 'draft_not_approved', 'visual_qa': 'pending', 'playback_qa': 'pending'}
        (output / 'build-manifest.json').write_text(json.dumps(build))
        pages = []
        for index in (1, 2):
            screenshot = output / f'page-{index}.png'
            rendered = Image.new('RGB', (960, 540), 'white')
            rendered.putpixel((100, 100), (0, 0, 0))
            rendered.save(screenshot)
            pages.append({'index': index, 'image': self.rel(screenshot), 'sha256': sha256(screenshot), 'issues': []})
        qa = output / 'qa.json'
        app_proof = output / 'synthetic-app-check.txt'
        app_proof.write_text('Synthetic application open and edit check; test fixture only')
        qa.write_text(json.dumps({'schema_version': 'online-pptx-qa-v1', 'status': 'passed', 'lesson_key': self.key,
                   'offering_id': term, 'artifact_id': artifact, 'class_scope': scope, 'pptx_sha256': sha256(pptx),
                   'slide_count': 2, 'content_checked': True, 'visual_checked': True, 'issues': [], 'pages': pages,
                   'application_check': {'status': 'passed', 'application': 'Synthetic test application',
                                         'evidence': {'path': self.rel(app_proof), 'sha256': sha256(app_proof)}}}))
        return (self.key, term, artifact, scope, self.rel(approval), self.rel(pptx), self.rel(qa))

    def evidence(self, args, digest, release_id):
        path = self.design / f'{args[1]}-{release_id}-user.json'
        path.write_text(json.dumps({'gate': 'online-package-approval', 'lesson_key': self.key, 'offering_id': args[1],
                   'artifact_id': args[2], 'class_scope': args[3], 'candidate_sha256': digest, 'approved_by': 'synthetic',
                   'approved_at': '2026-10-27T10:00:00+07:00', 'user_decision': 'Synthetic user approves and releases exactly this PPTX',
                   'approved_components': ['pptx'], 'authorized_actions': ['release'], 'release_id': release_id}))
        return self.rel(path)

    def test_two_offerings_separate_and_one_decision_can_authorize_delivery(self):
        for term in ('term-a', 'term-b'):
            args = self.fixtures[term]
            candidate = release.plan(*args)
            self.assertEqual(candidate['status'], 'ready_for_human_review', candidate['blockers'])
            decision = self.evidence(args, candidate['candidate_sha256'], f'{term}-release')
            approved = release.promote(*args, candidate['candidate_sha256'], decision)
            self.assertEqual(approved['status'], 'approved')
            result = release.release(self.key, term, candidate['candidate_sha256'], f'{term}-release', decision)
            self.assertEqual(result['status'], 'released')
            self.assertEqual(release.verify(self.key, term, f'{term}-release')['status'], 'verified')
        manifest = json.loads((self.lesson / '20-approved/lesson-manifest.json').read_text())
        self.assertEqual(len(manifest['authority']['online_pptx']), 2)
        with patch.object(build_dashboard, 'PROJECT_ROOT', self.root), patch.object(build_dashboard, 'verify_online_release', side_effect=release.verify):
            groups = build_dashboard.build_file_groups(self.lesson, manifest)
            group = next(g for g in groups if g['id'] == 'online-pptx-release')
            self.assertEqual(sum(item['path'].endswith('在线预习.zip') for item in group['files']), 2)
        self.assertEqual(audit_authority_manifest(self.root, self.lesson / '20-approved', manifest)['failures'], [])
        self.assertEqual(release.verify(self.key, 'term-a', 'term-a-release')['status'], 'verified')
        with self.assertRaisesRegex(ValueError, 'offering'):
            release.verify(self.key, 'term-b', 'term-a-release')

    def test_missing_or_stale_approval_and_qa_are_blocked(self):
        args = self.fixtures['term-a']
        self.assertEqual(release.plan(*args)['status'], 'ready_for_human_review')
        self.assertEqual(release.plan(args[0], 'term-b', *args[2:])['status'], 'blocked')
        qa = self.root / args[-1]
        value = json.loads(qa.read_text()); value['visual_checked'] = False; qa.write_text(json.dumps(value))
        self.assertEqual(release.plan(*args)['status'], 'blocked')
        self.assertFalse((self.lesson / '20-approved').exists())

    def test_missing_or_invalid_application_check_blocks(self):
        args = self.fixtures['term-a']
        qa_path = self.root / args[-1]
        report = json.loads(qa_path.read_text())
        check = report.pop('application_check')
        qa_path.write_text(json.dumps(report))
        self.assertEqual(release.plan(*args)['status'], 'blocked')
        check['evidence']['path'] = self.rel(self.design / 'missing-proof.txt')
        report['application_check'] = check
        qa_path.write_text(json.dumps(report))
        self.assertEqual(release.plan(*args)['status'], 'blocked')

    def test_changed_pptx_and_missing_release_authorization_block_writes(self):
        args = self.fixtures['term-a']
        candidate = release.plan(*args)
        decision = self.evidence(args, candidate['candidate_sha256'], 'term-a-release')
        path = self.root / decision
        value = json.loads(path.read_text()); value['authorized_actions'] = []; path.write_text(json.dumps(value))
        release.promote(*args, candidate['candidate_sha256'], decision)
        with self.assertRaisesRegex(ValueError, 'authorization'):
            release.release(self.key, 'term-a', candidate['candidate_sha256'], 'term-a-release', decision)
        self.assertFalse((self.lesson / '40-release/term-a-release').exists())

    def test_changed_actual_slide_text_blocks_plan(self):
        args = self.fixtures['term-a']
        pptx = self.root / args[5]
        pptx.write_bytes(b'not pptx')
        self.assertEqual(release.plan(*args)['status'], 'blocked')

    def test_blank_qa_image_and_changed_release_are_blocked(self):
        args = self.fixtures['term-a']
        qa_path = self.root / args[-1]
        qa = json.loads(qa_path.read_text())
        screenshot = self.root / qa['pages'][0]['image']
        previous = screenshot.read_bytes()
        Image.new('RGB', (960, 540), 'white').save(screenshot)
        qa['pages'][0]['sha256'] = sha256(screenshot)
        qa_path.write_text(json.dumps(qa))
        self.assertEqual(release.plan(*args)['status'], 'blocked')
        screenshot.write_bytes(previous)
        qa['pages'][0]['sha256'] = sha256(screenshot)
        qa_path.write_text(json.dumps(qa))
        candidate = release.plan(*args)
        decision = self.evidence(args, candidate['candidate_sha256'], 'term-a-release')
        release.promote(*args, candidate['candidate_sha256'], decision)
        release.release(self.key, 'term-a', candidate['candidate_sha256'], 'term-a-release', decision)
        deck = self.lesson / '40-release/term-a-release/lesson-01-在线预习/lesson-01-在线预习.pptx'
        deck.write_bytes(b'tampered')
        with self.assertRaisesRegex(ValueError, 'changed'):
            release.verify(self.key, 'term-a', 'term-a-release')

    def test_audio_requires_independent_checks_and_pinned_playback_evidence(self):
        args = self.fixtures['term-a']
        approval_path = self.root / args[4]
        approval = json.loads(approval_path.read_text())
        review_path = self.root / approval['review_path']
        spec = json.loads(review_path.read_text())
        spec['slides'][0]['audio'] = ['Audio 1-1']
        spec['slides'][0]['elements'].append({'type': 'text', 'text': 'Audio 1-1'})
        review_path.write_text(json.dumps(spec))
        for item in approval['artifacts']:
            if item['path'] == self.rel(review_path):
                item['sha256'] = sha256(review_path)
        approval_path.write_text(json.dumps(approval))
        build_path = (self.root / args[5]).parent / 'build-manifest.json'
        build = json.loads(build_path.read_text())
        build['review_sha256'] = sha256(review_path)
        pptx = self.root / args[5]
        script = "const P=require('pptxgenjs');const p=new P();p.layout='LAYOUT_WIDE';let s=p.addSlide();s.addText('第一课',{x:1,y:1,w:6,h:1,fontSize:30});s.addText('Audio 1-1',{x:10,y:0.2,w:2,h:0.5,fontSize:20});p.addSlide().addText('学习流程',{x:1,y:1,w:6,h:1,fontSize:30});p.writeFile({fileName:process.argv[1]});"
        subprocess.run(['node', '-e', script, str(pptx)], cwd=ROOT, check=True, capture_output=True)
        build['pptx']['sha256'] = sha256(pptx)
        build_path.write_text(json.dumps(build))
        qa_path = self.root / args[-1]
        qa = json.loads(qa_path.read_text())
        qa['pptx_sha256'] = sha256(pptx)
        qa_path.write_text(json.dumps(qa))
        self.assertEqual(release.plan(*args)['status'], 'blocked')
        audio_path = self.root / 'textbooks/test-book/source/audio.wav'
        audio_path.parent.mkdir(parents=True)
        audio_path.write_bytes(b'synthetic audio')
        evidence = self.design / 'synthetic-playback-evidence.txt'
        evidence.write_text('Synthetic playback record for test only')
        qa = json.loads(qa_path.read_text())
        qa['audio'] = [{'label': 'Audio 1-1', 'source': {'kind': 'local', 'path': self.rel(audio_path),
                         'sha256': sha256(audio_path)}, 'source_verified': True, 'decode_verified': True,
                         'semantic_verified': True, 'playback_verified': True, 'playback_method': 'Synthetic player',
                         'playback_evidence': {'path': self.rel(evidence), 'sha256': sha256(evidence)}}]
        semantic = self.design / 'synthetic-semantic-evidence.txt'
        semantic.write_text('Synthetic source comparison')
        qa['audio'][0]['semantic_evidence'] = {'path': self.rel(semantic), 'sha256': sha256(semantic)}
        qa_path.write_text(json.dumps(qa))
        candidate = release.plan(*args)
        self.assertEqual(candidate['status'], 'ready_for_human_review', candidate['blockers'])
        semantic.write_text('changed')
        self.assertEqual(release.plan(*args)['status'], 'blocked')
        semantic.write_text('Synthetic source comparison')
        decision = self.evidence(args, candidate['candidate_sha256'], 'audio-release')
        release.promote(*args, candidate['candidate_sha256'], decision)
        release.release(self.key, 'term-a', candidate['candidate_sha256'], 'audio-release', decision)
        self.assertEqual(release.verify(self.key, 'term-a', 'audio-release')['status'], 'verified')
        evidence.write_text('Changed')
        self.assertEqual(release.plan(*args)['status'], 'blocked')

    def test_failed_commit_rolls_back_without_deleting_evidence(self):
        args = self.fixtures['term-a']
        candidate = release.plan(*args)
        decision = self.evidence(args, candidate['candidate_sha256'], 'term-a-release')
        with patch.object(release.tx, 'atomic_manifest', side_effect=OSError('synthetic failure')):
            with self.assertRaisesRegex(OSError, 'synthetic failure'):
                release.promote(*args, candidate['candidate_sha256'], decision)
        self.assertFalse((self.lesson / '20-approved/lesson-manifest.json').exists())
        self.assertTrue(any((self.root / '.agent/runs').glob('classroom-release-transaction-*/rolled-back-payload')))
        self.assertEqual(release.promote(*args, candidate['candidate_sha256'], decision)['status'], 'approved')


if __name__ == '__main__':
    unittest.main()
