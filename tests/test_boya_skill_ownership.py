from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / ".agent/skills/boya-lesson-production/SKILL.md"
OWNERSHIP = ROOT / ".agent/skills/boya-lesson-production/references/ownership-map.md"


class BoyaSkillOwnershipTests(unittest.TestCase):
    def test_skill_declares_canonical_ownership_boundary(self) -> None:
        text = SKILL.read_text(encoding="utf-8")
        ownership = OWNERSHIP.read_text(encoding="utf-8")
        for token in (
            "artifact-specific procedure skill",
            "canonical-workflow-contract.md",
            "requirements-registry.md",
            "references/ownership-map.md",
            "technical readiness into human approval",
        ):
            self.assertIn(token, text)
        self.assertIn("What this skill owns", ownership)
        self.assertIn("What this skill does not own", ownership)

    def test_skill_does_not_route_identity_through_legacy_canonical_source(self) -> None:
        text = SKILL.read_text(encoding="utf-8")
        self.assertNotIn("project.config.json` 的 `canonical_source", text)
        self.assertIn("canonical lesson registry", text)
        self.assertIn("lesson_key", text)

    def test_focused_procedure_references_exist(self) -> None:
        for name in (
            "source-and-pbi.md",
            "teacher-guide-and-materials.md",
            "pptx-production.md",
            "workflow-and-evidence.md",
        ):
            path = SKILL.parent / "references" / name
            self.assertTrue(path.is_file(), name)
            self.assertGreater(len(path.read_text(encoding="utf-8")), 100)


if __name__ == "__main__":
    unittest.main()
