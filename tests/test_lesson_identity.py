import json
import unittest
from pathlib import Path

from scripts.validate_lesson_identity import validate


ROOT = Path(__file__).resolve().parents[1]


class LessonIdentityTests(unittest.TestCase):
    def test_registry_has_scoped_duplicate_lesson_numbers(self):
        registry = json.loads((ROOT / "course/lesson-registry.json").read_text(encoding="utf-8"))
        first_lessons = {
            item["lesson_key"]
            for item in registry["lessons"]
            if item["lesson_number"] == 1
        }
        self.assertEqual(
            first_lessons,
            {
                "boya-quasi-intermediate-i:lesson-01",
                "boya-intermediate-i:lesson-01",
            },
        )

    def test_registry_and_active_context_validate(self):
        errors = validate(ROOT / "course/lesson-registry.json", ROOT / "project.config.json")
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
