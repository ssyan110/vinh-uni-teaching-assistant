import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.validation import assert_simplified_student_text  # noqa: E402


class LanguagePolicyTests(unittest.TestCase):
    def test_student_templates_are_simplified_and_have_no_vietnamese_instruction(self):
        for filename in (
            "student-compact-rubric.md",
            "task-goal-card.md",
            "retry-record.md",
            "student-self-assessment.md",
        ):
            assert_simplified_student_text(ROOT / "templates" / filename)

    def test_research_docs_are_allowed_to_use_traditional_chinese(self):
        text = (ROOT / "docs/teacher-guide.md").read_text(encoding="utf-8")
        self.assertIn("教師", text)
        self.assertIn("ACTFL", text)


if __name__ == "__main__":
    unittest.main()
