"""Synthetic approvals isolate offering, class, artifact, and exact input bytes."""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests'))
sys.path.insert(0, str(ROOT / 'scripts'))
from test_content_approval import ContentApprovalTests
from workflow_integrity import sha256
import production_gate as gate


class ScopedContentTests(ContentApprovalTests):
    def make_scoped(self, term, mode, artifact_id, cohort='group-a'):
        source = self.lesson / '00-source' / f'{term}-{mode}-source.json'
        review = self.story / f'{term}-{artifact_id}-review.md'
        source_check = self.story / f'{term}-{artifact_id}-source-check.md'
        evidence = self.story / f'{term}-{artifact_id}-evidence.md'
        for path, text in ((source, '{}'), (review, 'reviewed content'), (source_check, 'source pages checked'), (evidence, 'synthetic explicit user approval')):
            self.write(path, text)
        record = self.lesson / '10-design/approvals' / term / mode / f'{artifact_id}.json'
        data = {'status': 'approved', 'gate': 'artifact-content', 'lesson_key': self.key,
                'offering_id': term, 'artifact_scope': mode, 'artifact_id': artifact_id, 'class_scope': cohort,
                'approved_by': 'synthetic', 'approved_at': '2026-10-27T12:00:00+07:00',
                'source_path': self.rel(source), 'review_path': self.rel(review), 'source_check_path': self.rel(source_check),
                'artifacts': [{'path': self.rel(x), 'sha256': sha256(x)} for x in (source, review, source_check)],
                'evidence': self.rel(evidence), 'evidence_sha256': sha256(evidence)}
        self.write(record, data)
        return record, review

    def check_scoped(self, record, term, mode, artifact, cohort='group-a'):
        return gate.check_content_approval(self.key, term, self.rel(record), mode, artifact, cohort)

    def test_online_and_classroom_versions_do_not_cross_authorize(self):
        online, _ = self.make_scoped('2026-fall', 'online', 'online-l04-v1')
        classroom, classroom_review = self.make_scoped('2026-fall', 'classroom', 'w09-v1')
        self.assertEqual(self.check_scoped(online, '2026-fall', 'online', 'online-l04-v1')['status'], 'ready')
        self.assertEqual(self.check_scoped(classroom, '2026-fall', 'classroom', 'w09-v1')['status'], 'ready')
        self.assertEqual(self.check_scoped(online, '2026-fall', 'classroom', 'online-l04-v1')['status'], 'blocked')
        self.assertEqual(self.check_scoped(classroom, '2026-fall', 'classroom', 'w10-v1')['status'], 'blocked')
        self.assertEqual(self.check_scoped(classroom, '2026-fall', 'classroom', 'w09-v1', 'group-b')['status'], 'blocked')
        classroom_review.write_text('changed classroom content')
        self.assertEqual(self.check_scoped(classroom, '2026-fall', 'classroom', 'w09-v1')['status'], 'blocked')
        self.assertEqual(self.check_scoped(online, '2026-fall', 'online', 'online-l04-v1')['status'], 'ready')

    def test_same_lesson_different_terms_are_isolated(self):
        registry = self.root / 'course/lesson-registry.json'
        data = json.loads(registry.read_text())
        data['lessons'][0]['offering_ids'].append('2027-spring')
        self.write(registry, data)
        first, _ = self.make_scoped('2026-fall', 'online', 'online-v1')
        second, _ = self.make_scoped('2027-spring', 'online', 'online-v2')
        self.assertEqual(self.check_scoped(first, '2027-spring', 'online', 'online-v1')['status'], 'blocked')
        self.assertEqual(self.check_scoped(second, '2027-spring', 'online', 'online-v2')['status'], 'ready')
        self.assertEqual(self.check_scoped(first, '2026-fall', 'online', 'online-v1')['status'], 'ready')

    def test_scoped_online_gate_does_not_require_classroom_boundary(self):
        record, _ = self.make_scoped('2026-fall', 'online', 'online-v1')
        (self.story / 'lesson-04-boundary-confirmation.md').rename(self.story / 'boundary-saved')
        output = str(self.lesson / '10-design/pptx-draft/online/2026-fall/online-v1')
        result = gate.check_lesson_ppt_draft(self.key, output, '2026-fall', self.rel(record), 'online-v1', 'group-a')
        self.assertEqual(result['status'], 'ready', result)
        result = gate.check_lesson_ppt_draft(self.key, output, '2026-fall', self.rel(record), 'online-v1', 'wrong-class')
        self.assertEqual(result['status'], 'blocked')

    def test_source_check_is_required_and_bound(self):
        record, _ = self.make_scoped('2026-fall', 'classroom', 'w09-v1')
        data = json.loads(record.read_text())
        data['artifacts'] = [x for x in data['artifacts'] if x['path'] != data['source_check_path']]
        self.write(record, data)
        self.assertEqual(self.check_scoped(record, '2026-fall', 'classroom', 'w09-v1')['status'], 'blocked')


if __name__ == '__main__':
    unittest.main()
