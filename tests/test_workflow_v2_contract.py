from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lesson_context import resolve_lesson_context  # noqa: E402
from lessonctl import finalized_deck_paths  # noqa: E402


class WorkflowV2ContractTests(unittest.TestCase):
    def test_canonical_workflow_documents_exist(self) -> None:
        self.assertTrue((ROOT / "docs/workflow/canonical-workflow-contract.md").is_file())
        self.assertTrue((ROOT / "docs/workflow/WORKFLOW_V2_OPTIMIZATION_SPEC.md").is_file())

    def test_context_resolution_is_lesson_key_scoped(self) -> None:
        config = json.loads((ROOT / "project.config.json").read_text(encoding="utf-8"))
        active_key = config["active_context"]["lesson_key"]
        self.assertEqual(active_key, "boya-quasi-intermediate-i:lesson-01")

        for lesson_number in (2, 10, 12):
            key = f"boya-quasi-intermediate-i:lesson-{lesson_number:02d}"
            context = resolve_lesson_context(ROOT, key)
            self.assertEqual(context.lesson_key, key)
            self.assertEqual(context.lesson_id, f"lesson-{lesson_number:02d}")
            self.assertEqual(
                context.lesson_root,
                ROOT / f"lessons/boya-quasi-intermediate-i/lesson-{lesson_number:02d}",
            )
            self.assertNotEqual(context.lesson_key, active_key)

    def test_workflow_contract_declares_protected_paths_and_human_gate(self) -> None:
        contract = (ROOT / "docs/workflow/canonical-workflow-contract.md").read_text(
            encoding="utf-8"
        )
        for token in ("20-approved/", "30-qa/", "40-release/", "needs_human", "technical_pass"):
            self.assertIn(token, contract)

    def test_retired_second_coordinator_cannot_run(self) -> None:
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/run_lesson_production.py")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Retired", result.stderr + result.stdout)

    def test_finalized_source_rejects_ambiguous_duplicate(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for suffix in ("a", "b"):
                (root / f"copy-{suffix}").mkdir()
                (root / f"copy-{suffix}" / "lesson-10-在线预习.pptx").write_bytes(b"pptx")
            with self.assertRaisesRegex(ValueError, "ambiguous"):
                finalized_deck_paths("boya-quasi-intermediate-i:lesson-10", root)


if __name__ == "__main__":
    unittest.main()
