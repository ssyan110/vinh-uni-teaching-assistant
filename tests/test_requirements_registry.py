from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))
from blocker_contract import BLOCKER_REQUIREMENT_RULES, blocker_record  # noqa: E402
from audit_requirements_coverage import audit as audit_requirements_coverage  # noqa: E402

REGISTRY = ROOT / "docs/workflow/requirements-registry.md"


class RequirementsRegistryTests(unittest.TestCase):
    def test_registry_has_stable_schema_and_unique_ids(self) -> None:
        text = REGISTRY.read_text(encoding="utf-8")
        rows = []
        for line in text.splitlines():
            if not line.startswith("|") or line.startswith("|---") or "requirement_id" in line:
                continue
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) == 6 and re.fullmatch(r"[A-Z]+-\d{3}", cells[0]):
                rows.append(cells)
        self.assertGreaterEqual(len(rows), 20)
        ids = [row[0] for row in rows]
        self.assertEqual(len(ids), len(set(ids)))
        for requirement_id, requirement, owner, scope, verification, status in rows:
            self.assertTrue(requirement)
            self.assertIn("`", owner, requirement_id)
            self.assertTrue(scope)
            self.assertTrue(verification)
            self.assertIn(status, {"active", "legacy-reference", "migration-target"})

    def test_blocker_requirement_mappings_exist_in_registry(self) -> None:
        text = REGISTRY.read_text(encoding="utf-8")
        ids = set(re.findall(r"^\| ([A-Z]+-\d{3}) \|", text, re.MULTILINE))
        for code, requirement_ids in BLOCKER_REQUIREMENT_RULES.items():
            self.assertTrue(requirement_ids, code)
            self.assertTrue(set(requirement_ids) <= ids, code)
            record = blocker_record({"code": code, "message": "test", "scope": "test"})
            self.assertEqual(requirement_ids, record["requirement_ids"])

    def test_registry_links_canonical_files(self) -> None:
        text = REGISTRY.read_text(encoding="utf-8")
        self.assertIn("`PROJECT_REQUIREMENTS.md`", text)
        self.assertIn("`docs/workflow/canonical-workflow-contract.md`", text)
        self.assertTrue((ROOT / "PROJECT_REQUIREMENTS.md").is_file())
        self.assertTrue((ROOT / "docs/workflow/canonical-workflow-contract.md").is_file())

    def test_project_requirements_top_level_sections_are_mapped(self) -> None:
        result = audit_requirements_coverage(ROOT)
        self.assertEqual("clear", result["status"], result["findings"])
        self.assertFalse(result["write_performed"])
        self.assertEqual({"1", "2", "3", "4", "5", "6", "7", "8", "9"}, set(result["sections"]))
        self.assertIn("FILES-001", result["coverage"]["8"])


if __name__ == "__main__":
    unittest.main()
