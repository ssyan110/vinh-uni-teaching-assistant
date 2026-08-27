import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.scoring import RubricValidationError, validate_rubric  # noqa: E402


class RubricValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads((ROOT / "data/rubric.zh-CN.json").read_text(encoding="utf-8"))

    def test_rubric_contract_is_valid(self):
        validate_rubric(self.document)

    def test_actfl_mapping_is_null(self):
        self.assertIsNone(self.document["rubric"]["scale"]["actfl_level_mapping"])

    def test_task_completion_is_outside_school_grading(self):
        self.assertFalse(self.document["rubric"]["task_completion"]["included_in_school_grade"])
        self.assertFalse(self.document["task_completion"]["included_in_school_grade"])

    def test_feedback_tool_has_no_school_grading_or_weighting(self):
        self.assertFalse(self.document["rubric"]["feedback_use"]["school_grading"])
        self.assertNotIn("weighting", self.document["rubric"])

    def test_presentational_cannot_contain_interpersonal_terms(self):
        altered = json.loads(json.dumps(self.document))
        altered["criteria"][10]["scores"]["3"] += "，并根据听者反应追问。"
        with self.assertRaises(RubricValidationError):
            validate_rubric(altered)


if __name__ == "__main__":
    unittest.main()
