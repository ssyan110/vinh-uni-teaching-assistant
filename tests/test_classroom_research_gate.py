"""Synthetic fixtures exercise evidence rejection; never production research evidence."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from classroom_research_gate import check_classroom_research


class ResearchGateTests(unittest.TestCase):
    def setUp(self):
        project = Path(__file__).resolve().parents[1]
        fixtures = project / '.agent/runs/research-gate-synthetic-fixtures'
        fixtures.mkdir(parents=True, exist_ok=True)
        self.root = Path(tempfile.mkdtemp(prefix='case-', dir=fixtures))
        self.design = self.root / 'lessons/book/lesson-01/10-design'
        self.design.mkdir(parents=True)
        self.record = dict(provider='ChatGPT', status='captured', lesson_keys=['book:lesson-01'], offering_id='term', artifact_id='deck', class_scope='class', conversation_url='https://chatgpt.com/c/synthetic-test-only', captured_at='2026-11-04T10:00:00+07:00', adapted_at='2026-11-04T11:00:00+07:00', sources_verified=True)
        for field in ('prompt','response','sources','adaptation','review'):
            p = self.design / (field + '.md')
            p.write_text('SYNTHETIC TEST FIXTURE: ' + field)
            self.record[field] = dict(path=p.relative_to(self.root).as_posix(), sha256=hashlib.sha256(p.read_bytes()).hexdigest())
        self.path = self.design / 'research.json'

    def check(self):
        self.path.write_text(json.dumps(self.record))
        return check_classroom_research(self.root, self.path.relative_to(self.root), 'book:lesson-01','term','deck','class')

    def test_complete_fixture(self):
        self.assertEqual(self.check()['status'], 'ready')

    def test_missing_record(self):
        self.assertEqual(check_classroom_research(self.root,None,'book:lesson-01','term','deck','class')['status'],'blocked')

    def test_changed_response(self):
        (self.design / 'response.md').write_text('altered')
        self.assertEqual(self.check()['status'],'blocked')

    def test_wrong_scope(self):
        self.record['artifact_id']='other'
        self.assertEqual(self.check()['status'],'blocked')

    def test_research_after_adaptation(self):
        self.record['captured_at']='2026-11-04T12:00:00+07:00'
        self.assertEqual(self.check()['status'],'blocked')

    def test_empty_response(self):
        p=self.design / 'response.md'; p.write_text('')
        self.record['response']['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
        self.assertEqual(self.check()['status'],'blocked')

    def test_path_escape(self):
        self.record['response']['path']='../outside.md'
        self.assertEqual(self.check()['status'],'blocked')

    def test_same_file_cannot_replace_all_evidence(self):
        self.record['response']=self.record['prompt']
        self.assertEqual(self.check()['status'],'blocked')

    def test_source_verification_required(self):
        self.record['sources_verified']=False
        self.assertEqual(self.check()['status'],'blocked')

    def test_timezone_required(self):
        self.record['captured_at']='2026-11-04T10:00:00'
        self.assertEqual(self.check()['status'],'blocked')

    def test_no_session(self):
        self.record['conversation_url']='https://example.com/c/fake'
        self.assertEqual(self.check()['status'],'blocked')

if __name__ == '__main__':
    unittest.main()
