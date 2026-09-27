import json
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import audit_active_context_consumers as consumers
import audit_requirements_coverage as coverage
from dashboard_context import _safe_project_path, load_dashboard_context
from lesson_context import LessonContextError


class ClosureTests(unittest.TestCase):
    def test_current_authority_and_stale_status_removal(self):
        agents = (ROOT / 'AGENTS.md').read_text()
        precedence = agents.split('## 權威順序', 1)[1].split('### Finalized', 1)[0]
        self.assertIn('docs/workflow/canonical-workflow-contract.md', precedence)
        self.assertIn('不列入現行規格權威', precedence)
        self.assertNotIn('7. 舊的輸出', precedence)
        reference = (ROOT / '.agent/skills/boya-lesson-production/references/workflow-and-evidence.md').read_text()
        self.assertNotIn('本次第一課的主任審核包已登記', reference)

    def test_empty_requirements_blocked(self):
        original = Path.read_text
        with patch.object(Path, 'read_text', lambda p, *a, **k: '' if p.name == 'PROJECT_REQUIREMENTS.md' else original(p, *a, **k)):
            self.assertEqual('blocked', coverage.audit(ROOT)['status'])

    def test_temporary_consumer_and_cli_exit(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / 'scripts').mkdir()
            (root / 'scripts/new.py').write_text('config.get("active_context")')
            result = consumers.audit(root)
            self.assertEqual('blocked', result['status'])
            self.assertFalse(result['write_performed'])
            with patch.object(consumers, 'audit', return_value=result), patch.object(sys, 'argv', ['audit']):
                self.assertEqual(1, consumers.main())

    def test_dashboard_rejects_unsafe_outputs(self):
        for value in ('', '.', '../outside', '/tmp/out', 'lessons/book/lesson-01/20-approved', 'lessons/book/lesson-01/30-qa', 'lessons/book/lesson-01/40-release'):
            with self.subTest(value=value), self.assertRaises(LessonContextError):
                _safe_project_path(ROOT, value, 'dashboard')
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / 'target').mkdir()
            (root / 'dashboard').symlink_to(root / 'target')
            with self.assertRaises(LessonContextError):
                _safe_project_path(root, 'dashboard', 'dashboard')

    def test_dashboard_identity_rejection_and_valid_context(self):
        self.assertEqual('boya-quasi-intermediate-i', load_dashboard_context(ROOT).textbook_id)
        original = Path.read_text
        config = json.loads(original(ROOT / 'project.config.json'))
        for active in (None, {}, {**config['active_context'], 'textbook_id': 'wrong-book'}, {**config['active_context'], 'offering_id': 'wrong-offering'}):
            payload = {**config, 'active_context': active}
            with patch.object(Path, 'read_text', lambda p, *a, **k: json.dumps(payload) if p.name == 'project.config.json' else original(p, *a, **k)):
                with self.assertRaises(LessonContextError):
                    load_dashboard_context(ROOT)

    def test_references_have_markdown_not_tool_line_numbers(self):
        directory = ROOT / '.agent/skills/boya-lesson-production'
        main = (directory / 'SKILL.md').read_text()
        for name in ('source-and-pbi.md', 'pptx-production.md', 'teacher-guide-and-materials.md', 'workflow-and-evidence.md'):
            text = (directory / 'references' / name).read_text()
            self.assertIsNone(re.search(r'^\d+\|', text, re.M), name)
            self.assertRegex(text, r'(?m)^#{2,4} ')
            self.assertIn('references/' + name, main)
        self.assertIn('### 4.2 ', (directory / 'references/pptx-production.md').read_text())


if __name__ == '__main__':
    unittest.main()
