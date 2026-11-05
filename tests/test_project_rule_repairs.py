"""Policy regression checks use synthetic evidence only."""
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from production_gate import requires_year1_objectives, check_year1_online_objectives, requires_classroom_research
from classroom_research_gate import check_classroom_research
from check_project_readiness import check

class RuleRepairTests(unittest.TestCase):
    def test_canonical_cohort_checks_objectives(self):
        self.assertTrue(requires_year1_objectives('boya-elementary-i:lesson-18', '2026-fall', 'BOYA-LS-E1-Y1S1-2026F', datetime.fromisoformat('2026-11-05T10:00:00+07:00')))
        with self.assertRaises(ValueError):
            check_year1_online_objectives({}, 'BOYA-LS-E1-Y1S1-2026F')

    def test_canonical_other_year_unaffected(self):
        self.assertFalse(requires_year1_objectives('boya-quasi-intermediate-i:lesson-08', '2026-fall', 'BOYA-LS-QI-Y2S1-2026F', datetime.fromisoformat('2026-11-05T10:00:00+07:00')))

    def test_absolute_research_record_rejected(self):
        root = Path(__file__).resolve().parents[1]
        result = check_classroom_research(root, str(root / 'lessons/book/lesson-01/10-design/research.json'), 'book:lesson-01', 'term', 'deck', 'class')
        self.assertEqual(result['status'], 'blocked')
        self.assertIn('absolute paths', result['blockers'][0])

    def test_unavailable_capability_never_authorizes_production(self):
        with patch('check_project_readiness.resolve_relative_path', side_effect=ValueError('unsafe')):
            result = check(Path(__file__).resolve().parents[1], 'online')
        self.assertEqual(result['status'], 'blocked')
        self.assertFalse(result['production_authorized'])

    def test_research_scope_preserves_pre_rule_approval_only(self):
        self.assertFalse(requires_classroom_research(datetime.fromisoformat('2026-11-03T23:59:59+07:00')))
        self.assertTrue(requires_classroom_research(datetime.fromisoformat('2026-11-04T00:00:00+07:00')))
