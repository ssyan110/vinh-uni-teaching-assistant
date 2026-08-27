import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.scoring import (  # noqa: E402
    ALL_CRITERIA,
    RubricValidationError,
    validate_feedback_record,
)


class ScoringTests(unittest.TestCase):
    @classmethod
    def make_scores(self, value=3):
        return {criterion_id: value for criterion_id in ALL_CRITERIA}

    def test_feedback_record_can_focus_on_selected_criteria(self):
        record = {
            "student_id": "S001",
            "task_id": "L1-P3",
            "attempt": "A1",
            "scores": {"PR1": 2, "PR2": "N/A"},
            "evidence": [{"criterion": "PR1", "note_zh_cn": "能说出主要意思。"}],
        }
        validate_feedback_record(record)

    def test_nr_is_not_zero(self):
        scores = self.make_scores(2)
        scores["I3"] = "NR"
        record = {"student_id": "S001", "task_id": "L1-P4", "attempt": "A1", "scores": scores}
        validate_feedback_record(record)
        self.assertNotEqual("NR", 0)

    def test_unknown_criterion_is_blocked(self):
        record = {
            "student_id": "S001",
            "task_id": "L1-P3",
            "attempt": "A1",
            "scores": {"UNKNOWN": 2},
        }
        with self.assertRaises(RubricValidationError):
            validate_feedback_record(record)

    def test_a1_and_a2_are_separate(self):
        base = {"student_id": "S001", "task_id": "L1-P4", "scores": {"P2": 2}}
        validate_feedback_record({**base, "attempt": "A1"})
        validate_feedback_record({**base, "attempt": "A2"})

    def test_feedback_record_rejects_school_total_and_level(self):
        base = {"student_id": "S001", "task_id": "L1-P4", "attempt": "A1", "scores": {"P2": 2}}
        with self.assertRaises(RubricValidationError):
            validate_feedback_record({**base, "ability_total": 2})
        with self.assertRaises(RubricValidationError):
            validate_feedback_record({**base, "weighting": {"P2": 1}})
        with self.assertRaises(RubricValidationError):
            validate_feedback_record({**base, "actfl_level": "Intermediate"})


if __name__ == "__main__":
    unittest.main()
