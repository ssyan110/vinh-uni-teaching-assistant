import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from production_gate import check_year1_online_objectives, requires_year1_objectives


class ObjectivesGateTest(unittest.TestCase):
    def test_valid_year1_review(self):
        check_year1_online_objectives({"slides": [
            {"kind": "cover"}, {"kind": "learning_flow"},
            {"kind": "learning_objectives", "elements": [{"type": "text", "text": "能询问航班时间"}]},
        ]}, "一年级下学期全班")

    def test_missing_or_misordered_objectives_are_blocked(self):
        for slides in ([{"kind": "cover"}, {"kind": "learning_flow"}],
                       [{"kind": "cover"}, {"kind": "learning_objectives"}, {"kind": "learning_flow"}]):
            with self.subTest(slides=slides), self.assertRaises(ValueError):
                check_year1_online_objectives({"slides": slides}, "一年级下学期全班")

    def test_blank_objectives_are_blocked(self):
        with self.assertRaises(ValueError):
            check_year1_online_objectives({"slides": [
                {"kind": "cover"}, {"kind": "learning_flow"},
                {"kind": "learning_objectives", "elements": [{"type": "text", "text": "  "}]},
            ]}, "一年级下学期全班")

    def test_other_year_not_affected(self):
        check_year1_online_objectives({}, "二年级全班")

    def test_new_year1_and_current_target_checked_without_retroactive_changes(self):
        old = datetime.fromisoformat("2026-10-30T10:00:00+07:00")
        new = datetime.fromisoformat("2026-11-03T10:00:00+07:00")
        self.assertFalse(requires_year1_objectives("boya-elementary-i:lesson-04", "2026-fall", "一年级全班", old))
        self.assertTrue(requires_year1_objectives("boya-elementary-ii:lesson-01", "2027-spring", "一年级全班", old))
        self.assertTrue(requires_year1_objectives("other:lesson-01", "2028-spring", "一年级全班", new))
        self.assertFalse(requires_year1_objectives("other:lesson-01", "2028-spring", "二年级全班", new))


if __name__ == "__main__":
    unittest.main()
