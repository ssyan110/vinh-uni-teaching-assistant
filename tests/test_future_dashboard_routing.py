"""Registered lessons can be prepared without earlier releases."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build_dashboard


class FutureDashboardRoutingTests(unittest.TestCase):
    def test_registered_later_lesson_does_not_inherit_previous_lock(self):
        key = f'{build_dashboard.TEXTBOOK_ID}:lesson-12'
        entry = {'lesson_key': key, 'lesson_path': f'lessons/{build_dashboard.TEXTBOOK_ID}/lesson-12', 'title': 'Test'}
        with patch.object(build_dashboard, 'build_gates', return_value=[]), patch.object(build_dashboard, 'draft_manifests', return_value=[]), patch.object(build_dashboard, 'read_json', return_value=None), patch.object(build_dashboard, 'build_file_groups', return_value=[]):
            summary, _, _ = build_dashboard.build_lesson(12, {}, False, {12: entry})
        self.assertEqual(summary['status'], 'available')
        self.assertNotIn('上一课', summary['unlock_reason'])

    def test_unstarted_registered_lesson_gates_are_not_locked_by_prior_lesson(self):
        gates = build_dashboard.build_gates(12, ROOT / 'lessons' / 'missing-fixture', None, None, True)
        self.assertTrue(all(g['status'] != 'locked' for g in gates))


if __name__ == '__main__':
    unittest.main()
